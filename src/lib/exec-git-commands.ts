import * as vscode from 'vscode';
import { exec,execSync } from 'node:child_process';
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
} from '../constants';


const execAsync = promisify(exec);

type CommandResult = {
	error: Error | undefined,
	stdout: string,
	stderr: string
};


export async function execGitAddFiles( files: string[] ,cwd: string ):Promise<CommandResult>
{
	return await execGitCommandWithFiles(
		{
			command: kGitAdd,
			files,
			cwd
		});
}


export async function execGitRestoreStaged( files: string[] ,cwd: string ):Promise<CommandResult>
{
	return await execGitCommandWithFiles(
		{
			command: kGitRestoreStaged,
			files,
			cwd
		});
}


export async function execGitCommandWithFiles(
	{
		command
		,options = []
		,files
		,cwd
		,usePeriodWhenEmptyFiles = false
	}:
	{
		command: ValidGitCommands,
		options?: string[],
		files: string[] ,
		cwd: string,
		usePeriodWhenEmptyFiles?: boolean
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
	}:
	{
		command: ValidGitCommands,
		options?: string[],
		files?: string[] ,
		cwd: string,
		usePeriodWhenEmptyFiles?: boolean
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
		if( isStatusChangingCommand( command ) )
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
 * 	}} param0 
 * @param {ValidGitCommands} param0.command 
 * @param {{}} [param0.options=[]] 
 * @param {{}} [param0.files=[]] 
 * @param {string} param0.cwd 
 * @param {boolean} [param0.usePeriodWhenEmptyFiles=false] 
 */
export function execGitCommandSync(
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

	return {
		error,
		stdout: _stdout
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


function isStatusChangingCommand( command: ValidGitCommands )
{
	switch( command )
	{
		case kGitAdd:
		case kGitAddUpdate:
		case kGitRestoreStaged:
		case kGitRestore:
			return true;
		
	}

	return false;
}