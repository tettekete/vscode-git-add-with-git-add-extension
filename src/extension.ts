import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const _message_time_out = 4000;
const execAsync = promisify(exec);
/**
 * Find the workspace folder that contains the given file path.
 * @param filePath The file path to check.
 * @returns The root path of the workspace folder, or `undefined` if not found.
 */
function findWorkspaceFolder(filePath: string): string | undefined
{
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if ( ! workspaceFolders )
	{
        return undefined;
    }

	for (const folder of workspaceFolders)
	{
		if (filePath.startsWith(folder.uri.fsPath))
		{
			return folder.uri.fsPath;
		}
	}

    return undefined;
}

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

function git_add()
{
	const editor = vscode.window.activeTextEditor;
	if (! editor)
	{
		vscode.window.showErrorMessage(`git-add-with-git-add: No active file found`,{modal: true});
		return;
	}

	const filePath = editor.document.uri.fsPath;
	const workspaceFolder = findWorkspaceFolder(filePath);

	if ( ! workspaceFolder )
	{
		vscode.window.showErrorMessage('git-add-with-git-add: The active file is not part of any workspace folder.',{modal: true});
		return;
	}

	// Check if the workspace folder is a Git repository
	exec(
		'git rev-parse --is-inside-work-tree',
		{ cwd: workspaceFolder },
		(error, stdout, stderr) => 
		{
			if (error) {
				vscode.window.showErrorMessage('git-add-with-git-add:There is no git repository in the workspace.',{modal: true});
				return;
			}

			const rel_path = path.relative( workspaceFolder , filePath );

			// Execute `git add` for the current file
			exec(
				`git add "${rel_path}"`,
				{ cwd: workspaceFolder },
				(error, stdout, stderr) =>
				{
					if (error)
					{
						vscode.window.showErrorMessage(`Git Add Failed:`,
						{
							detail: `message: ${error.message}\n\nSTDERR: ${stderr}`,
							modal: true
						});
					}
					else
					{
						// vscode.window.showInformationMessage(`Git Add Successful: ${rel_path}`);
						vscode.window.setStatusBarMessage( `git add ${rel_path} succeeded.` ,_message_time_out);
					}
				}
			);
		}
	);
}

async function git_add_u()
{
	const git_trackde_dirs = await findGitTrackedDirs();

	if( ! git_trackde_dirs )
	{
		vscode.window.showErrorMessage('This project does not have a git repository.',{modal:true});
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
							`Error: git add -u failed.`,
							{
								detail: `message: ${error.message}\n\nSTDERR: ${stderr}`,
								modal: true
							});
					return;
				}
				
				vscode.window.setStatusBarMessage( `git add -u completed successfully.` ,_message_time_out);
			}
		);
	}
}

export function activate(context: vscode.ExtensionContext)
{
	const run_git_add	= vscode.commands.registerCommand('tettekete.git-add-with-git-add', git_add );
	const run_git_ad_u	= vscode.commands.registerCommand('tettekete.git-add-with-git-add-u', git_add_u );

	context.subscriptions.push( run_git_add ,run_git_ad_u );
}

// This method is called when your extension is deactivated
export function deactivate() {}
