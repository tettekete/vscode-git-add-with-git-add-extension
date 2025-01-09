import * as vscode from 'vscode';
import { execGitCommandWithFiles } from './lib/exec-git-commands';
import {
	ValidGitCommands,
	kGitRestoreStaged,
	kGitRestore,
	kMessageTimeOut
} from './constants';
import {
	findWorkspaceFolder,
	isGitTrackedFile
} from './lib/utils';
import { VSCConfig } from './lib/vsc-config';
import { StatusBarMessageQueue } from './lib/status-bar-message-queue';


async function execGitCommandFromEditorContextMenu(
	gitCommand: ValidGitCommands,
	uri? :vscode.Uri,
	...args:undefined[]
)
{
	let filePath: string | undefined = undefined;
	if( uri )
	{
		filePath = uri.fsPath;
	}
	else
	{
		const editor = vscode.window.activeTextEditor;
		if (! editor)
		{
			vscode.window.showErrorMessage( vscode.l10n.t('No active file found'),{modal: true});
			return;
		}

		filePath = editor.document.uri.fsPath;
	}

	if( ! filePath )
	{
		vscode.window.showErrorMessage( vscode.l10n.t('No active file found'));
		return;
	}

	const files:string[] = [ filePath ];

	const cwd = findWorkspaceFolder( filePath );
	if( cwd === undefined )
	{
		vscode.window.showErrorMessage( vscode.l10n.t('The active file is not part of any workspace folder.') );
		return;
	}

	if( ! await isGitTrackedFile( cwd , filePath ) )
	{
		vscode.window.showWarningMessage( vscode.l10n.t('{file} is untracked file',{file: filePath }) );
	}

	const { error , stdout , stderr } = await execGitCommandWithFiles(
		{
			command: gitCommand,
			files,
			cwd,
			usePeriodWhenEmptyFiles: false
		});
	
	if( error !== undefined )
	{
		vscode.window.showErrorMessage(
			vscode.l10n.t('An error occurred during the {command} process:\n{error}' ,
			{
				command: gitCommand,
				error: stderr
			} )
		 );

		return;
	}
}


// - - - - - - - - - - - - - - - - - - - -
// git_unstage_from_editor
// - - - - - - - - - - - - - - - - - - - -
export async function git_unstage_from_editor(uri?: vscode.Uri, ...args:undefined[] )
{
	execGitCommandFromEditorContextMenu(
		kGitRestoreStaged,
		uri,
		...args
	);
}


// - - - - - - - - - - - - - - - - - - - -
// git_restore_from_editor
// - - - - - - - - - - - - - - - - - - - -
export async function git_restore_from_editor(uri?: vscode.Uri, ...args:undefined[] )
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

	execGitCommandFromEditorContextMenu(
		kGitRestore,
		uri,
		...args
	);
}