import * as vscode from 'vscode';
import { execGitAddFiles } from './lib/git-add-files';
import { findWorkspaceFolder ,isGitTrackedDir ,isWorkspaceFolder} from './lib/utils';
import path from 'node:path';

export async function git_add_from_explorer(uri: vscode.Uri, selectedFiles?: vscode.Uri[])
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

			const result = await vscode.window.showInformationMessage(
				vscode.l10n.t('If you open the context menu in an empty area of the Explorer, the entire workspace folder will be targeted. Do you want to add everything with git add?'),
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
				vscode.window.showInformationMessage(vscode.l10n.t('Operation canceled.'));
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

	// git add files
	const errors: Error[] = [];
	for( const workspaceFolder in byWorkspaceFolder )
	{
		const result = await execGitAddFiles(
						byWorkspaceFolder[workspaceFolder],
						workspaceFolder
					);
		
		if( result.error !== undefined )
		{
			errors.push( result.error );
		}
	}

	if( errors.length )
	{
		const messages = errors.map((e)=> e.message ).join("\n");
		vscode.window.showWarningMessage(
			vscode.l10n.t('An error occurred during the git add process:\n{0}' , messages )
		);
	}
}