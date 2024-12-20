import * as vscode from 'vscode';
import { execSync ,exec } from 'child_process';
import { promisify } from 'util';
import path from 'node:path';

const execAsync = promisify(exec);

/**
 * Get the Git diff for a specific file within a repository.
 * 
 * This function retrieves the output of the `git diff` command for a given file path,
 * executed in the specified repository directory. If there is no difference, an empty
 * string is returned.
 * 
 * @param {string} repo_dir - The path to the Git repository directory.
 * @param {string} file_path - The path to the file to check for differences.
 * @param {number | undefined} unified - Default is 'undefined'. When a number is received, it is executed with the '--unified' option.
 * @returns {string} The Git diff output as a string, or an empty string if there are no differences.
 */
export function getGitDiff(
							repo_dir:string ,
							file_path: string ,
							unified: number | undefined = undefined
						):string
{
	let unified_option = '';
	if( typeof unified === 'number' )
	{
		unified_option = `--unified=${unified}`;
	}

	const stdout = execSync(
								`git diff ${unified_option} "${file_path}"`,
								{cwd: repo_dir }
							).toString();
	if( stdout.length )
	{
		return stdout;
	}

	return '';
}


/**
 * Checks if a given directory is tracked by Git.
 * 
 * This function determines whether the specified directory is part of a Git repository
 * by executing the `git rev-parse --is-inside-work-tree` command within the directory.
 * 
 * @async
 * @param {string} directory - The path to the directory to check.
 * @returns {Promise<boolean>} A promise that resolves to `true` if the directory is tracked by Git, or `false` otherwise.
 */
export async function isGitTrackedDir( directory: string ):Promise<boolean>
{
	let is_tracked = true;
	try
	{
		const { stdout , stderr } = await execAsync(
			'git rev-parse --is-inside-work-tree',
			{ cwd: directory },
		);
	}
	catch( e )
	{
		is_tracked = false;
	}

	return is_tracked;
}

export async function isGitTrackedFile( repo_dir: string ,file_path: string )
{
	let is_tracked = true;

	try
	{
		const { stdout , stderr } = await execAsync(
			`git ls-files --error-unmatch ${file_path}`,
			{ cwd: repo_dir },
		);
	}
	catch( e )
	{
		is_tracked = false;
	}

	return is_tracked;
}

/**
 * Find the workspace folder that contains the given file path.
 * @param filePath The file path to check.
 * @returns The root path of the workspace folder, or `undefined` if not found.
 */
export function findWorkspaceFolder(filePath: string): string | undefined
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
 * Checks whether the specified directory path exactly matches one of the workspace
 * folders in the current VSCode workspace.
 *
 * The directory path is normalized for comparison, so you don't need to worry
 * about the end of the path.
 *
 * @param {string} dirPath - The path of the directory to check.
 * @returns {boolean} `true` if the directory matches a workspace folder; otherwise, `false`.
 */
export function isWorkspaceFolder( dirPath: string ):boolean
{
	const workspaceFolders = vscode.workspace.workspaceFolders;

	if ( ! workspaceFolders )
	{
		return false;
	}

	const normalizedDirPath = path.normalize( dirPath );

	for (const folder of workspaceFolders)
	{
		const normalizedFolder = path.normalize( folder.uri.fsPath );
		if ( normalizedDirPath === normalizedFolder )
		{
			return true;
		}
	}

	return false;
}

