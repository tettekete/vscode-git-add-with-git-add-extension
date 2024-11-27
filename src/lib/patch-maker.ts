
import { LineRange } from './line-range';
import { AnyLineChange } from 'parse-git-diff';

export class PatchMaker
{
	public from_file: string = '/dev/null';
	public to_file: string = '/dev/null';
	public from_range: LineRange | undefined;
	public to_range: LineRange | undefined;
	public chunk_context: string = '';
	public changes: AnyLineChange[] = [];

	constructor({
		from_file,
		to_file,
		from_range,
		to_range,
		chunk_context = ''		// Extended git diff specification
	}:
	{
		from_file: string;
		to_file: string;
		from_range?: LineRange;
		to_range?: LineRange;
		chunk_context?: string
	})
	{
		this.from_file	= from_file;
		this.to_file	= to_file;
		if( from_range )	{ this.from_range	= from_range;}
		if( to_range )		{ this.to_range	= to_range;}
		if( chunk_context )	{ this.chunk_context = chunk_context;}
	}

	pushChanges( change: AnyLineChange )
	{
		this.changes.push( change );
	}

	toString(): string | Error
	{
		let header_lines:string[]	= [];
		let content_lines:string[]	= [];

		// Build the patch content first for the calculation of to-file-line-numbers
		let line_count = 0;
		for(const change of this.changes )
		{
			switch( change.type )
			{
				case 'DeletedLine':
					content_lines.push(`-${change.content}`);
					break;
				case 'UnchangedLine':
					content_lines.push(` ${change.content}`);
					line_count ++;
					break;
				case 'AddedLine':
					content_lines.push(`+${change.content}`);
					line_count ++;
					break;
			}
		}

		header_lines.push(`--- a/${this.from_file}`);
		header_lines.push(`+++ b/${this.to_file}`);

		let fromFileLineNumbers = '';
		let toFileLineNumbers = '';
		if( this.from_range )
		{
			fromFileLineNumbers = `${this.from_range.toDiffStyleString()}`;
		}
		else
		{
			return Error("'from_range' is undefined.");
		}

		if( this.to_range )
		{
			const clone = this.to_range.clone();
			clone.lines = line_count;
			toFileLineNumbers = `${clone.toDiffStyleString()}`;
		}
		else
		{
			return Error("'to_range' is undefined.");
		}

		{
			let line_info = `@@ -${fromFileLineNumbers} +${toFileLineNumbers} @@`;
			if( this.chunk_context.length )
			{
				line_info = [line_info , this.chunk_context].join(' ');
			}

			header_lines.push( line_info );
		}
		

		return header_lines.concat( content_lines ).join('\n') + "\n";
	}
}