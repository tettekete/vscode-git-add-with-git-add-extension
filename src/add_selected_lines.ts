import * as vscode from 'vscode';
import { isGitTrackedDir , getGitDiff ,findWorkspaceFolder } from './lib/utils';
import { makePatchForLineRange } from './lib/make-patch-for-line-range';
import { LineRange } from './lib/line-range';
import { execSync, spawnSync } from 'child_process';
import { kMessageTimeOut } from './constants';

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
		startLine	= selection.start.line;
		endLine		= selection.end.line;
	}


	const selectedLineRange = new LineRange( startLine + 1 , endLine + 1 );

	console.debug(`selectedLineRange.start: ${selectedLineRange.start}`);
	console.debug(`selectedLineRange.end  : ${selectedLineRange.end}`);
	
	// get diff
	const diff = getGitDiff( workspaceFolder, filePath );

	const patch = makePatchForLineRange({ diff, selectedRange: selectedLineRange } );

	console.debug(`# patch\n${patch}\n-----`);

	if( typeof patch === 'string' && patch.length )
	{
		const applyProcess = spawnSync('git', ['apply','--cached'],
		{
			cwd: workspaceFolder,
			input: patch,
			stdio: 'pipe',
			encoding: 'utf-8',
		});

		if (applyProcess.error)
		{
			vscode.window.showErrorMessage(`git-add-with-git-add: when apply diff\n${applyProcess.error.message}`,{modal: true});
			return;
		}
		else if (applyProcess.status !== 0)
		{
			vscode.window.showErrorMessage(`git-add-with-git-add: "git apply failed:\n${applyProcess.stderr}`,{modal: true});
			return;
		}
		else
		{
			console.log("Filtered diff applied successfully!");
			vscode.window.setStatusBarMessage( `The patch has been successfully applied.` ,kMessageTimeOut);
		}
	}
}