
/**
 * This class is used like a VSCode Disposable object.
 *
 * @export
 * @class GAWGADisposer
 * @typedef {GAWGADisposer}
 *
 * @example
 * someRegister()
 * {
 * 		const _id = ++ this.id;
 *  	return new GAWGADisposer(() =>{
 * 			this.removeListener( _id );
 * 		});
 * }
 */
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
