
import {
	AnyChunk,
	AnyLineChange,
	Chunk,
	UnchangedLine,
	DeletedLine,
	AddedLine,
	AnyFileChange,
	ChangedFile
} from 'parse-git-diff';

import
{
	isChangedFile,
	isChunk,
	isUnchangedLine,
	isDeletedLine,
	isAddedLine,
	isAfterLineChange,
	isBeforeLineChange,
	isModifiedLineChange,
} from './type-gurd/parse-git-diff';

import { isValidKey } from './type-gurd/common';
import { LineRange } from './line-range';

const RangeBasisType = 
{
	none: 'none',
	lineAfter: 'lineAfter',
	lineBefore: 'lineBefore'
} as const;

const kNoneType		= 'none';
const kLineAfter	= 'lineAfter';
const kLineBefore	= 'lineBefore';

// type RANGE_BASIS_T = (typeof RangeBasisType)[keyof typeof RangeBasisType];
type RANGE_BASIS_T = typeof kNoneType | typeof kLineAfter | typeof kLineBefore;
type BeforeOrAfter = typeof kLineAfter | typeof kLineBefore;

export class ChangeSet
{
	public readonly range_basis: RANGE_BASIS_T = 'none';
	private _changes:AnyLineChange[] = [];

	/*
		_start_line , _end_line は `range_basis` が 'lineAfter' なら
		`lineAfter` の最小値と最大値、`lineBefore` なら `lineBefore` の
		最小値と最大値がそれぞれ代入される。

		`_lines` はそれら差分 +1 の値を取る

		`range_basis` が `none` の場合はいずれも -1
	*/
	// private _start_line: number = -1;
	// private _end_line: number	= -1;
	// private _lines: number		= -1;

	/*
		xxxx_index 系は changesWithToLinesRange などで切り取った際に
		元の chnages のインデックスのどこからどこまでを切り出したかを記録するためのメンバ。

		したがってコンストラクタで xxxx_index 受け取っていないのであれば、コンストラクタで
		受けた chnages の最小最大インデックスつまり
			start_index = 0;
			end_index = changes.length -1;

		となる。
	*/
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
		return [...this._changes];
	}

	changeAt( n: number ):AnyLineChange
	{
		return this._changes[n];
	}

	length():number
	{
		return this._changes.length;
	}

	constructor(
		{
			changes,
			range_basis,
			// start_line,
			// end_line,
			start_index,
			end_index,
		}:
		{
			changes:AnyLineChange[]
			range_basis?: RANGE_BASIS_T;
			// start_line?: number,
			// end_line?: number,
			start_index?: number,
			end_index?: number,
		}
	)
	{
		this._changes = changes;
		if( typeof range_basis !== 'undefined' )	{ this.range_basis = range_basis; }

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
	}

	/**
	 * init utility
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
		

		for(let i=0;i<this._changes.length;i++)
		{
			const change = this._changes[i];

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

	// lineAfter の行番号ベースで指定範囲の change を返す
	// 現状その間の 'DeletedLine' も change にそのまま加えられる。
	/*
		考慮すべき問題点
		1. 開始位置も終了位置も見つからなかった -> 空のリストを返す
		2. 開始位置は見つかったが終了位置は見つからなかった -> 開始位置から changes の最後までを返す
		3. 開始位置が見つからず終了位置のみ見つかった -> change の先頭から終了位置までの塊を返す
	*/

	changesWithToLinesRange( start:number , end:number ):ChangeSet
	{
		return this.changesWithLinesRange( start , end ,'lineAfter' );
	}

	changesWithFromLinesRange( start:number , end:number ):ChangeSet
	{
		return this.changesWithLinesRange( start , end ,'lineBefore' );
	}

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

		for(let i = 0;i<this._changes.length;i++)
		{
			const change = this._changes[i];

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
				changes.push( this._changes[i] );
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

		for(let i = 0;i<this._changes.length;i++)
		{
			const change = this._changes[i];

			if( isValidKey( change , line_type ) )
			{
				// まず start 〜 end の中に入ったかどうかのチェックを行いフラグを立てる
				if( ! hasEnterdRange && change[line_type] >= start )
				{
					hasEnterdRange = true;
				}
				else if( change[line_type] >= end )
				{
					isEndOfRange = true;
					endIdx = i;
				}
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

			if( hasEnteredModified )
			{
				changes.push( change );
			}

			if( isEndOfRange )
			{
				break;
			}
			
		}

		// Add the previous continuous DeletedLine to the change.
		if( changes.length && include_preceding_deleted_lines )
		{
			let foundPendingLine = false;
			let pendingLines = 0;
			for(let i=startIdx - 1;i>=0;i-- )
			{
				const change = this._changes[i];
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

	// ignore_filter は結果リストに push される直前に評価される
	// つまり取得済みサイズ数は増えず、インデックスだけが動く
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
			size = this._changes.length;
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
			if( i < 0 || i >= this._changes.length )	{ break; }

			const change = this._changes[i];

			if( push_ok_filter( change ) )
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

	convertDeletedToUnchnanged()
	{
		for(let i=0;i<this._changes.length;i++)
		{
			const change = this._changes[i];
			if( isDeletedLine( change ) )
			{
				const unchnagedLine:UnchangedLine =
				{
					type: 'UnchangedLine',
					content: change.content,
					lineBefore: change.lineBefore,
					lineAfter: change.lineBefore
				};

				this._changes[i] = unchnagedLine;
			}
		}
	}

	// 開発中断
	getChangesByLineBeforeAndLines(
		{
			beforeStartLine,
			searchDirection = 1,
			lines,
		}:
		{
			beforeStartLine: number;
			searchDirection?: -1 | 1;
			lines?:number;
		}
	)
	{
		const startIndex = this.findIndexFromBeforeLineNo( beforeStartLine );

		if( typeof startIndex === 'undefined' )
		{
			return [];
		}

		const incrementValue = searchDirection < 0 ? -1 : 1;
		if( typeof lines === 'undefined' )
		{
			lines = this._changes.length;
		}

		const chnages:AnyLineChange[] = [];
		let offset = 0;
		let linesCount = 0;	// ややこしいが、
		while( true )
		{
			const i = startIndex + offset;

			if( linesCount >= lines )		{ break; }
			if( i < 0 || i >= chnages.length )	{ break; }

		}

	}

	// lineBefore の番号を指定して一致する chnage リスト上のインデックス値を返す
	// 見つからなかった場合 undefined を返す
	findIndexFromBeforeLineNo( beforeLineNo:number ):number | undefined
	{
		for(let i=0;i<this._changes.length;i++)
		{
			const chnage	= this._changes[i];

			if( isBeforeLineChange( chnage ) )
			{
				if( chnage.lineBefore === beforeLineNo )
				{
					return i;
				}
			}
		}

		return undefined;
	}

	concat( ...args:ChangeSet[] )
	{
		let new_change:AnyLineChange[] = this.getChanges();
		for(const chnageSet of args )
		{
			new_change = new_change.concat( chnageSet.getChanges() );
		}

		return new ChangeSet({ changes: new_change });
	}

	beforeLineRange()
	{
		return LineRange.fromStartWithLines( this.firstLineBefore ,this.beforeLines );
	}

	afterLineRange()
	{
		return LineRange.fromStartWithLines( this.firstLineAfter ,this.afterLines );
	}

	// for debug
	description()
	{
		const lines: string[] = [];
		for(const change of this._changes )
		{
			lines.push(`{type: "${change.type}},content: "${change.content}"`);
		}

		return lines.join("\n");
	}


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

	// getStartAndEnd( line_type:BeforeOrAfter ):{start:number , end:number}
	// {
	// 	return {start:0 ,end:0};
	// }

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
				// 問答無用で truncate
				changes.pop();
			}
		}
	}
}
