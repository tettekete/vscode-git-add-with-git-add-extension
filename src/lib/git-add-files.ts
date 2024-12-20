
import { exec } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { escapeArgumentForShell } from './utils';


const execAsync = promisify(exec);

type CommandResult = {
	error: Error | undefined,
	stdout: string,
	stderr: string
};

export async function execGitAddFiles( files: string[] ,cwd: string ):Promise<CommandResult>
{
	const filesAsArgs = files.map((file) =>
	{
		const relPath = path.relative( cwd , file );
		return escapeArgumentForShell( relPath );
	});

	const option:{[key: string]:unknown} = {};

	if( cwd )
	{
		option['cwd'] = cwd;
	}

	let _stdout:string = '';
	let _stderr:string = '';
	let error:Error|undefined = undefined;
	try
	{
		const { stdout , stderr } = await execAsync(
			`git add ${filesAsArgs.join(' ')}`,
			option,
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
