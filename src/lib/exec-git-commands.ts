import * as vscode from 'vscode';
import {
	exec,
	execSync,
	spawnSync
} from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { escapeArgumentForShell } from './utils';
import { dispatchGitStatusUpdateEvent } from './git-status-listener';

import type { ValidGitCommands } from '../constants';
import {
	kGitAdd,
	kGitAddUpdate,
	kGitRestoreStaged,
	kGitRestore,
	kGitDiff
} from '../constants';


const execAsync = promisify(exec);

type CommandResult = {
	error: Error | undefined,
	stdout: string,
	stderr: string
};

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

	const {error ,stdout } = execGitCommandSync({
		command: kGitDiff,
		options: [unified_option],
		files:[file_path],
		cwd: repo_dir,
		isStatusChangingCommand: false
	});

	if( error )
	{
		vscode.window.showErrorMessage(`Error: ${error.message}`);
	}
	else if( stdout.length )
	{
		return stdout;
	}

	return '';
}


/**
 * --cahced vesion of getGitDiff()
 *
 * @export
 * @param {string} repo_dir 
 * @param {string} file_path 
 * @param {(number | undefined)} [unified=undefined] 
 * @returns {string} 
 */
export function getGitDiffCached(
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

	const {error ,stdout } = execGitCommandSync({
		command: kGitDiff,
		options: ['--cached' , unified_option],
		files:[file_path],
		cwd: repo_dir,
		isStatusChangingCommand: false
	});

	if( error )
	{
		vscode.window.showErrorMessage(`Error: ${error.message}`);
	}
	else if( stdout.length )
	{
		return stdout;
	}

	return '';
}


export async function execGitAddFiles( files: string[] ,cwd: string ):Promise<CommandResult>
{
	return await execGitCommandWithFiles(
		{
			command: kGitAdd,
			files,
			cwd,
			isStatusChangingCommand: true
		});
}


export async function execGitRestoreStaged( files: string[] ,cwd: string ,isStatusChangingCommand = true):Promise<CommandResult>
{
	return await execGitCommandWithFiles(
		{
			command: kGitRestoreStaged,
			files,
			cwd,
			isStatusChangingCommand
		});
}


export async function execGitCommandWithFiles(
	{
		command
		,options = []
		,files
		,cwd
		,usePeriodWhenEmptyFiles = false
		,isStatusChangingCommand = false
	}:
	{
		command: ValidGitCommands,
		options?: string[],
		files: string[] ,
		cwd: string,
		usePeriodWhenEmptyFiles?: boolean,
		isStatusChangingCommand?: boolean
	}
):Promise<CommandResult>
{
	return execGitCommand(
		{
			command
			,options
			,files
			,cwd
			,usePeriodWhenEmptyFiles
			,isStatusChangingCommand
		}
	);
}


export async function execGitCommand(
	{
		 command
		,options = []
		,files = []
		,cwd
		,usePeriodWhenEmptyFiles = false
		,isStatusChangingCommand = false
	}:
	{
		command: ValidGitCommands,
		options?: string[],
		files?: string[] ,
		cwd: string,
		usePeriodWhenEmptyFiles?: boolean,
		isStatusChangingCommand?:boolean
	}
):Promise<CommandResult>
{
	const commandText = _buildCommand({
		command,
		options,
		files,
		cwd,
		usePeriodWhenEmptyFiles
	});

	const execOption:{[key: string]:unknown} = {};

	if( cwd )
	{
		execOption['cwd'] = cwd;
	}
	
	let _stdout:string = '';
	let _stderr:string = '';
	let error:Error|undefined = undefined;
	try
	{
		const { stdout , stderr } = await execAsync(
			commandText,
			execOption,
		);

		_stdout = stdout;
		_stderr = stderr;
	}
	catch( e )
	{
		if( e instanceof Error )
		{
			error = e;
		}
		else
		{
			error = Error(`${e}`);
		}
	}

	if( ! error )
	{
		if( isStatusChangingCommand )
		{
			dispatchGitStatusUpdateEvent();
		}
	}

	return {
		error: error,
		stdout: _stdout,
		stderr: _stderr
	};
}

/**
 * exec git command with `execSync`
 *
 * Since kValidGitCommands is currently defined in a format that includes options,
 * it will be implemented using execSync.
 *
 * オプションを含む形式で kValidGitCommands を定義しているため execSync で実装します
 *
 * @export
 * @param {{
 * 		command: ValidGitCommands,
 * 		options?: string[],
 * 		files?: string[] ,
 * 		cwd: string,
 * 		usePeriodWhenEmptyFiles?: boolean
 *		isStatusChangingCommand?: boolean
 * 	}} param0 
 * @param {ValidGitCommands} param0.command 
 * @param {{}} [param0.options=[]] 
 * @param {{}} [param0.files=[]] 
 * @param {string} param0.cwd 
 * @param {boolean} [param0.usePeriodWhenEmptyFiles=false]
 * @param {boolean} [param0.isStatusChangingCommand=false] 
 */
export function execGitCommandSync(
	{
		command
		,options = []
		,files = []
		,cwd
		,usePeriodWhenEmptyFiles = false
		,isStatusChangingCommand = false
	}:
	{
		command: ValidGitCommands,
		options?: string[],
		files?: string[] ,
		cwd: string,
		usePeriodWhenEmptyFiles?: boolean
		isStatusChangingCommand?: boolean
	}
):
{
	error: Error | undefined;
	stdout: string
}
{
	// build command
	const commandText = _buildCommand({
		command,
		options,
		files,
		cwd,
		usePeriodWhenEmptyFiles
	});

	// option for execSync()
	const execOption:{[key: string]:unknown} = {};

	if( cwd )
	{
		execOption['cwd'] = cwd;
	}

	let _stdout:string = '';
	let error:Error|undefined = undefined;
	try
	{
		const resultBuff = execSync(
			commandText,
			execOption
		);

		_stdout = resultBuff.toString();
	}
	catch( e )
	{
		error = (e as Error);
	}

	if( error === undefined )
	{
		if( isStatusChangingCommand )
		{
			dispatchGitStatusUpdateEvent();
		}
	}

	return {
		error,
		stdout: _stdout
	};
}

export function execGitCommandWithPipe(
	{
		command
		,options = []
		,files = []
		,stdin
		,cwd
		,usePeriodWhenEmptyFiles = false
		,isStatusChangingCommand = false
	}:
	{
		command: ValidGitCommands,
		options?: string[],
		files?: string[] ,
		stdin: string,
		cwd: string,
		usePeriodWhenEmptyFiles?: boolean
		isStatusChangingCommand?: boolean
	}
):
{
	error: Error | undefined;
	stdout: string;
	stderr: string;
	status: number | null;
}
{
	const applyProcess = spawnSync(
			command,
			options,
			{
				cwd: cwd,
				input: stdin,
				stdio: 'pipe',
				encoding: 'utf-8',
				shell: process.platform === 'win32', // for Windows support
			});
	
	if( applyProcess.error === undefined )
	{
		if( isStatusChangingCommand )
		{
			dispatchGitStatusUpdateEvent();
		}
	}

	return {
		error:	applyProcess.error,
		stdout:	applyProcess.stdout,
		stderr:	applyProcess.stderr,
		status: applyProcess.status
	};
}

function _buildCommand(
	{
		command
		,options = []
		,files = []
		,cwd
		,usePeriodWhenEmptyFiles = false
	}:
	{
		command: ValidGitCommands,
		options?: string[],
		files?: string[] ,
		cwd: string,
		usePeriodWhenEmptyFiles?: boolean
	}
):string
{
	const cmdList:string[] = [command];
	const filesAsArgs = files.map((file) =>
	{
		let relPath = file;
		if( path.isAbsolute( relPath ) )
		{
			relPath = path.relative( cwd , file );
		}

		return escapeArgumentForShell( relPath );
	});

	// handle command options
	if( options.length > 0 )
	{
		options.forEach(( _option ) =>
		{
			cmdList.push( _option );
		});
	}

	// append files
	if( filesAsArgs.length > 0 )
	{
		filesAsArgs.forEach(( file ) =>
		{
			cmdList.push( file );
		});
	}
	else if( usePeriodWhenEmptyFiles )
	{
		cmdList.push( '.' );
	}

	// build command
	const commandText = cmdList.join(' ');
	
	return commandText;
}
