
import * as vscode from 'vscode';

export class VSCConfig
{
	static #config = vscode.workspace.getConfiguration();

	static showFileStatusInStatusBar( fallback?: string ):string | undefined
	{
		const value = vscode.workspace
			.getConfiguration()
			.get<string>(
				'git-add-with-git-add.showFileStatusInStatusBar'
			);
		
		if( ! value && fallback )
		{
			return fallback;
		}
		return value;
	}

	static gitStatusPollingInterval( fallback?: number ):number | undefined
	{
		return VSCConfig._numberConfig(
				'git-add-with-git-add.gitStatusPollingInterval'
				,fallback
		);
	}

	static fileStatusPriority( fallback?: number ):number | undefined
	{
		return VSCConfig._numberConfig(
				'git-add-with-git-add.fileStatusPriority'
				,fallback
		);
	}

	static _stringConfig( configName: string , fallback?: string ):string | undefined
	{
		const value = vscode.workspace
			.getConfiguration()
			.get<string>( configName );
		
		if( value === undefined && typeof fallback === 'string' )
		{
			return fallback;
		}

		return value;
	}

	static _numberConfig( configName: string , fallback?:number ):number | undefined
	{
		const value = vscode.workspace
			.getConfiguration()
			.get<number>( configName );
		
		if( value === undefined && typeof fallback === 'number' )
		{
			return fallback;
		}
		return value;
	}

	static _booleanConfig( configName: string , fallback?:boolean ):boolean | undefined
	{
		const value = vscode.workspace
			.getConfiguration()
			.get<boolean>( configName );
		
		if( value  === undefined && typeof fallback === 'boolean' )
		{
			return fallback;
		}
		return value;
	}
}