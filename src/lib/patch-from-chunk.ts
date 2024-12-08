
import { LineRange } from './line-range';
import { AnyLineChange } from 'parse-git-diff';
import { kNoNewlineAtEndOfFile } from '../constants';
import { ChangeSet } from './change-set';

export class PatchFromChunk
{
	public from_file: string = '/dev/null';
	public to_file: string = '/dev/null';
	public from_range: LineRange | undefined;
	public to_range: LineRange | undefined;
	public chunk_context: string = '';
	public change_set: ChangeSet;
	public omit_a_prefix: boolean = false;

	
	/**
	 * Creates an instance of PatchFromChunk.
	 *
	 * @constructor
	 * @param {{
	 * 		from_file: string;
	 * 		to_file: string;
	 * 		from_range?: LineRange;
	 * 		to_range?: LineRange;
	 * 		chunk_context?: string;
	 * 		omit_a_prefix?: boolean;
	 * 		change_set?: ChangeSet
	 * 	}} param0
	 * @param {string} param0.from_file
	 * @param {string} param0.to_file
	 * @param {LineRange} param0.from_range - change_set の beforeLineRange() を使って欲しくない場合に指定する。例えば UntrackedFile から add する場合特殊な Range を指定する必要がある。
	 * @param {LineRange} param0.to_range - change_set の afterLineRange() を使って欲しくない場合に指定する。例えば UntrackedFile から add する場合特殊な Range を指定する必要がある。
	 * @param {string} param0.chunk_context
	 * @param {boolean} param0.omit_a_prefix - from-file のプリフィックス 'a/' を省略して欲しい場合指定する。具体的には UntrackedFile から add する場合 `a/` は不要
	 * @param {ChangeSet} param0.change_set - パッチの body に相当する ChangeSet オブジェクト
	 */
	constructor({
		from_file,
		to_file,
		from_range,
		to_range,
		chunk_context,		// Extended git diff specification
		omit_a_prefix,
		change_set
	}:
	{
		from_file: string;
		to_file: string;
		from_range?: LineRange;
		to_range?: LineRange;
		chunk_context?: string;
		omit_a_prefix?: boolean;
		change_set: ChangeSet
	})
	{
		this.from_file	= from_file;
		this.to_file	= to_file;
		this.change_set = change_set;

		if( from_range )	{ this.from_range	= from_range;}
		if( to_range )		{ this.to_range	= to_range;}
		if( chunk_context )	{ this.chunk_context = chunk_context;}
		if( omit_a_prefix !== undefined ) { this.omit_a_prefix = omit_a_prefix; }
	}


	toString(): string | Error
	{
		let header_lines:string[]	= [];
		let content_lines:string[]	= [];

		// Build the patch content first for the calculation of to-file-line-numbers
		content_lines = this.change_set.getAsPatchLines() as string[];

		{
			let prefix = 'a/';
			if( this.omit_a_prefix ) { prefix = ''; }
			header_lines.push(`--- ${prefix}${this.from_file}`);
		}
		
		
		header_lines.push(`+++ b/${this.to_file}`);

		let fromFileLineNumbers = this.change_set.beforeLineRange().toDiffStyleString();
		let toFileLineNumbers = this.change_set.afterLineRangeForPatch().toDiffStyleString();
		if( this.from_range )
		{
			fromFileLineNumbers = this.from_range.toDiffStyleString();
		}

		if( this.to_range )
		{
			toFileLineNumbers = this.to_range.toDiffStyleString();
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