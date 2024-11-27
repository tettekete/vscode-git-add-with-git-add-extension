import * as assert from 'assert';
import { LineRange } from '../lib/line-range';

suite('LineRange Basic Tests', () =>
{
	test('Basic Test',() =>
	{
		[
			{ args: [ 1, 2 ], start: 1, end: 2 },
			{ args: [ 4, 3 ], start: 3, end: 4 },
			{ args: [ 5, 5 ], start: 5, end: 5 },

			{ args: [ -1, -2 ], start: -2, end: -1 },
			{ args: [ -4, -3 ], start: -4, end: -3 },
			{ args: [ -5, -5 ], start: -5, end: -5 },
			
		].forEach((t) =>
		{
			const r = new LineRange( t.args[0] ,t.args[1] );

			assert.equal( r.start , t.start );
			assert.equal( r.end , t.end );
		});
	});

	let idx = 0;
	test('getOverlapRange() test',()=>
	{
		[
			{ a: [ 10,20 ] , b: [1 , 9] , r: false },
			{ a: [ 10,20 ] , b: [1 , 10] , r: true , start: 10 , end: 10 },
			{ a: [ 10,20 ] , b: [1 , 11] , r: true , start: 10 , end: 11 },
			{ a: [ 10,20 ] , b: [5 , 15] , r: true , start: 10 , end: 15 },
			{ a: [ 10,20 ] , b: [5 , 20] , r: true , start: 10 , end: 20 },
			{ a: [ 10,20 ] , b: [5 , 21] , r: true , start: 10 , end: 20 },
			{ a: [ 10,20 ] , b: [10 , 11] , r: true , start: 10 , end: 11 },
			{ a: [ 10,20 ] , b: [10 , 19] , r: true , start: 10 , end: 19 },
			{ a: [ 10,20 ] , b: [10 , 20] , r: true , start: 10 , end: 20 },
			{ a: [ 10,20 ] , b: [10 , 21] , r: true , start: 10 , end: 20 },
			{ a: [ 10,20 ] , b: [11 , 19] , r: true , start: 11 , end: 19 },
			{ a: [ 10,20 ] , b: [11 , 20] , r: true , start: 11 , end: 20 },
			{ a: [ 10,20 ] , b: [11 , 21] , r: true , start: 11 , end: 20 },
			{ a: [ 10,20 ] , b: [12 , 18] , r: true , start: 12 , end: 18 },
			{ a: [ 10,20 ] , b: [19 , 19] , r: true , start: 19 , end: 19 },
			{ a: [ 10,20 ] , b: [19 , 20] , r: true , start: 19 , end: 20 },
			{ a: [ 10,20 ] , b: [19 , 21] , r: true , start: 19 , end: 20 },
			{ a: [ 10,20 ] , b: [20 , 20] , r: true , start: 20 , end: 20 },
			{ a: [ 10,20 ] , b: [20 , 21] , r: true , start: 20 , end: 20 },
			{ a: [ 10,20 ] , b: [21 , 21] , r: false },
			{ a: [ 10,20 ] , b: [25 , 30] , r: false },

		].forEach((t) =>
		{
			idx++;
			const a = new LineRange( t.a[0] , t.a[1] );
			const b = new LineRange( t.b[0] , t.b[1] );

			const r = a.getOverlapRange( b );
			if( t.r )
			{
				assert.ok( r );

				assert.equal( r.start , t.start ,`[${idx}] r.start === t.start / ${r.start } === ${t.start}`);
				assert.equal( r.end , t.end ,`[${idx}] r.end === t.end  / ${r.end } === ${t.end}`);
			}
			else
			{
				assert.ok( ! r );
			}

		});
	});
});