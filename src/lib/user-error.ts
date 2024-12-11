interface UserErrorConstructor
{
	new (message?: string | UserErrorBase | Error, code?: number ): UserErrorBase;
	(message?: string | UserErrorBase | Error , code?: number ): UserErrorBase;
}

class UserErrorBase extends Error
{
	#code: number = -1;

	get code()
	{
		return this.#code;
	}

	constructor(message?: string | UserErrorBase | Error, code?: number ) 
	{
		if( message instanceof UserErrorBase )
		{
			super(message.message);
			if( typeof code === 'number' )
			{
				this.#code = code;
			}
			else
			{
				this.#code = message.code;
			}
		}
		else if ( message instanceof Error )
		{
			super(message.message);
			if( typeof code === 'number' )
			{
				this.#code = code;
			}
		}
		else
		{
			super(message);
			if( typeof code === 'number' ){	 this.#code = code; }
		}	
	}

}

class CommonErrorClass extends UserErrorBase
{
	constructor(message?: string | UserErrorBase | Error, code?: number )
	{
		super( message , code );
		this.name = 'CommonError';
	}
}


class WarningErrorClass extends UserErrorBase
{
	constructor(message?: string | UserErrorBase | Error, code?: number )
	{
		super( message , code );
		this.name = 'WarningError';
	}
}

class AlertErrorClass extends UserErrorBase
{
	constructor(message?: string | UserErrorBase | Error , code?: number )
	{
		super( message , code );
		this.name = 'AlertError';
	}
}

class InformationErrorClass extends UserErrorBase
{
	constructor(message?: string | UserErrorBase | Error, code?: number )
	{
		super( message , code );
		this.name = 'InformationError';
	}
}

class CriticalErrorClass extends UserErrorBase
{
	constructor(message?: string | UserErrorBase | Error, code?: number )
	{
		super( message , code );
		this.name = 'CriticalError';
	}
}

const createErrorClass = <T extends UserErrorBase>(
    ClassType: new (message?: string | UserErrorBase | Error, code?: number) => T
): UserErrorConstructor =>
{
    const ErrorClass: UserErrorConstructor =
	(
		function (
        	this: T | void,
        	message?: string | UserErrorBase | Error,
        	code?: number
    	)
		{
			return new ClassType(message, code);
    	} as unknown
	) as UserErrorConstructor;

    ErrorClass.prototype = ClassType.prototype;
    return ErrorClass;
};

const CommonError		= createErrorClass<CommonErrorClass>( CommonErrorClass );
const WarningError		= createErrorClass<WarningErrorClass>( WarningErrorClass );
const AlertError		= createErrorClass<AlertErrorClass>( AlertErrorClass );
const InformationError	= createErrorClass<InformationErrorClass>( InformationErrorClass );
const CriticalError		= createErrorClass<CriticalErrorClass>( CriticalErrorClass );

export { CommonError, WarningError ,AlertError ,InformationError ,CriticalError };

export type UserError = WarningErrorClass | AlertErrorClass | InformationErrorClass
export type AnyUserError = UserError | Error;

export function isUserError( error: AnyUserError ): error is UserError
{
	return error instanceof UserErrorBase;
}
