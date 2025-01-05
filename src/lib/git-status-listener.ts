
import { createDebouncedFunction } from './create-debounced-function';
export class GAWGADisposer
{
	#disposeFunction: (()=> void) | undefined = undefined;

	constructor( disposer: () => void )
	{
		this.#disposeFunction = disposer;
	}

	dispose()
	{
		if( this.#disposeFunction )
		{
			this.#disposeFunction();
			this.#disposeFunction = undefined;
		}
	}
}

const kGitStatusUpdateEvent = 'update';
const ValidEvents = [
	kGitStatusUpdateEvent
] as const;

export type GSLValidEventsT = (typeof kGitStatusUpdateEvent)[number];
type EventDebouncer = {[key in GSLValidEventsT]:(...args: any)=>void}

type Listener =
{
	id: number;
	event: GSLValidEventsT;
	f: (eventType: GSLValidEventsT ) => void;
}


class GitStatusListener
{
	static #instance:GitStatusListener;
	static debounceInterval = 400;
	
	#listeners:Listener[] = [];
	#id = 0;
	#debouncers: EventDebouncer = {} as EventDebouncer;

	private constructor()
	{
		for(const event of ValidEvents )
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


	addListener( eventType: GSLValidEventsT ,listener: ( events:GSLValidEventsT ) => void ):GAWGADisposer
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

	invokeListeners( eventType: GSLValidEventsT )
	{
		this.#listeners.forEach(( item ) =>
		{
			if( item.event === eventType )
			{
				item.f( eventType );
			}
		});
	}

	dispatchEvent( eventType: GSLValidEventsT )
	{
		this.#debouncers[eventType]( eventType );
	}
}

class GitStatusObserver
{
	static #instance:GitStatusObserver;

	private constructor(){}

}

export function onGitStatusChanged( listener: ( events:GSLValidEventsT ) => void ):GAWGADisposer
{
	return GitStatusListener.instance().addListener( kGitStatusUpdateEvent , listener );
}

export function dispatchGitStatusUpdateEvent()
{
	return GitStatusListener.instance().dispatchEvent( kGitStatusUpdateEvent );
}