
import { createDebouncedFunction } from './create-debounced-function';
import { GAWGADisposer } from './gawga-disposer';
import {
	kGitStatusUpdateEvent,
	ValidGitStatusEvents,
	ValidGitStatusEventsT
} from '../constants';

type EventDebouncers = {[key in ValidGitStatusEventsT]:(...args: any)=>void}

type Listener =
{
	id: number;
	event: ValidGitStatusEventsT;
	f: (eventType: ValidGitStatusEventsT ) => void;
}



/**
 * Listener singleton class for git status change events.
 *
 * @class GitStatusListener
 * @typedef {GitStatusListener}
 */
class GitStatusListener
{
	static #instance:GitStatusListener;
	static debounceInterval = 400;
	
	#listeners:Listener[] = [];
	#id = 0;
	#debouncers: EventDebouncers = {} as EventDebouncers;

	private constructor()
	{
		for(const event of ValidGitStatusEvents )
		{
			this.#debouncers[event] = createDebouncedFunction(()=>
				{
					this.invokeListeners( event );
				}
				,GitStatusListener.debounceInterval
			);
		}
	};

	static instance()
	{
		if( ! GitStatusListener.#instance )
		{
			GitStatusListener.#instance = new GitStatusListener();
		}

		return GitStatusListener.#instance;
	}


	addListener( eventType: ValidGitStatusEventsT ,listener: ( events:ValidGitStatusEventsT ) => void ):GAWGADisposer
	{
		const _id = (++ this.#id) % Number.MAX_SAFE_INTEGER | 1;

		this.#listeners.push(
			{
				id: _id,
				event: eventType,
				f: listener
			}
		);

		return new GAWGADisposer(() =>{
			this.removeListener( _id );
		});
	}

	removeListener( id: number )
	{
		this.#listeners = this.#listeners.filter(( item )=>
		{
			return item.id !== id;
		});
	}

	
	/**
	 * A method that actually invokes the callback registered in the event listener.
	 *
	 * It is sent to the debounce function in dispatchEvent, and this method is
	 * called after debouncing.
	 *
	 * @private
	 * @param {ValidGitStatusEventsT} eventType
	 */
	private invokeListeners( eventType: ValidGitStatusEventsT )
	{
		this.#listeners.forEach(( item ) =>
		{
			if( item.event === eventType )
			{
				item.f( eventType );
			}
		});
	}

	/**
	 * Methods to receive external event occurrences. 
	 * Once sent to the debounce function, the event is not immediately issued.
	 *
	 * @param eventType - Only kGitStatusUpdateEvent == 'update' so far.
	 */
	dispatchEvent( eventType: ValidGitStatusEventsT )
	{
		this.#debouncers[eventType]( eventType );
	}
}


/**
 * Register function to git status event listener.
 *
 * Note that no function is provided for removal from the event listener, as
 * it returns an object for dispose.
 *
 * @export
 * @param {( events:ValidGitStatusEventsT ) => void} listener
 * @returns {GAWGADisposer}
 */
export function onGitStatusChanged( listener: ( events:ValidGitStatusEventsT ) => void ):GAWGADisposer
{
	return GitStatusListener.instance().addListener( kGitStatusUpdateEvent , listener );
}


/**
 * Function to receive external git status change events.
 *
 * @export
 */
export function dispatchGitStatusUpdateEvent()
{
	return GitStatusListener.instance().dispatchEvent( kGitStatusUpdateEvent );
}