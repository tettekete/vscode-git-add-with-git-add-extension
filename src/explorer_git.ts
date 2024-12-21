import * as vscode from 'vscode';
import { execCommandWithFiles } from './lib/exec-git-commands';
import { findWorkspaceFolder ,isGitTrackedDir ,isWorkspaceFolder} from './lib/utils';
import path from 'node:path';
import { kMessageTimeOut } from './constants';

const kGitAddCommand	= 'git add';
const kGitRestoreStaged	= 'git restore --staged';

export async function git_add_from_explorer(uri: vscode.Uri, selectedFiles?: vscode.Uri[])
{
	git_command_from_explorer( kGitAddCommand , uri , selectedFiles );
}

export async function git_unstage_from_explorer(uri: vscode.Uri, selectedFiles?: vscode.Uri[])
{
	git_command_from_explorer( kGitRestoreStaged , uri , selectedFiles );
}

async function git_command_from_explorer( command:string , uri: vscode.Uri, selectedFiles?: vscode.Uri[])
{
	if( ! uri )
	{
		vscode.window.showWarningMessage(
			vscode.l10n.t('This command can only be executed from the Explorer.')
		);
	}

	const fileList:string[] = [];
	if (selectedFiles && selectedFiles.length > 0)
	{
		selectedFiles.forEach((file) =>
		{
			fileList.push( file.fsPath );
		});
		
		console.debug(`selected files: \n${fileList.join('\n')}`);
	}
	else if( uri )
	{
		console.debug(`selected file: \n${uri.fsPath}`);

		if( isWorkspaceFolder( uri.fsPath ) )
		{
			/*
			Even when a file is selected in the Explorer via the GUI, opening the context
			menu in an empty area of the Explorer results in the directory of the workspace
			folder being passed, likely due to a design flaw in the VSCode API.

			It is unlikely that this 'invisible' behavior aligns with the user's intent.

			Therefore, a dialog is displayed to confirm the user's intent. Additionally,
			since the need to perform a `git add` on the entire project is rare, the default
			button in the dialog is set to 'Cancel'.
			*/
			const okLabel		= vscode.l10n.t('OK');
			const cancelLabel	= vscode.l10n.t('Cancel');
			let dialogMessage = '';
			switch( command )
			{
				case kGitAddCommand:
					dialogMessage = vscode.l10n.t('If you open the context menu in an empty area of the Explorer, the entire workspace folder will be targeted. Do you want to add everything with git add?');
					break;
				
				case kGitRestoreStaged:
					dialogMessage = vscode.l10n.t('If you open the context menu in an empty area of the Explorer, the entire workspace folder will be targeted. Do you want to unstage everything with git restore --staged?');
					break;

				default:
					dialogMessage = vscode.l10n.t('If you open the context menu in an empty area of the Explorer, the entire workspace folder will be targeted. Do you want to proccess everything?');
					break;
			}

			const result = await vscode.window.showInformationMessage(
				dialogMessage,
				{ modal: true },
				cancelLabel,
				okLabel
			);

			if (result === okLabel)
			{
				fileList.push( path.join( uri.fsPath , '*' ) );
			}
			else
			{
				vscode.window.setStatusBarMessage(vscode.l10n.t('Operation canceled.') ,kMessageTimeOut);
			} 
		}
		else
		{
			fileList.push( uri.fsPath );
		}
	}
	else
	{
		vscode.window.showInformationMessage(
			vscode.l10n.t('No file is selected.')
		);
		return;
	}

	// 選択されたファイルは異なるリポジトリ = workspace フォルダーに跨がっている可能性があるので
	// それぞれに分離します。

	const byWorkspaceFolder:{[key:string]: string[]} = {};
	for(const file of fileList )
	{
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

	// exec git commands
	const errors: Error[] = [];
	const warnings: {[key:string]: number } = {};
	for( const workspaceFolder in byWorkspaceFolder )
	{
		const result = await execCommandWithFiles(
						command,
						byWorkspaceFolder[workspaceFolder],
						workspaceFolder
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
	}

	if( errors.length )
	{
		const messages = errors.map((e)=> e.message ).join("\n");
		vscode.window.showWarningMessage(
			vscode.l10n.t('An error occurred during the {command} process:\n{error}' , {command,error:messages} )
		);
	}

	if( Object.keys( warnings ).length )
	{
		for(const warn in warnings )
		{
			vscode.window.setStatusBarMessage( warn ,kMessageTimeOut);
		}
	}
}