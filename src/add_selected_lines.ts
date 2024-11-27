import * as vscode from 'vscode';
import { isGitTrackedDir , getGitDiff ,findWorkspaceFolder } from './lib/utils';
import { makePatchForLineRange } from './lib/make-patch-for-line-range';
import { LineRange } from './lib/line-range';

export async function git_add_selected_lines()
{
	// validation && get objects
	const editor	= vscode.window.activeTextEditor;
	if (! editor)
	{
		vscode.window.showErrorMessage(`git-add-with-git-add: No active file found`,{modal: true});
		return;
	}

	const document = editor.document;
	const selection = editor.selection;

	const filePath = editor.document.uri.fsPath;
	const workspaceFolder = findWorkspaceFolder(filePath);

	if ( ! workspaceFolder )
	{
		vscode.window.showErrorMessage('git-add-with-git-add: The active file is not part of any workspace folder.',{modal: true});
		return;
	}

	if( ! await isGitTrackedDir( workspaceFolder ) )
	{
		vscode.window.showErrorMessage('git-add-with-git-add:There is no git repository in the workspace.',{modal: true});
		return;
	}
	
	// get lines
	let startLine:number;
	let endLine:number;

	if ( selection.isEmpty )
	{
		const cursorPosition = selection.active;
		startLine = endLine = cursorPosition.line;
	}
	else
	{
		startLine	= selection.anchor.line;
		endLine		= selection.end.line;
	}


	const selectedLineRange = new LineRange( startLine + 1 , endLine + 1 );

	console.debug(`selectedLineRange.start: ${selectedLineRange.start}`);
	console.debug(`selectedLineRange.end  : ${selectedLineRange.end}`);
	
	// get diff
	const diff = getGitDiff( workspaceFolder, filePath );

	const patch = makePatchForLineRange({ diff, selectedRange: selectedLineRange } );
}