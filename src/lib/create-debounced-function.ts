
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
