import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

import {
	findWorkspaceFolder,
	isGitTrackedDir
} from './lib/utils';

import { StatusBarMessageQueue } from './lib/status-bar-message-queue';
import { execGitAddFiles } from './lib/exec-git-commands';
import { git_add_selected_lines } from './add_selected_lines';
import { git_add_from_explorer } from './explorer_git';
import { git_restore_from_explorer } from './explorer_git';
import { git_unstage_from_explorer } from './explorer_git';
import { git_add_u_from_explorer } from './explorer_git';

import { kMessageTimeOut } from './constants';

const execAsync = promisify(exec);

/**
 * Returns a list of directory paths from vscode. workspace.workspaceFolders to which
 * git tracking is applied. Returns undefined if the target directory does not exist.
 *
 * @returns A list of directory paths being tracked by git. If not, `undefined` is returned.
 */

async function findGitTrackedDirs():Promise<string[] | undefined>
{
	const workspaceFolders = vscode.workspace.workspaceFolders;

	if( ! workspaceFolders ){ return undefined; }

	const git_tracked_path_list: string[] = [];

	for (const folder of workspaceFolders)
	{
		const file_path = folder.uri.fsPath;
		let is_tracked_dir = true;
		try
		{
			const { stdout, stderr } = await execAsync(
				'git rev-parse --is-inside-work-tree',
				{ cwd: file_path },
			);
		}
		catch( e )
		{
			is_tracked_dir = false;
		}
        
		if( is_tracked_dir )
		{
			git_tracked_path_list.push( file_path );
		}
    }

	if( git_tracked_path_list.length )
	{
		return git_tracked_path_list;
	}
	
	return undefined;
}

async function git_add()
{
	const editor = vscode.window.activeTextEditor;
	if (! editor)
	{
		vscode.window.showErrorMessage(vscode.l10n.t('No active file found'),{modal: true});
		return;
	}

	const filePath = editor.document.uri.fsPath;
	const workspaceFolder = findWorkspaceFolder(filePath);

	if ( ! workspaceFolder )
	{
		vscode.window.showErrorMessage(vscode.l10n.t('The active file is not part of any workspace folder.'),{modal: true});
		return;
	}

	// Check if the workspace folder is a Git repository
	if( await isGitTrackedDir( workspaceFolder ) )
	{
		const r = await execGitAddFiles( [filePath] , workspaceFolder );

		const rel_path = path.relative( workspaceFolder , filePath );
		if( r.error )
		{
			vscode.window.showErrorMessage(
				vscode.l10n.t('git add "{0}" Failed:',rel_path),
				{
					detail: `message: ${r.error.message}\n\nSTDERR: ${r.stderr}`,
					modal: true
				});
		}
		else
		{
			StatusBarMessageQueue.getInstance().enqueue(
				vscode.l10n.t('git add "{0}" succeeded.',rel_path),
				kMessageTimeOut
			);
		}
	}
	else
	{
		vscode.window.showErrorMessage(
			vscode.l10n.t('The workspace folder is not a git repository.')
		);
	}
}

async function git_add_u()
{
	const git_trackde_dirs = await findGitTrackedDirs();

	if( ! git_trackde_dirs )
	{
		vscode.window.showErrorMessage(vscode.l10n.t('This project does not have a git repository.'),{modal:true});
		return;
	}

	for( const dir of git_trackde_dirs )
	{
		exec(
			'git add -u',
			{ cwd: dir },
			(error, stdout, stderr) =>
			{
				if (error)
				{
					vscode.window.showErrorMessage(
							vscode.l10n.t('git add -u failed.'),
							{
								detail: `message: ${error.message}\n\nSTDERR: ${stderr}`,
								modal: true
							});
					return;
				}
				
				StatusBarMessageQueue.getInstance().enqueue( vscode.l10n.t('git add -u completed successfully.') ,kMessageTimeOut);
			}
		);
	}
}

export function activate(context: vscode.ExtensionContext)
{
	const run_git_add	= vscode.commands.registerCommand('tettekete.git-add-with-git-add', git_add );
	const run_git_add_u	= vscode.commands.registerCommand('tettekete.git-add-with-git-add-u', git_add_u );
	const run_git_add_l	= vscode.commands.registerCommand('tettekete.git-add-with-git-add-selected-lines', git_add_selected_lines );
	const run_git_add_from_explorer		= vscode.commands.registerCommand('tettekete.git-add-wga-from-explorer', git_add_from_explorer );
	const run_git_add_u_from_explorer	= vscode.commands.registerCommand('tettekete.git-add-wga-u-from-explorer', git_add_u_from_explorer );
	const run_restore_from_explorer		= vscode.commands.registerCommand('tettekete.git-add-wga-restore-from-explorer', git_restore_from_explorer );
	const run_unstage_from_explorer		= vscode.commands.registerCommand('tettekete.git-add-wga-unstage-from-explorer', git_unstage_from_explorer );

	context.subscriptions.push(
								run_git_add,
								run_git_add_u,
								run_git_add_l,
								run_git_add_from_explorer,
								run_git_add_u_from_explorer,
								run_restore_from_explorer,
								run_unstage_from_explorer
							);
}

// This method is called when your extension is deactivated
export function deactivate() {}
