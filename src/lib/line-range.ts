
import { ChunkRange } from 'parse-git-diff';

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
		// Measures against TS warnings
		this._start = start;
		this._end	= end;

		if( includes_start_line !== undefined )
		{
			this._includes_start_line = includes_start_line;
		}

		// Actual initialization process.
		this.update_start_end( start , end );
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

	static fromChunkRange( chunk: ChunkRange )
	{
		return LineRange.fromStartWithLines( chunk.start , chunk.lines );
	}

	private update_start_end( start:number , end: number )
	{
		if( start > end )
		{
			[start, end] = [end, start];
		}

		this._start	= start;
		this._end	= end;
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
			this._end = this._start 
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

	getIterator(): Iterator<[number, number]>
	{
		const start	= this._start;
		const end 	= this._end;

		function* generator(): Generator<[number, number], void, unknown>
		{
			for (let i = 0; start + i <= end; i++)
			{
				yield [i, start + i];
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
