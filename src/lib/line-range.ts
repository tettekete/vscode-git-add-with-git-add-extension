
import { ChunkRange } from 'parse-git-diff';

/**
 * 
 * 行数における「範囲」を扱うためのクラスです。
 * 
 * 主に diff における行番号と行数を取り扱うために作られています。
 * 一般的な、所謂 Range クラスとの一番の違いは end に指定した行が「範囲に含まれる」という点です。
 * つまり start が 3 で end が 5 ならばその行数は 3 になります。イテレータも 3行目、4行目、5行目を返します。
 * 
 * また例外的に start と end が同じである場合に「行を持たない」という「範囲」を作ることが出来ます。
 * これはコンストラクタの第3因数に false を渡すことで実現できます。
 * 
 * ---
 * 
 * This is a class for handling “ranges” in terms of line numbers.
 * 
 * It is mainly designed to handle line numbers and line counts in diff.
 * The main difference from the general so-called Range class is that the line
 * specified as end is “included in the range”.
 * In other words, if start is 3 and end is 5, the line count will be 3. The
 * iterator will also return the 3rd, 4th and 5th lines.
 *
 * Also, exceptionally, it is possible to create a “range” that “does
 * not have any lines” when start and end are the same.
 * This can be achieved by passing false as the third argument to the constructor.
 * 
 * 
 */
export class LineRange
{
	private _start: number;
	private _end: number;
	private _includes_start_line: boolean = true;

	constructor(
		start: number,
		end: number,
		includes_start_line?: boolean
	)
	{
		const updated = this.update_start_end( start , end );

		// Measures against TS warnings
		this._start = updated.start;
		this._end	= updated.end;

		if( includes_start_line !== undefined )
		{
			this._includes_start_line = includes_start_line;
		}
	}

	static fromStartWithLines(
			start: number ,
			lines: number)
	{
		let includes_start_line = true;
		let end = start + lines -1;
		if( lines === 0 )
		{
			includes_start_line = false;
			end = start;
		}

		return new LineRange( start , end ,includes_start_line );
	}

	// TODO: It depends on 'parse-git-diff', but if you use fromStartWithLines(), you can remove the dependency.
	static fromChunkRange( chunk: ChunkRange )
	{
		return LineRange.fromStartWithLines( chunk.start , chunk.lines );
	}

	private update_start_end( start:number , end: number ):
	{
		start: number;
		end: number;
	}
	{
		if( start > end )
		{
			[start, end] = [end, start];
		}

		this._start	= start;
		this._end	= end;

		return { start , end };
	}

	set start( n )
	{
		this.update_start_end( n , this.end );
	}

	get start()
	{
		return this._start;
	}

	set end( n )
	{
		this.update_start_end( this.start , n );
	}

	get end()
	{
		return this._end;
	}

	/*
		Whiy plus 1?
		For example, if start = 2 and end = 4, lines 2 to 4 are equivalent to 3 lines.
		Therefore, you need to add 1 to 4 - 2 to get the number of lines.
	*/
	get lines()
	{
		if( this._includes_start_line )
		{
			return this.end - this.start + 1;
		}
		else
		{
			return this.end - this.start;
		}
		
	}

	set lines( n )
	{
		if( n === 0 )
		{
			this._end = this._start;
		}
		else
		{
			this._end = this._start + n -1;
		}
	}

	set includes_start_line( bool : boolean )
	{
		this._includes_start_line = bool;
	}

	getOverlapRange( bRange: LineRange ): LineRange | undefined
	{

		if( this.start > bRange.end ){ return undefined; }
		if( this.end < bRange.start ){ return undefined; }

		const newRange = new LineRange(
				Math.max( this.start , bRange.start ),
				Math.min( this.end , bRange.end )
		);

		return newRange;
	}

	isInRange( n : number )
	{
		if( this._start <= n && this._end >= n )
		{
			return true;
		}

		return false;
	}

	offsetRange( n : number )
	{
		this._start += n;
		this._end += n; 
	}

	inflatedClone( n: number )
	{
		return new LineRange( this._start -n , this._end +n ,this._includes_start_line );
	}

	// It's not being used at the moment, but the test has been written and I passed
	// it, so I'll keep it.
	getIterator(): IterableIterator<{index:number, value:number}>
	{
		const start	= this._start;
		const end 	= this._end;
		const thereAreNoLines = this.lines === 0;
		let startAdjustment = 0;
		if( ! this._includes_start_line )
		{
			startAdjustment = 1;
		}

		function* generator(): Generator<{index:number, value:number}, void, unknown>
		{
			if( thereAreNoLines )
			{
				return;
			}

			for (let i = 0; i <= end - start - startAdjustment; i++)
			{
				yield {
					index: i + startAdjustment,
					value: start + i + startAdjustment};
			}
		}

		return generator();
	}

	toDiffStyleString()
	{
		return `${this._start},${this.lines}`;
	}

	description()
	{
		return `{ start: ${this._start} ,end: ${this._end} ,lines: ${this.lines}} `;
	}

	clone()
	{
		return new LineRange( this._start , this._end );
	}
}
