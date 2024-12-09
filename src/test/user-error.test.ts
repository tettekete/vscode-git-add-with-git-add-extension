import * as assert from 'assert';
import { CommonError,WarningError ,AlertError ,InformationError} from '../lib/user-error';

suite('UserError Tests', () =>
{
	suite('CommonError Basic Tests', () =>
	{
		test('Functional use',() =>
		{
			const e = CommonError('common error');
			
			assert.ok( e instanceof CommonError ,'e instanceof CommonError');
			assert.ok( e instanceof Error ,'e instanceof Error');
			assert.equal(e.message ,'common error');
			assert.equal(e.name ,'CommonError');
			assert.equal(e.code ,-1);

			const e2 = CommonError('error with error code.' ,123);

			assert.equal(e2.code ,123);
		});

		test('Instantiate use',() =>
		{
			const e = new CommonError('instantiate common error');
			
			assert.ok( e instanceof CommonError ,'e instanceof CommonError');
			assert.ok( e instanceof Error ,'e instanceof Error');
			assert.equal(e.message ,'instantiate common error');
			assert.equal(e.name ,'CommonError');
			assert.equal(e.code ,-1);

			const e2 = new CommonError('error with error code.' ,456);

			assert.equal(e2.code ,456);
		});
	});

	suite('WarningError Basic Tests', () =>
	{
		test('Functional use',() =>
		{
			const e = WarningError('warning error');
			
			assert.ok( e instanceof WarningError ,'e instanceof WarningError');
			assert.ok( e instanceof Error ,'e instanceof Error');
			assert.equal(e.message ,'warning error');
			assert.equal(e.name ,'WarningError');
			assert.equal(e.code ,-1);

			const e2 = WarningError('error with error code.' ,314);

			assert.equal(e2.code ,314);
		});

		test('Instantiate use',() =>
		{
			const e = new WarningError('instantiate warning error');
			
			assert.ok( e instanceof WarningError ,'e instanceof WarningError');
			assert.ok( e instanceof Error ,'e instanceof Error');
			assert.equal(e.message ,'instantiate warning error');
			assert.equal(e.name ,'WarningError');
			assert.equal(e.code ,-1);

			const e2 = new WarningError('error with error code.' ,298);

			assert.equal(e2.code ,298);
		});
	});

	suite('AlertError Basic Tests', () =>
	{
		test('Functional use',() =>
		{
			const e = AlertError('alert error');
			
			assert.ok( e instanceof AlertError ,'e instanceof WarningError');
			assert.ok( e instanceof Error ,'e instanceof Error');
			assert.equal(e.message ,'alert error');
			assert.equal(e.name ,'AlertError');
			assert.equal(e.code ,-1);

			const e2 = AlertError('error with error code.' ,432);

			assert.equal(e2.code ,432);
		});

		test('Instantiate use',() =>
		{
			const e = new AlertError('instantiate alert error');
			
			assert.ok( e instanceof AlertError ,'e instanceof AlertError');
			assert.ok( e instanceof Error ,'e instanceof Error');
			assert.equal(e.message ,'instantiate alert error');
			assert.equal(e.name ,'AlertError');
			assert.equal(e.code ,-1);

			const e2 = new AlertError('error with error code.' ,298);

			assert.equal(e2.code ,298);
		});
	});

	suite('InformationError Basic Tests', () =>
	{
		test('Functional use',() =>
		{
			const e = InformationError('alert error');
			
			assert.ok( e instanceof InformationError ,'e instanceof InformationError');
			assert.ok( e instanceof Error ,'e instanceof Error');
			assert.equal(e.message ,'alert error');
			assert.equal(e.name ,'InformationError');
			assert.equal(e.code ,-1);

			const e2 = InformationError('error with error code.' ,432);

			assert.equal(e2.code ,432);
		});

		test('Instantiate use',() =>
		{
			const e = new InformationError('instantiate alert error');
			
			assert.ok( e instanceof InformationError ,'e instanceof InformationError');
			assert.ok( e instanceof Error ,'e instanceof Error');
			assert.equal(e.message ,'instantiate alert error');
			assert.equal(e.name ,'InformationError');
			assert.equal(e.code ,-1);

			const e2 = new InformationError('error with error code.' ,298);

			assert.equal(e2.code ,298);
		});
	});

	suite('Convert Errors', () =>
	{
		test('Basic',() =>
		{
			const commonError = CommonError('somthing error',159);
			const alertError = AlertError( commonError );

			assert.ok( commonError instanceof CommonError ,'commonError instanceof CommonError');
			assert.ok( commonError instanceof Error ,'commonError instanceof Error');
			assert.ok( alertError instanceof AlertError ,'alertError instanceof AlertError' );
			assert.ok( alertError instanceof Error ,'alertError instanceof Error' );

			assert.equal( alertError.message , commonError.message );
			assert.equal( commonError.code , 159 ,'commonError.code is 159');
			assert.equal( alertError.code , 159 ,'alertError.code is 159');

			const warnError = WarningError( alertError , 999 );

			assert.ok( warnError instanceof WarningError );
			assert.equal( warnError.code , 999 ,'warnError.code is 999');

			// const error = Error("default Error");


		});

		test('Error to UserError',() =>
		{
			const error = Error('default error');
			const commonError = CommonError( error );

			assert.ok( commonError instanceof CommonError );
			assert.equal( commonError.message , 'default error' );
			assert.equal( commonError.code , -1 );

			const warningError = WarningError( error , 592 );
			assert.ok( warningError instanceof WarningError );
			assert.equal( warningError.message , 'default error' );
			assert.equal( warningError.code , 592 );

		});
	});
});
