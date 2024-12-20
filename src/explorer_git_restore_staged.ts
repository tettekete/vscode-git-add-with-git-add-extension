import * as vscode from 'vscode';

export function git_unstage_from_explorer(uri: vscode.Uri, selectedFiles?: vscode.Uri[])
{
	if (selectedFiles && selectedFiles.length > 0)
	{
		const filePaths = selectedFiles.map(file => file.fsPath);
		console.debug(`selected files: \n${filePaths.join('\n')}`);
	}
	else if (uri)
	{
		console.debug(`selected file: \n${uri.fsPath}`);
	}
	else
	{
		vscode.window.showInformationMessage('There are no selected files.');
	}
}