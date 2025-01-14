import * as vscode from 'vscode';
import { execSync ,exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import path from 'node:path';
import { LineRange } from './line-range';

const execAsync = promisify(exec);

export async function ReadyToGitTrackedSelection()
:
Promise<{
	workspace: string;
	filePath: string;
	lineRange: LineRange;
}| Error>
{
	const editor	= vscode.window.activeTextEditor;
	if (! editor)
	{
		return Error( vscode.l10n.t('No active file found') );
	}

	const filePath = editor.document.uri.fsPath;
	const workspace = findWorkspaceFolder(filePath);

	if ( ! workspace )
	{
		return Error( vscode.l10n.t('The active file is not part of any workspace folder.') );
	}

	if( ! await isGitTrackedDir( workspace ) )
	{
		return Error( vscode.l10n.t('There is no git repository in the workspace.') );
	}

	// get seletion
	const selection = editor.selection;
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

	const lineRange = new LineRange( startLine + 1 , endLine + 1 );
	
	return {
		workspace,
		filePath,
		lineRange
	};
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
		let relPath = file_path;
		if( path.isAbsolute( file_path ) )
		{
			relPath = path.relative( repo_dir , file_path );
		}
		
		const safePath = escapeArgumentForShell( relPath );
		const { stdout , stderr } = await execAsync(
			`git ls-files --error-unmatch ${safePath}`,
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

/**
 * Escapes a string to make it safe for use as a shell command argument.
 * 
 * This function ensures that the provided argument is properly escaped for
 * the target platform (Windows or Unix-like systems), preventing issues
 * such as command injection or improper parsing of special characters.
 * 
 * @param {string} argument - The string to escape.
 * @returns {string} The escaped string, safe for use in a shell command.
 */
export function escapeArgumentForShell( argument: string ): string
{
	const platform = os.platform();

	if (platform === 'win32')
	{
		// Windows: Enclose in double quotes and escape the double quotes.
		return `"${argument.replace(/"/g, '\\"')}"`;
	}
	else
	{
		// macOS/Linux: Enclose in single quotes and escape the single quotes.
		return `'${argument.replace(/'/g, "'\\''")}'`;
	}
}


export function renderTemplate(
	template: string ,
	kvObject:Record<string,string | number>
):string
{
	return template.replace(
		/\$\{(\w[\w\-]*)\}/g,
		(match,key) =>
		{
			return key in kvObject ? `${kvObject[key]}` : '';
		}
	);
}

export function escapeRegexMeta(str: string): string
{
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
