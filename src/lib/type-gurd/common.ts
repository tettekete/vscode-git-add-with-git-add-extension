
/** A property existence type guard and check function. */
export function isValidKey<T extends object>(obj: T, key: PropertyKey): key is keyof T
{
	return key in obj;
};
