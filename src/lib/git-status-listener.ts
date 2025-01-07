
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

	invokeListeners( eventType: ValidGitStatusEventsT )
	{
		this.#listeners.forEach(( item ) =>
		{
			if( item.event === eventType )
			{
				item.f( eventType );
			}
		});
	}

	dispatchEvent( eventType: ValidGitStatusEventsT )
	{
		this.#debouncers[eventType]( eventType );
	}
}


export function onGitStatusChanged( listener: ( events:ValidGitStatusEventsT ) => void ):GAWGADisposer
{
	return GitStatusListener.instance().addListener( kGitStatusUpdateEvent , listener );
}

export function dispatchGitStatusUpdateEvent()
{
	return GitStatusListener.instance().dispatchEvent( kGitStatusUpdateEvent );
}