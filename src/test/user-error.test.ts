import * as assert from 'assert';
import { WarningError ,AlertError ,InformationError} from '../lib/user-error';

suite('UserError Tests', () =>
{
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
});
