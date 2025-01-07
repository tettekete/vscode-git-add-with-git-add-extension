
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
