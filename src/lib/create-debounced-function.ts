
/**
 * Creates a debounced function that delays the execution of the provided function 
 * until after a specified delay has passed since the last time it was invoked.
 * 
 * @param {(...args: any[]) => void} func The function to be debounced.
 * @param {number} delay The number of milliseconds to delay the function execution.
 * @returns {(...args: any[]) => void} A new debounced function.
 *
 * @example
 * const say = createDebouncedFunction((msg) => { console.log( msg )} , 1000 );
 * say("foo");
 * say("bar");
 * setTimeout(()=>{ say("hoge")} , 500 );
 * // Only “hoge” is output after about 1.5 seconds
 */
export function createDebouncedFunction(
	func: (...args: any[]) => void,
	delay: number
)
{
	let timeout: NodeJS.Timeout;
	return (...args: any[]) =>
	{
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), delay);
	};
}
