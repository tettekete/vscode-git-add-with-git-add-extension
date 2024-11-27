
import { ChunkRange } from 'parse-git-diff';

export class LineRange
{
	private _start: number;
	private _end: number;

	constructor(
		start: number,
		end: number
	)
	{
		// Measures against TS warnings
		this._start = start;
		this._end	= end;

		// Actual initialization process.
		this.update_start_end( start , end );
	}

	static fromChunkRange( chunk: ChunkRange )
	{
		return new LineRange( chunk.start , chunk.start + chunk.lines -1 );
			/*
			e.g.) When `@@ -59,9 +62,8 @@ `:
				`-59,9` means 9 lines including the 59th line.
                Thus 58 + 9 - 1 = 67 is the last line.

                If `-62,8` means 62 + 8 -1 = 69
			*/
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
		return this.end - this.start + 1;
	}

	set lines( n )
	{
		this._end = this._start + n -1;
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

	toDiffStyleString()
	{
		return `${this._start},${this.lines}`;
	}

	clone()
	{
		return new LineRange( this._start , this._end );
	}
}
