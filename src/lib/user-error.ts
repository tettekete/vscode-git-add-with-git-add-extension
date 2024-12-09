interface UserErrorConstructor
{
    new (message?: string , code?: number ): WarningErrorClass;
    (message?: string, code?: number ): WarningErrorClass;
}

class UserErrorBase extends Error
{
	#code: number = -1;

	get code()
	{
		return this.#code;
	}

	constructor(message?: string , code?: number ) 
	{
		super(message);

		if( typeof code === 'number' ){	 this.#code = code; }
	}

}

class WarningErrorClass extends UserErrorBase
{
	constructor(message?: string , code?: number )
	{
		super( message , code );
		this.name = 'WarningError';
	}
}

class AlertErrorClass extends UserErrorBase
{
	constructor(message?: string , code?: number )
	{
		super( message , code );
		this.name = 'AlertError';
	}
}


const WarningError: UserErrorConstructor
	= function (this: WarningErrorClass | void, message?: string , code?: number )
	{
		if (this instanceof WarningErrorClass)
		{
			return new WarningErrorClass( message , code );
		}
		else
		{
			return new WarningErrorClass( message ,code );
		}
	} as UserErrorConstructor;

const AlertError: UserErrorConstructor
	= function (this: AlertErrorClass | void, message?: string , code?: number )
	{
		if (this instanceof AlertErrorClass)
		{
			return new AlertErrorClass( message , code );
		}
		else
		{
			return new AlertErrorClass( message ,code );
		}
	} as UserErrorConstructor;


WarningError.prototype = WarningErrorClass.prototype;
AlertError.prototype = AlertErrorClass.prototype;

export { WarningError ,AlertError };

