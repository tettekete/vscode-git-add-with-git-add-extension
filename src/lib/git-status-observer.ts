import * as vscode from 'vscode';

import { execGitCommandWithFiles } from './exec-git-commands';
import { kGitStatusPorcelainUno } from '../constants';

import { EventEmitter } from 'node:events';
import {
	kGitStatusUpdated,
	gitEventBus
} from './git-status-event-bus';

import { kGitStatusUpdateEvent } from '../constants';


class GitStatusObserverClass
{
	static #instance:GitStatusObserverClass;
	#conditionsByWF:Record<string,string> = {};
	#pollingInterval:number	= 5;
	#timeout: NodeJS.Timeout | undefined;
	#eventEmitter: EventEmitter | undefined;
	#eventName: string | undefined;

	private constructor()
	{
		const config		= vscode.workspace.getConfiguration();
		const intervalSec	= config.get<number>('git-add-with-git-add.gitStatusPollingInterval', 5 );

		this.pollingInterval = intervalSec;
	}

	static instance():GitStatusObserverClass
	{
		if( ! GitStatusObserverClass.#instance )
		{
			GitStatusObserverClass.#instance = new GitStatusObserverClass();
		}

		return GitStatusObserverClass.#instance;
	}

	set pollingInterval( sec: number )
	{
		this.#pollingInterval = Math.floor( sec * 1000 );
	}

	setEventEmitter( eventEmitter: EventEmitter ,eventName: string )
	{
		this.#eventEmitter = eventEmitter;
		this.#eventName	= eventName;
	}

	clearEventEmitter()
	{
		this.#eventEmitter = undefined;
	}

	start()
	{	
		if( ! Object.keys( this.#conditionsByWF ) )
		{
			this.checkStatus( true );
		}

		this._startNextTimeout();
	}

	private _startNextTimeout()
	{
		clearTimeout( this.#timeout );
		this.#timeout = setTimeout( async () =>
			{
				const isStatusChanged = await this.checkStatus();
				if( isStatusChanged )
				{
					if( this.#eventEmitter && this.#eventName )
					{
						this.#eventEmitter.emit(this.#eventName , kGitStatusUpdateEvent );
					}
				}

				this._startNextTimeout();
			}
			,this.#pollingInterval
		);
	}

	stop()
	{
		clearTimeout( this.#timeout );
	}

	private async checkStatus( init :boolean = false):Promise<boolean>
	{
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if(! workspaceFolders )
		{
			return false;
		}

		let isStatusChanged = false;
		for (const folder of workspaceFolders)
		{
			const cwd = folder.uri.fsPath;
			const {error,stdout,stderr} = await execGitCommandWithFiles(
			{
				command: kGitStatusPorcelainUno,
				files:[],
				cwd: cwd,
				usePeriodWhenEmptyFiles: false
			});

			if( error ){ continue; }
			if( ! init && ! isStatusChanged )
			{
				const before = this.#conditionsByWF[cwd];
				if( before !== stdout )
				{
					isStatusChanged = true;
				}
			}

			this.#conditionsByWF[cwd] = stdout;
		}

		return isStatusChanged;
	}
}

const GitStatusObserver = GitStatusObserverClass.instance();
GitStatusObserver.setEventEmitter( gitEventBus ,kGitStatusUpdated );

export { GitStatusObserver };
