import * as vscode from 'vscode';
import { exec } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { escapeArgumentForShell } from './utils';

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
		,files
		,cwd
		,usePeriodWhenEmptyFiles = false
	}:
	{
		command: ValidGitCommands,
		files: string[] ,
		cwd: string,
		usePeriodWhenEmptyFiles?: boolean
	}
):Promise<CommandResult>
{
	const filesAsArgs = files.map((file) =>
	{
		const relPath = path.relative( cwd , file );
		return escapeArgumentForShell( relPath );
	});

	const execOption:{[key: string]:unknown} = {};

	if( cwd )
	{
		execOption['cwd'] = cwd;
	}

	let _stdout:string = '';
	let _stderr:string = '';
	let error:Error|undefined = undefined;
	let commandText = `${command} ${filesAsArgs.join(' ')}`;

	if( files.length === 0 && usePeriodWhenEmptyFiles )
	{
		commandText = `${command} .`;
	}
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

	return {
		error: error,
		stdout: _stdout,
		stderr: _stderr
	};
}
