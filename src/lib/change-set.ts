
import
{
	AnyLineChange,
	UnchangedLine,
} from 'parse-git-diff';

import
{
	isUnchangedLine,
	isDeletedLine,
	isAddedLine,
	isMessageLine,
	isBeforeLineChange,
	isModifiedLineChange,
} from './type-gurd/parse-git-diff';

import { isValidKey } from './type-gurd/common';
import { LineRange } from './line-range';
import { kNoNewlineAtEndOfFile } from '../constants';

const kNoneType		= 'none';
const kLineAfter	= 'lineAfter';
const kLineBefore	= 'lineBefore';

type BeforeOrAfter = typeof kLineAfter | typeof kLineBefore;

/**
 * Represents a collection of "changes" parsed from a git diff hunk.
 *
 * The "changes" referred to here are the `AnyLineChange[]` defined by the 
 * `parse-git-diff` module.
 * 
 * This class handles lists of "change" objects that describe the differences
 * between file versions, including added, deleted, and unchanged lines. Each
 * "change" object contains information about the line type and its line number
 * before and/or after the change.
 * 
 * Instances of this class are designed to be immutable. Methods that modify
 * or filter the "change" list, such as `getModifyChangesInRange` or
 * `getChangesByIndexAndSize`, return new `ChangeSet` instances while preserving
 * the original list.
 * 
 * Common use cases include extracting specific line ranges for patch creation,
 * calculating line correspondences between the original and modified files,
 * and managing subsets of changes for operations such as filtering or merging.
 *
 * @property {AnyLineChange[]} #changes - The internal list of line changes passed to the constructor.
 * @property {Map<number, {index: number, lineAfter?: number}>} #lineBeforeIndex - A map from `lineBefore` values to their corresponding index and `lineAfter` value.
 * @property {Map<number, {index: number, lineBefore?: number}>} #lineAfterIndex - A map from `lineAfter` values to their corresponding index and `lineBefore` value.
 * @property {number} startIndex - The starting index of the subset at the source of this instance. In other words, if it was generated directly from the “change” list, it is 0.
 * @property {number} endIndex - The ending index of the subset at the source of this instance. In other words, if it was generated directly from the “change” list, it is the length of the list - 1.
 * @property {number} firstLineBefore - The first line number before the change in the current subset.
 * @property {number} lastLineBefore - The last line number before the change in the current subset.
 * @property {number} beforeLines - The total number of lines before the change in the current subset.
 * @property {number} firstLineAfter - The first line number after the change in the current subset.
 * @property {number} lastLineAfter - The last line number after the change in the current subset.
 * @property {number} afterLines - The total number of lines after the change in the current subset.

 */
export class ChangeSet
{
	#changes:AnyLineChange[] = [];
	#lineBeforeIndex: Map<number,{index:number,lineAfter:number | undefined }> = new Map();
	#lineAfterIndex: Map<number,{index:number,lineBefore:number | undefined }> = new Map();

	public readonly startIndex: number;
	public readonly endIndex: number;

	public readonly firstLineBefore:number;
	public readonly lastLineBefore: number;
	public readonly beforeLines:number;
	public readonly firstLineAfter: number;
	public readonly lastLineAfter: number;
	public readonly afterLines:number;

	getChanges()
	{
		return [...this.#changes];
	}

	changeAt( n: number ):AnyLineChange
	{
		return this.#changes[n];
	}

	length():number
	{
		return this.#changes.length;
	}

	constructor(
		{
			changes,
			start_index,
			end_index,
		}:
		{
			changes:AnyLineChange[]
			start_index?: number,
			end_index?: number,
		}
	)
	{
		this.#changes = changes;
		this.buildFromToIndex();

		const r = this.getFirstLastLineNumbers();
		this.firstLineBefore	= r.firstLineBefore;
		this.lastLineBefore		= r.lastLineBefore;
		this.beforeLines		= r.beforeLines;
		this.firstLineAfter		= r.firstLineAfter;
		this.lastLineAfter		= r.lastLineAfter;
		this.beforeLines		= r.beforeLines;
		this.afterLines			= r.afterLines;
		

		// start_index && end_index
		if( typeof start_index === 'undefined' )
		{
			this.startIndex = 0;
		}
		else
		{
			this.startIndex = start_index;
		}

		if( typeof end_index === 'undefined' )
		{
			this.endIndex = changes.length -1;
		}
		else
		{
			this.endIndex = end_index;
		
		}

		// Make it immutable.
		Object.freeze(this);
	}

	/**
	 * Part of the instantiation process
	 *
	 */
	private getFirstLastLineNumbers():
	{
		firstLineBefore:number;
		lastLineBefore: number;
		firstLineAfter: number;
		lastLineAfter: number;
		beforeLines: number;
		afterLines: number;
	}
	{
		let firstLineBefore:number = -1;
		let lastLineBefore:number = -1;
		let firstLineAfter:number = -1;
		let lastLineAfter:number = -1;
		let beforeLines	= 0;
		let afterLines	= 0;
		

		for(let i=0;i<this.#changes.length;i++)
		{
			const change = this.#changes[i];

			if( isValidKey( change ,kLineBefore ) )
			{
				beforeLines ++;
				if( firstLineBefore < 0 )
				{
					firstLineBefore = change[kLineBefore];
				}
				else
				{
					lastLineBefore = change[kLineBefore];
				}
			}
			
			if(isValidKey( change , kLineAfter))
			{
				afterLines ++;

				if( firstLineAfter < 0 )
				{
					
					firstLineAfter = change[kLineAfter];
				}
				else
				{
					lastLineAfter = change[kLineAfter];
				}
			}
		}

		return {
			firstLineBefore ,
			lastLineBefore,
			firstLineAfter,
			lastLineAfter,
			afterLines,
			beforeLines
		};
	}


	/**
	 * Part of the instantiation process
	 *
	 */
	private buildFromToIndex()
	{
		for(let i=0;i<this.#changes.length;i++)
		{
			const change = this.#changes[i];
			
			let lineBefore	= isValidKey(change , kLineBefore) ? change[kLineBefore] : undefined;
			let lineAfter	= isValidKey(change , kLineAfter) ? change[kLineAfter] : undefined;
			
			const beforePair = {
				index: i,
				lineAfter: lineAfter
			};

			const afterPair = {
				index: i,
				lineBefore: lineBefore
			};

			if( lineBefore !== undefined )
			{
				this.#lineBeforeIndex.set( lineBefore , beforePair );
			}

			if( lineAfter !== undefined )
			{
				this.#lineAfterIndex.set( lineAfter , afterPair );
			}
		}
	}


	/**
	 * This method returns the “changes” between the start line and end line based on `lineAfter`.
	 * 
	 * It creates a new `ChangeSet` instance from a subset of the “changes”
	 * and returns it.
	 * 
	 * If neither the start position nor the end position is found, an empty ChangeSet
	 * is returned.
	 * If the start position is not found but the end position is found, a ChangeSet
	 * from the beginning of the list to the end position is returned.
	 * 
	 * If the start position is found but the end position is not found, a ChangeSet
	 * from the start position to the end of the list is returned.
	 * 
	 * @param {number} start - `lineAfter` based start line no
	 * @param {number} end - `lineAfter` based ending line no
	 * @returns A `ChangeSet` instance containing the changes within the specified range.
	 */

	changesWithToLinesRange( start:number , end:number ):ChangeSet
	{
		return this.changesWithLinesRange( start , end ,'lineAfter' );
	}


	/**
	 * This method returns the “changes” between the start line and end line based on `lineBefore`.
	 * 
	 * This is the `lineBefore` version of “changesWithToLinesRange()”.
	 * 
	 * @param {number} start - `lineBefore` based start line no.
	 * @param {number} end - `lineBefore` based ending line no.
	 * @returns A `ChangeSet` instance containing the changes within the specified range.
	 */
	changesWithFromLinesRange( start:number , end:number ):ChangeSet
	{
		return this.changesWithLinesRange( start , end ,'lineBefore' );
	}

	
	/**
	 * This is the implementation of “changesWithToLinesRange()” and “changesWithToLinesRange()”.
	 *
	 * @private
	 * @param {number} start - Starting line number for search.
	 * @param {number} end - Ending line number for search.
	 * @param {BeforeOrAfter} line_type - "lineBefore" or "lineAfter"
	 * @returns {ChangeSet}
	 */
	private changesWithLinesRange(
		start:number ,
		end:number ,
		line_type: BeforeOrAfter
	): ChangeSet
	{
		let hasEnterdRange	= false;
		let isEndOfRange	= false;
		let startIdx		= -1;
		let endIdx			= -1;
		let lastLineNo		= -1;
		let startLineNo		= -1;
		let endLineNo		= -1;

		const changes:AnyLineChange[] = [];

		for(let i = 0;i<this.#changes.length;i++)
		{
			const change = this.#changes[i];

			if( isValidKey( change , line_type ) )
			{
				if( change[line_type] === start )
				{
					// 開始位置を発見
					hasEnterdRange= true;
					startIdx = i;
					startLineNo	= change[line_type];
				}
				else if( change[line_type] === end )
				{
					// 終了位置を発見
					isEndOfRange	= true;
					endIdx 			= i;
					endLineNo	= change[line_type];
				}

				lastLineNo	= change[line_type];
			}

			if( hasEnterdRange )
			{
				// 開始位置が発見されている
				changes.push( change );
			}

			if( isEndOfRange )
			{
				// 最後のラインが見つかったので探索終了
				break;
			}
		}

		if( changes.length )
		{
			// 開始ポイント: 有り
			// 終了ポイント: 有り || 無し
			if( endIdx < 0 )
			{
				// 終わりが見つからなかった場合、本来の終了位置は本 this._changes の外側にあると
				// みなし、何もしない
			}

			return new ChangeSet({
				changes:		changes,
				start_index:	startIdx,
				end_index:		endIdx,
			});
		}
		else if( endIdx > 0 )
		{
			// 開始ポイント: 無し
			// 終了ポイント: あり

			for(let i=0;i<=endIdx;i++)
			{
				changes.push( this.#changes[i] );
			}

			return new ChangeSet({
				changes:		changes,
				start_index:	0,
				end_index:		endIdx,
			});
		}
		else
		{
			// 開始ポイント: 無し
			// 終了ポイント: 無し
			return new ChangeSet({
				changes:		changes,		// == []
				start_index:	startIdx,		// == -1
				end_index:		endIdx,			// == -1
			});
		}
	}

	/**
	* Retrieves a subset of changes representing modified lines within a specified range.
	* This includes added, modified, and optionally preceding deleted lines.
	*
	* @param {number} start - The starting line number (inclusive) of the range to search, based on `lineAfter`.
	* @param {number} end - The ending line number (inclusive) of the range to search, based on `lineAfter`.
	* @param {boolean} [include_preceding_deleted_lines=true] - Whether to include continuous preceding deleted lines
	* that appear before the first modified line.
	* @returns {ChangeSet} A `ChangeSet` instance containing the changes within the specified range.
	*/
	getModifyChangesInRange(
		start:number,
		end:number,
		include_preceding_deleted_lines = true
	):ChangeSet
	{
		const line_type = 'lineAfter';
		let hasEnterdRange		= false;
		let isEndOfRange		= false;
		let hasEnteredModified	= false;
		
		let startIdx		= -1;
		let endIdx			= -1;

		const changes:AnyLineChange[] = [];

		let thisLineAsAfter:number | undefined;
		let isFirstValidLine = false;
		let pendingBuff:AnyLineChange[] = [];

		for(let i = 0;i<this.#changes.length;i++)
		{
			const change = this.#changes[i];

			if( isValidKey( change , line_type ) )
			{
				isFirstValidLine = thisLineAsAfter === undefined ? true : false;
				thisLineAsAfter	= change[line_type];
			}

			// lineAfter が見つかっていない状態
			if( thisLineAsAfter === undefined )
			{
				if( start === 1
				&& isDeletedLine( change ) )
				{
					// かつ start === 1 で DeletedLine ならば後々 changes に加える必要があるかもしれない
					pendingBuff.push( change );
				}

				continue;
			}
			

			// まず start 〜 end の中に入ったかどうかのチェックを行いフラグを立てる
			if( ! hasEnterdRange && thisLineAsAfter >= start )
			{
				hasEnterdRange = true;
			}
			
			if( thisLineAsAfter >= end )
			{
				isEndOfRange = true;
			}			

			// start 以降ならば、最初の modify 系 change を探す
			if( hasEnterdRange )
			{
				if( ! hasEnteredModified )
				{
					if( isModifiedLineChange( change ) )
					{
						// 最初の modify 系 change が見つかった
						hasEnteredModified = true;
						startIdx = i;
					}
				}
			}

			if( ! hasEnteredModified && pendingBuff.length )
			{
				pendingBuff.push( change );
			}

			if( hasEnteredModified )
			{
				if( pendingBuff.length )
				{
					pendingBuff.forEach((item) => {changes.push( item ); });
					startIdx = 0;
					pendingBuff = [];
				}

				changes.push( change );
				endIdx = i;
			}
			else if( isEndOfRange && start === 1 )
			{
				// modified の塊に入る前に選択範囲の終了を迎えた
				// かつ選択範囲の開始位置は 1 であるらば pendingBuff の内容こそが
				// modified-changes である
				pendingBuff.reverse();
				pendingBuff.forEach((item) => {changes.unshift( item ); });
				startIdx = 0;
				endIdx = pendingBuff.length -1;
			}

			if( isEndOfRange )
			{
				break;
			}
			
		}

		// Add the previous continuous DeletedLine to the change.
		if( changes.length
			&& isAddedLine( changes[0] )
			&& include_preceding_deleted_lines )
		{
			let foundPendingLine = false;
			let pendingLines = 0;
			for(let i=startIdx - 1;i>=0;i-- )
			{
				const change = this.#changes[i];
				if( isDeletedLine( change ) )
				{
					changes.unshift( change );
					startIdx --;
					startIdx -= pendingLines;
					pendingLines = 0;
				}
				else if( ! foundPendingLine && isAddedLine( change ) )
				{
					foundPendingLine = true;
					pendingLines ++;
				}
				else
				{
					break;
				}
			}
		}

		// 末尾の UnchangedLine を除外する
		const trimNum = ChangeSet.trimTrailingUnchangedLines( changes );

		return new ChangeSet({
			changes: changes,
			start_index: startIdx,
			end_index: changes.length ? endIdx - trimNum : -1
		});
	}


	/**
	* Returns a ChangeSet object of the specified size from the specified index.
	* 
	* The index of the list is the basis, not “lineAfter” or “lineBefore”.
	* You can specify the search direction with “searchDirection”.
	* 
	* If the end of the list is reached before the size is met, the actual list
	* size will be smaller than the specified size.
	* 
	* You can pass a function to determine whether to actually add to the list
	* with “push_ok_filter”.
	* 
	* In actual use, it is used to extract the header and footer contexts of a
	* patch.
	* 
	* @param {Object} options - The configuration object for the operation.
	* @param {number} options.startIndex - The starting index in the changes list.
	* @param {(-1 | 1)} [options.searchDirection=1] - The direction to search: 
	* `1` for forward or `-1` for backward.
	* @param {number} [options.size] - The maximum number of changes to include in the result.
	* If unspecified, includes all remaining changes in the search direction.
	* @param {(change: AnyLineChange) => boolean} [options.push_ok_filter] - A filter function 
	* to determine if a change should be included in the result. If unspecified, all changes 
	* are included.
	* @returns {ChangeSet} A new `ChangeSet` containing the filtered changes.
	*/
	getChangesByIndexAndSize( 
		{
			startIndex,
			searchDirection = 1,
			size,
			push_ok_filter
		}:
		{
			startIndex: number;
			searchDirection?: -1 | 1;
			size?:number;
			push_ok_filter?:( change: AnyLineChange ) => boolean
		}
	): ChangeSet
	{
		const incrementValue = searchDirection < 0 ? -1 : 1;
		if( typeof size === 'undefined' )
		{
			size = this.#changes.length;
		}

		let filterd_chnages:AnyLineChange[] = [];
		if( typeof push_ok_filter === 'undefined' )
		{
			push_ok_filter = ( change:AnyLineChange ) => true;
		}

		const chnages:AnyLineChange[] = [];

		let startIdx	= -1;
		let endIdx		= -1;
		let offset = 0;
		
		while( true )
		{
			const i = startIndex + offset;

			if( chnages.length >= size )				{ break; }
			if( i < 0 || i >= this.#changes.length )	{ break; }

			const change = this.#changes[i];

			let isNoNewlineAtEndOfFile = false;
			if( i === this.#changes.length -1 )
			{
				if( isMessageLine( change ) 
					&& change.content === kNoNewlineAtEndOfFile )
				{
					isNoNewlineAtEndOfFile = true;
				}
			}

			if( push_ok_filter( change ) || isNoNewlineAtEndOfFile )
			{
				chnages.push( change );
				if( startIdx < 0 )
				{
					startIdx = i;
				}
			}

			endIdx = i;
			offset += incrementValue;
		}

		if( searchDirection < 0 )
		{
			chnages.reverse();
			[startIdx , endIdx] = [endIdx , startIdx ];
		}

		return new ChangeSet(
			{
				changes: chnages,
				start_index: startIdx,
				end_index: endIdx
			}
		);
	}


	/**
	* Converts all `DeletedLine` changes in the current `ChangeSet` to `UnchangedLine` changes.
	* 
	* This method iterates through the internal list of changes, and for each change of type 
	* `DeletedLine`, it creates a new `UnchangedLine` instance with the same content and 
	* `lineBefore` value. The `lineAfter` value is set to match `lineBefore`.
	* 
	* Note: This operation modifies the internal `#changes` list directly.
	*/
	convertDeletedToUnchnanged()
	{
		for(let i=0;i<this.#changes.length;i++)
		{
			const change = this.#changes[i];
			if( isDeletedLine( change ) )
			{
				const unchnagedLine:UnchangedLine =
				{
					type: 'UnchangedLine',
					content: change.content,
					lineBefore: change.lineBefore,
					lineAfter: change.lineBefore
				};

				this.#changes[i] = unchnagedLine;
			}
		}
	}


	/**
	 * Returns the index value on the list of changes that matches the specified
	 * “lineBefore” number.
	 *
	 * @param {number} beforeLineNo
	 * @returns {(number | undefined)}
	 */
	getIndexFromBeforeLineNo( beforeLineNo:number ):number | undefined
	{
		const indexInfo	= this.#lineBeforeIndex.get( beforeLineNo );

		return indexInfo	=== undefined
							? indexInfo
							: indexInfo.index;
	}

	
	/**
	 * Returns the `beforeLine` number of the "change" corresponding to
	 * the specified `afterLine`. If it is not found, it returns undefined.
	 *
	 * @param {number} afterLineNo
	 * @returns {(number | undefined)}
	 */
	getBeforeLineNoFormAfterLineNo( afterLineNo: number ):number | undefined
	{
		const indexInfo	= this.#lineAfterIndex.get( afterLineNo );

		return indexInfo	=== undefined
							? indexInfo
							: indexInfo.lineBefore;
	}


	/**
	 * Returns the `beforeLine` number corresponding to the specified `afterLine`.
	 *
	 * The difference from `getBeforeLineNoFormAfterLineNo()` is that if no `beforeLine`
	 * is found, it returns the first `beforeLine` found by going backwards.
	 * 
	 * If no `beforeLine` is found, it returns the value of `fallback` if specified,
	 * or `undefined` if not.
	 *
	 * @param {number} afterLineNo - lineAfter based number
	 * @param {?number} [fallback] - fallback number if not found.
	 * @returns {(number | undefined)}
	 */
	findBeforeLineNoFormAfterLineNo( afterLineNo:number ,fallback?:number ):number | undefined
	{
		const indexInfo	= this.#lineAfterIndex.get( afterLineNo );
		const return_fallback_or_undefined = () =>
		{
			if( typeof fallback === 'number' )
			{
				return fallback;
			}
			else
			{
				return undefined;
			}
		};

		if( indexInfo === undefined )
		{
			return return_fallback_or_undefined();
		}
		else if( indexInfo.lineBefore === undefined )
		{
			for(let i=indexInfo.index -1;i>=0;i--)
			{
				const chnage = this.#changes[i];
				if( isBeforeLineChange( chnage ) )
				{
					return chnage.lineBefore;
				}
			}

			return return_fallback_or_undefined();
		}
		else
		{
			return indexInfo.lineBefore;
		}
	}

	
	/**
	 * Like Array.prototype.concat(), it returns a combined ChangeSet that combines
	 * the received ChangeSet.
	 *
	 * @param {...ChangeSet[]} - a ChangeSet or list of ChangeSet
	 * @returns {ChangeSet}
	 */
	concat( ...args:ChangeSet[] ):ChangeSet
	{
		let new_change:AnyLineChange[] = this.getChanges();
		for(const chnageSet of args )
		{
			new_change = new_change.concat( chnageSet.getChanges() );
		}

		return new ChangeSet({ changes: new_change });
	}

	
	/**
	 * Returns a LineRange object based on “lineBefore”.
	 *
	 * @returns {LineRange}
	 */
	beforeLineRange():LineRange
	{
		return LineRange.fromStartWithLines( this.firstLineBefore ,this.beforeLines );
	}

	
	/**
	 * Returns a LineRange object based on “lineAfter”.
	 *
	 * @returns {LineRange}
	 */
	afterLineRange():LineRange
	{
		return LineRange.fromStartWithLines( this.firstLineAfter ,this.afterLines );
	}

	/**
	 * For the patch “to-file-line-numbers”, it uses lineBefore for the start
	 * position, and returns a LineRange object using after for the lines.
	 *
	 * @returns {LineRange}
	 */
	afterLineRangeForPatch(): LineRange
	{
		return LineRange.fromStartWithLines( this.firstLineBefore, this.afterLines );
	}


	/**
	 * This returns a simple patch-style text list of the changes in this ChangeSet.
	 *
	 * It does not include the various headers in diff.
	 *
	 * @returns {string[]}
	 */
	getAsPatchLines():string[]
	{
		let content_lines:string[]	= [];

		const changesLength = this.#changes.length;
		for(let i=0;i<changesLength;i++ )
		{
			const change = this.#changes[i];

			switch( change.type )
			{
				case 'DeletedLine':
					content_lines.push(`-${change.content}`);
					break;

				case 'UnchangedLine':
					content_lines.push(` ${change.content}`);
					break;

				case 'AddedLine':
					content_lines.push(`+${change.content}`);
					break;
				
				case 'MessageLine':
					if( i === changesLength -1
						&& change.content === kNoNewlineAtEndOfFile )
					{
						content_lines.push(`\\ ${change.content}`);
					}
					break;
			}
		}

		return content_lines;
	}

	// for debug
	description()
	{
		const lines: string[] = [];
		for(const change of this.#changes )
		{
			lines.push(`{type: "${change.type}},content: "${change.content}"`);
		}

		return lines.join("\n");
	}


	/**
	 * Class Method
	 *
	 * Removes the trailing UnchangedLine from the received `AnyLineChange[]`.
	 *
	 * @static
	 * @param {AnyLineChange[]} changes
	 * @returns {number}
	 */
	static trimTrailingUnchangedLines(
		changes:AnyLineChange[]
	):number
	{
		let trimNum = 0;
		while( changes.length )
		{
			const change = changes[changes.length - 1];
			if( isUnchangedLine( change ) )
			{
				changes.pop();
				trimNum ++;
			}
			else
			{
				break;
			}
		}
		return trimNum;
	}


	
	/**
	 * Class Method
	 *
	 * Delete the "change" from the end of the received `AnyLineChange[]` to
	 * the line number specified by `lineNo` (this line will not be deleted).
	 *
	 * The line number to be specified can be specified as `lineType` based on
	 * `lineAfter` or `lineBefore`.
	 *
	 * @static
	 * @param {AnyLineChange[]} changes
	 * @param {('lineAfter' | 'lineBefore')} lineType
	 * @param {number} lineNo
	 */
	static truncateAfterLineValue(
		changes:AnyLineChange[] ,
		lineType: 'lineAfter' | 'lineBefore',
		lineNo: number
	)
	{
		while( changes.length )
		{
			const change = changes[changes.length - 1];
			if( isValidKey( change , lineType ) )
			{
				if( change[lineType]! <= lineNo )
				{
					break;
				}
				else if( change[lineType] > lineNo  )
				{
					changes.pop();
				}
			}
			else
			{
				// If it is not the specified lineType, truncate
				changes.pop();
			}
		}
	}
}
