import * as vscode from 'vscode';
import { execGitCommandWithFiles } from './lib/exec-git-commands';
import {
	findWorkspaceFolder,
	isGitTrackedDir,
	isWorkspaceFolder,
	isGitTrackedFile
} from './lib/utils';
import path from 'node:path';
import { kMessageTimeOut } from './constants';
import { StatusBarMessageQueue } from './lib/status-bar-message-queue';
import type { ValidGitCommands } from './constants';
import {
	kGitAdd,
	kGitAddUpdate,
	kGitRestoreStaged,
	kGitRestore,
} from './constants';
import { VSCConfig } from './lib/vsc-config';

const dialogOnExecRestoreConfigKey = 'git-add-with-git-add.dialogOnExecRestore';

// - - - - - - - - - - - - - - - - - - - -
// git_add_from_explorer
// - - - - - - - - - - - - - - - - - - - -
export async function git_add_from_explorer(uri: vscode.Uri, selectedFiles?: vscode.Uri[])
{
	git_command_from_explorer({ command: kGitAdd , uri , selectedFiles });
}

// - - - - - - - - - - - - - - - - - - - -
// git_add_u_from_explorer
// - - - - - - - - - - - - - - - - - - - -
export async function git_add_u_from_explorer(uri: vscode.Uri, selectedFiles?: vscode.Uri[])
{
	git_command_from_explorer(
		{
			command:kGitAddUpdate,
			uri,
			selectedFiles,
			preExecCallback: untrackedFileWarning
		});
}

// - - - - - - - - - - - - - - - - - - - -
// git_unstage_from_explorer
// - - - - - - - - - - - - - - - - - - - -
export async function git_unstage_from_explorer(uri: vscode.Uri, selectedFiles?: vscode.Uri[])
{
	git_command_from_explorer(
		{
			command:kGitRestoreStaged,
			uri,
			selectedFiles,
			preExecCallback: untrackedFileWarning
		});
}

// - - - - - - - - - - - - - - - - - - - -
// git_restore_from_explorer
// - - - - - - - - - - - - - - - - - - - -
export async function git_restore_from_explorer(uri: vscode.Uri, selectedFiles?: vscode.Uri[])
{
	// git restore は破壊的なコマンドであるためダイアログを出します
	const showDialog	= VSCConfig.dialogOnExecRestore();

	if( showDialog )
	{
		const okLabel		= vscode.l10n.t('OK');
		const cancelLabel	= vscode.l10n.t('Cancel');
		const dialogMessage = vscode.l10n.t('git restore will discard all the changes you made. Are you sure you want to proceed?');

		const result	= await vscode.window.showInformationMessage(
							dialogMessage,
							{
								modal: true
							},
							cancelLabel,
							okLabel
						);
		
		if (result !== okLabel )
		{
			StatusBarMessageQueue.getInstance().enqueue(vscode.l10n.t('Operation canceled.') ,kMessageTimeOut);
			return;
		}
	}

	git_command_from_explorer(
		{
			command: kGitRestore,
			uri,
			selectedFiles,
			preExecCallback: untrackedFileWarning
		} );
}

async function untrackedFileWarning( files: string[] , workspace: string )
{
	for(const file of files )
	{
		if( ! await isGitTrackedFile( workspace , file ) )
		{
			const relPath = path.relative( workspace , file );
			StatusBarMessageQueue.getInstance().enqueue(
				vscode.l10n.t('{file} is untracked file',{file: relPath }),
				kMessageTimeOut
			);
		}
	}
}

// - - - - - - - - - - - - - - - - - - - -
// private: git_command_from_explorer
// - - - - - - - - - - - - - - - - - - - -
async function git_command_from_explorer( 
	{
		command
		,uri
		,selectedFiles
		,preExecCallback
	}:
	{
		command:ValidGitCommands,
		uri: vscode.Uri,
		selectedFiles?: vscode.Uri[],
		preExecCallback?: (files:string[] , workspaceFolder:string ) => Promise<void>
	}
)
{
	if( !( uri instanceof vscode.Uri ) )
	{
		vscode.window.showWarningMessage(
			vscode.l10n.t('This command can only be executed from the Explorer.')
		);
	}

	if( ! selectedFiles )
	{
		selectedFiles = [];
	}

	// Check whether the target is a workspace folder. 
	let isTargetWorkspaceFolder = false;
	let usePeriodWhenEmptyFiles = false;

	if( ! selectedFiles.length )
	{
		if( isWorkspaceFolder( uri.fsPath ) )
		{
			isTargetWorkspaceFolder = true;
		}
		else
		{
			vscode.window.showInformationMessage(
				vscode.l10n.t('No file is selected.')
			);
			return;
		}
	}

	// Create a file list grouped by each workspace folder.
	const byWorkspaceFolder:{[key:string]: string[]} = {};
	if( isTargetWorkspaceFolder )
	{
		const config        		= vscode.workspace.getConfiguration();
		const requiresConfirmation	= config.get<boolean>('git-add-with-git-add.dialogOnWorkspaceSelection');

		if( requiresConfirmation )
		{
			const okLabel		= vscode.l10n.t('OK');
			const cancelLabel	= vscode.l10n.t('Cancel');
			const okDontDialog	= vscode.l10n.t("OK Don't show this dialog again");
			const dialogMessage = vscode.l10n.t('Do you want to run "{command}" on the entire workspace folder?',{command});
			const dialogDetail	= vscode.l10n.t('For Reference: You can configure this dialog to not appear when the entire workspace folder is targeted.');
			
			const result = await vscode.window.showInformationMessage(
				dialogMessage,
				{
					modal: true,
					detail: dialogDetail
				},
				cancelLabel,
				okLabel,
				okDontDialog
			);

			if (result !== okLabel && result !== okDontDialog )
			{
				StatusBarMessageQueue.getInstance().enqueue(
					vscode.l10n.t('Operation canceled.'),
					kMessageTimeOut
				);
				return;
			}

			if( result === okDontDialog )
			{
				await vscode.workspace.getConfiguration().update(
					'git-add-with-git-add.dialogOnWorkspaceSelection',
					false,
					vscode.ConfigurationTarget.Global
				);
			}
		}

		byWorkspaceFolder[uri.fsPath] = [];
		usePeriodWhenEmptyFiles = true;
	}
	else
	{
		// エクスプローラー上でワークスペースを跨がっての選択は出来無いはずだが、念のため
		// {"waorkspace-folder": [ "file1" ,"file2" ,... ] というデータ構造に整理します。
		// このデータ構造の方がワークスペースフォルダ全体が対象のケースも同じ処理で回しやすいという
		// 利点もあります。
		for(const fileUri of selectedFiles )
		{
			const file = fileUri.fsPath;
			const workspaceFolder = findWorkspaceFolder( file );

			if( workspaceFolder === undefined )
			{
				continue;
			}

			if( ! await isGitTrackedDir( workspaceFolder ) )
			{
				continue;
			}

			if( ! byWorkspaceFolder.hasOwnProperty( workspaceFolder ) )
			{
				byWorkspaceFolder[workspaceFolder] = [ file ];
			}
			else
			{
				byWorkspaceFolder[workspaceFolder].push( file );
			}
		}
	}
	
	// exec git commands
	const errors: Error[] = [];
	const warnings: {[key:string]: number } = {};
	for( const workspaceFolder in byWorkspaceFolder )
	{
		if( preExecCallback )
		{
			await preExecCallback( byWorkspaceFolder[workspaceFolder] , workspaceFolder );
		}

		const result = await execGitCommandWithFiles(
						{
							command,
							files: byWorkspaceFolder[workspaceFolder],
							cwd: workspaceFolder,
							usePeriodWhenEmptyFiles
						}
					);
		
		if( result.error !== undefined )
		{
			if( command === kGitRestoreStaged )
			{
				if( result.error.message.match( /did not match any file\(s\) known to git/ ) )
				{
					// If the command is Unstage and the error message is for an un-tracked file, make it a low-key warning
					const warn = vscode.l10n.t('There were files that were not being tracked');
					if(! warnings.hasOwnProperty( warn ) )
					{
						warnings[warn] = 0;
					}
					warnings[warn] ++;

					continue;
				}
			}
			errors.push( result.error );
		}
		else
		{
			let file = byWorkspaceFolder[workspaceFolder]
						.map((absPath) => {return path.relative( workspaceFolder , absPath );} )
						.join(' ');
			
			if( isTargetWorkspaceFolder )
			{
				file = '.';
			}
			else if( file.length > 32 )
			{
				file = file.substring(0,32) + '...';
			}

			StatusBarMessageQueue.getInstance().enqueue( 
				vscode.l10n.t('{command} {file} completed successfully',{command,file}),
				kMessageTimeOut
			);
		}
	}

	if( errors.length )
	{
		const messages = errors.map((e)=> e.message ).join("\n");
		vscode.window.showWarningMessage(
			vscode.l10n.t('An error occurred during the {command} process:\n{error}' , {command,error:messages} )
		);
		
		return;
	}

	if( Object.keys( warnings ).length )
	{
		for(const warn in warnings )
		{
			StatusBarMessageQueue.getInstance().enqueue( warn , kMessageTimeOut );
		}
	}	
}