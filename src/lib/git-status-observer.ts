import * as vscode from 'vscode';

import { execGitCommandWithFiles } from './exec-git-commands';
import {
	kGitStatusPorcelainUno,
	kGitStatusUpdateEvent,
	kGitStatusPollingInterval

} from '../constants';

import { EventEmitter } from 'node:events';
import {
	kGitStatusUpdated,
	gitEventBus
} from './git-status-event-bus';

/**
 * A singleton class to periodically perform git status and monitor its update status.
 *
 * @class GitStatusObserverClass
 * @typedef {GitStatusObserverClass}
 */
class GitStatusObserverClass
{
	static #instance:GitStatusObserverClass;
	#conditionsByWF:Record<string,string> = {};	// Stores the results of `git status --porcelain -uno` for each workspace.
	#pollingInterval:number	= kGitStatusPollingInterval;
	#timeout: NodeJS.Timeout | undefined;
	#isPolling: boolean = false;
	#isPaused: boolean = false;
	#eventEmitter: EventEmitter | undefined;
	#eventName: string | undefined;

	private constructor()
	{
		const config		= vscode.workspace.getConfiguration();
		const intervalSec	= config.get<number>('git-add-with-git-add.gitStatusPollingInterval', kGitStatusPollingInterval );

		this.pollingInterval = intervalSec;

		// Perform monitoring only when the window is active.
		vscode.window.onDidChangeWindowState((windowState) =>
		{
			if( windowState.focused )
			{
				this.resume();
			}
			else
			{
				this.pause();
			}
		});
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
		this.#pollingInterval = Math.max( Math.floor( sec * 1000 ) , 300 );
	}

	
	/**
	 * Methods for setting the EventEmitter instance and event name for event emission.
	 *
	 * When there is a change in the result of git status, an event is issued based
	 * on the information set here.
	 *
	 * @param {EventEmitter} eventEmitter
	 * @param {string} eventName
	 */
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
		this.#isPolling = true;

		if( ! Object.keys( this.#conditionsByWF ) )
		{
			this.checkStatus( true );
		}

		this._startNextTimeout();
	}

	private _startNextTimeout()
	{
		clearTimeout( this.#timeout );

		if( this.#isPaused ) { return; }

		if( ! vscode.window.state.focused )
		{
			this.pause();
			return;
		}

		this.#timeout = setTimeout( async () =>
			{
				await this._invokeCheckAndTimeout();
			}
			,this.#pollingInterval
		);
	}

	private async _invokeCheckAndTimeout()
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

	stop()
	{
		this.#isPolling = false;
		clearTimeout( this.#timeout );
	}

	pause()
	{
		this.#isPaused = true;
		clearTimeout( this.#timeout );
	}

	resume()
	{
		this.#isPaused = false;
		clearTimeout( this.#timeout );	// It is not guaranteed to be called after a pause in the logic.

		if( this.#isPolling )
		{
			this._invokeCheckAndTimeout();
		}
	}

	
	/**
	 * Perform `git status --porcelain -uno` for each workspace to check for any
	 * updates since the last time.
	 *
	 * If there is an update, return true.
	 *
	 * @private
	 * @async
	 * @param {boolean} [init=false]
	 * @returns {Promise<boolean>}
	 */
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
