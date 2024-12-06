import * as assert from 'assert';
import { LineRange } from '../lib/line-range';

suite('LineRange Basic Tests', () =>
{
	test('Basic Test',() =>
	{
		[
			{ args: [ 1, 2 ], start: 1, end: 2 ,lines: 2},
			{ args: [ 4, 3 ], start: 3, end: 4 ,lines: 2},
			{ args: [ 5, 5 ], start: 5, end: 5 ,lines: 1},

			{ args: [ -1, -2 ], start: -2, end: -1 ,lines: 2},
			{ args: [ -4, -3 ], start: -4, end: -3 ,lines: 2},
			{ args: [ -5, -5 ], start: -5, end: -5 ,lines: 1},
			
		].forEach((t) =>
		{
			const r = new LineRange( t.args[0] ,t.args[1] );

			assert.equal( r.start , t.start );
			assert.equal( r.end , t.end );
			assert.equal( r.lines , t.lines );
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

type constructor_args = [
	start: number,
	end: number,
	flag?: boolean
]

suite('LineRange diff Format-related test', () =>
{
	let test_idx = 0;
	test('construct with start and end',() =>
	{
		[
			{ args: [ 3, 3, false ]	, diffStyleRange: '3,0', lines: 0 ,start: 3 ,end: 3 },
			{ args: [ 3, 3 ]		, diffStyleRange: '3,1', lines: 1 ,start: 3 ,end: 3 },
			{ args: [ 3, 7 ]		, diffStyleRange: '3,5', lines: 5 ,start: 3 ,end: 7},
			
		].forEach((t) =>
		{
			const _args = (t.args as constructor_args );
			const r = new LineRange( ..._args );

			assert.equal( r.toDiffStyleString() , t.diffStyleRange );
			assert.equal( r.lines , t.lines);

			assert.equal( r.start , t.start ,`[${test_idx}]: ${r.start} === ${t.start}`);
			assert.equal( r.end , t.end ,`[${test_idx}]: ${r.end} === ${t.end}`);

			test_idx ++;
		});
	});

	test('construct with "parse-git-diff" chunk',() =>
	{
		[
			{ chunk:{ start: 3,lines: 0}	, diffStyleRange: '3,0', lines: 0 },
			{ chunk:{ start: 3,lines: 1}	, diffStyleRange: '3,1', lines: 1 },
			{ chunk:{ start: 3,lines: 5}	, diffStyleRange: '3,5', lines: 5 },
			
		].forEach((t) =>
		{
			const r = LineRange.fromChunkRange( t.chunk );

			assert.equal( r.toDiffStyleString() , t.diffStyleRange );
			assert.equal( r.lines , t.lines);
		});
	});

});


suite('Iterator test', () =>
{
	let test_idx = 0;
	test('construct with start and end',() =>
	{
		[
			{ args: [ 3, 3 ,false]	, indexes:[], values:[]},
			{ args: [ 3, 3 ]		, indexes:[0], values:[3]},
			{ args: [ 3, 4 ]		, indexes:[0,1], values: [3,4] },
			{ args: [ 5, 9 ]		, indexes:[0,1,2,3,4], values: [5,6,7,8,9] },
			// 本来の使い方ではないが第三引数の意味は「1行目を含まない」なので、整合性のためこのような結果になるものとする。
			// 後々このような使い方が必要になった場合仕様変更するかもしれない
			{ args: [ 5, 9 ,false]	, indexes:[1,2,3,4], values: [6,7,8,9] },
			
		].forEach((t) =>
		{
			const _args = (t.args as constructor_args );
			const LR = new LineRange( ..._args );
			const ite = LR.getIterator();

			let i = 0;
			const values = [];
			for( const {index,value} of ite )
			{
				assert.ok( t.indexes.length > i ,`${test_idx} - ${i}`);
				assert.ok( t.values.length > i  ,`${test_idx} - ${i}`);
				assert.equal( index , t.indexes[i] ,`${test_idx} - ${i}`);
				assert.equal( value , t.values[i] ),`${test_idx} - ${i}`;

				values.push( value );
				i++;
			}

			// The number of values that can be retrieved in an iteration is the same as
			// the value of lines.
			assert.equal( values.length , LR.lines );

			test_idx ++;
		});
	});
});