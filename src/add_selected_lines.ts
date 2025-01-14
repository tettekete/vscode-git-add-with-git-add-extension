import * as vscode from 'vscode';
import { StatusBarMessageQueue } from './lib/status-bar-message-queue';
import
	{
		isGitTrackedDir, 
		findWorkspaceFolder,
		isGitTrackedFile
	} from './lib/utils';
import { getGitDiff } from './lib/exec-git-commands';
import { MakePatchFromSelection } from './lib/make-patch-from-selection';
import { LineRange } from './lib/line-range';
import { spawnSync } from 'child_process';
import { kMessageTimeOut } from './constants';
import { makePatchForUntrackedFile } from './lib/make-patch-for-untracked-file';
import path from 'node:path';
import { kPatchPaddingSize } from './constants';

import { isUserError } from './lib/user-error';
import type { AnyUserError } from './lib/user-error';
import { dispatchGitStatusUpdateEvent } from './lib/git-status-listener';

export async function git_add_selected_lines()
{
	// validation && get objects
	const editor	= vscode.window.activeTextEditor;
	if (! editor)
	{
		vscode.window.showErrorMessage( vscode.l10n.t('No active file found'),{modal: true});
		return;
	}

	const selection = editor.selection;

	const filePath = editor.document.uri.fsPath;
	const workspaceFolder = findWorkspaceFolder(filePath);

	if ( ! workspaceFolder )
	{
		vscode.window.showErrorMessage( vscode.l10n.t('The active file is not part of any workspace folder.'),{modal: true});
		return;
	}

	if( ! await isGitTrackedDir( workspaceFolder ) )
	{
		vscode.window.showErrorMessage( vscode.l10n.t('There is no git repository in the workspace.'),{modal: true});
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
	
	let patch: string | Error;
	if( await isGitTrackedFile( workspaceFolder , filePath ) )
	{
		// git The file being tracked is
		const diff = getGitDiff( workspaceFolder, filePath ,kPatchPaddingSize);

		// patch = makePatchForLineRange({ diff, selectedRange: selectedLineRange } );
		const patchFromSelection = new MakePatchFromSelection({
			diff: diff,
			selectionRange: selectedLineRange
		});

		patch = patchFromSelection.getPatchString();
	}
	else
	{
		// untracked file
		const rel_path = path.relative( workspaceFolder , filePath );
		patch = makePatchForUntrackedFile({editor,rel_file_path: rel_path});
	}

	if( typeof patch === 'string' && patch.length )
	{
		console.debug(`# patch\n${patch}\n-----`);

		const applyProcess = spawnSync('git', ['apply','--cached'],
		{
			cwd: workspaceFolder,
			input: patch,
			stdio: 'pipe',
			encoding: 'utf-8',
			shell: process.platform === 'win32', // for Windows support
		});

		if (applyProcess.error)
		{
			vscode.window.showErrorMessage( vscode.l10n.t('when apply diff\n{0}',applyProcess.error.message),{modal: true});
			return;
		}
		else if (applyProcess.status !== 0)
		{
			vscode.window.showErrorMessage( vscode.l10n.t('git apply failed:\n{0}',applyProcess.stderr),{modal: true});
			return;
		}
		else
		{
			console.log("Filtered diff applied successfully!");

			dispatchGitStatusUpdateEvent();
			
			StatusBarMessageQueue.getInstance().enqueue(
				vscode.l10n.t('The patch has been successfully applied.'),
				kMessageTimeOut
			);
			return;
		}
	}
	else
	{
		const error = patch as AnyUserError;
		if( isUserError( error ) )
		{
			switch( error.name )
			{
				case 'InformationError':
					vscode.window.showInformationMessage( error.message );
					break;
				
				default:
					vscode.window.showErrorMessage(`Error\n${error.message}`,{modal: true});
			}
		}
		else
		{
			vscode.window.showErrorMessage(`Error\n${error.message}`,{modal: true});
		}
		
	}
}