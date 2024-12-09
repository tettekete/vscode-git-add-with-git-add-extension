
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
	isMessageLine,
	isAfterLineChange,
	isBeforeLineChange,
	isModifiedLineChange,
} from './type-gurd/parse-git-diff';

import { isValidKey } from './type-gurd/common';
import { LineRange } from './line-range';
import { kNoNewlineAtEndOfFile } from '../constants';

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
	#lineBeforeIndex: Map<number,{index:number,lineAfter:number | undefined }> = new Map();
	#lineAfterIndex: Map<number,{index:number,lineBefore:number | undefined }> = new Map();

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
		this._changes = changes;
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

	private buildFromToIndex()
	{
		for(let i=0;i<this._changes.length;i++)
		{
			const change = this._changes[i];
			
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
		// let lastLineAfter	= 1;	// 1行目が DeletedLine の時 skip されてしまうのを防ぐためのデフォルト値

		const changes:AnyLineChange[] = [];

		let thisLineAsAfter:number | undefined;
		let isFirstValidLine = false;
		let pendingBuff:DeletedLine[] = [];

		for(let i = 0;i<this._changes.length;i++)
		{
			const change = this._changes[i];

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

			if( hasEnteredModified )
			{
				if( thisLineAsAfter === 1 && pendingBuff.length )
				{
					pendingBuff.forEach((item) => {changes.push( item ); });
					startIdx -= pendingBuff.length;
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

	// push_ok_filter は結果リストに push される直前に評価される
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

			let isNoNewlineAtEndOfFile = false;
			if( i === this._changes.length -1 )
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


	// lineBefore の番号を指定して一致する chnage リスト上のインデックス値を返す
	// 見つからなかった場合 undefined を返す
	getIndexFromBeforeLineNo( beforeLineNo:number ):number | undefined
	{
		const indexInfo	= this.#lineBeforeIndex.get( beforeLineNo );

		return indexInfo	=== undefined
							? indexInfo
							: indexInfo.index;
	}

	
	/**
	 * afterLineNo に対応する beforeLineNo を探し、見つからない場合 undefined を返す。
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
	 * afterLineNo に対応する beforeLineNo を探し、見つからない場合若い方に遡って最初の
	 afterLineNo を返す。

	 それも見つからなかった場合 fallback の指定があればその値を返し、なければ undefined を返す。
	 *
	 * @param {number} afterLineNo - change.lineAfter ベースの行番号
	 * @param {?number} [fallback]
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
				const chnage = this._changes[i];
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

	/**
	 * 開始位置に lineBefore を使い、 lines は after のものを使う
	 * 事でパッチの to-file-line-numbers 向けの LineRange を返す。
	 */
	afterLineRangeForPatch(): LineRange
	{
		return LineRange.fromStartWithLines( this.firstLineBefore, this.afterLines );
	}

	getAsPatchLines():string[]
	{
		let content_lines:string[]	= [];

		const changesLength = this._changes.length;
		for(let i=0;i<changesLength;i++ )
		{
			const change = this._changes[i];

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
