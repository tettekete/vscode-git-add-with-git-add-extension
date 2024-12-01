import parseGitDiff,
		{
			AnyFileChange,
			AnyChunk,
			Chunk,
			CombinedChunk,
			AnyLineChange,
			ChangedFile,
			UnchangedLine
		} from 'parse-git-diff';
import { LineRange } from './line-range';
import { PatchMaker } from './patch-maker';

/** Type Gurd for Chunk */
function isChunk(chunk: AnyChunk): chunk is Chunk
{
  return "fromFileRange" in chunk;
}

/** Type Gurd for ChangedFile */
function isChangedFile( file: AnyFileChange ): file is ChangedFile
{
	return file.type === 'ChangedFile';
}


export function makePatchForLineRange({
	diff,
	selectedRange
}:
{
	diff: string
	selectedRange: LineRange
}): string | Error
{
	console.debug(`diff: \n${diff}`);

	const parsedDiff = parseGitDiff( diff );
	let diff_patch: string | Error = Error("makePatchForLineRange() faild.");
	let is_patch_created = false;

	parsedDiff.files.forEach((file: AnyFileChange) =>
	{
		if( is_patch_created )			{ return; }
		if( ! isChangedFile( file ) )	{ return; }

		file.chunks.forEach((chunk: AnyChunk) =>
		{
			if( is_patch_created ){ return; }
			if( isChunk( chunk) )
			{
				const toRange	= LineRange.fromChunkRange( chunk.toFileRange );
				if( ! toRange.getOverlapRange( selectedRange ) )
				{
					console.debug("NOT OVERLAPED.");
					return;
				}

				{
					// for debufg
					let idx = 0;
					for(const change of chunk.changes )
					{
						console.debug(`${idx++}: ${change.content}`);
					}
					console.debug('---');
					console.debug( `fromChunkRange: ${LineRange.fromChunkRange( chunk.fromFileRange ).description()}` );
					console.debug( `toChunkRange  : ${LineRange.fromChunkRange( chunk.toFileRange ).description()}` );
				}

				const patchMaker	= getPatchMakerFromChunkSelection(
										file,
										chunk,
										selectedRange
									);

				if( patchMaker instanceof PatchMaker )
				{
					diff_patch = patchMaker.toString();
				}
				else
				{
					// diff_patch is Error
					return diff_patch;
				}
				
				is_patch_created = true;
			}
		});
	});

	{
		console.debug('---');
		console.debug('# diff_patch');
		console.debug( diff_patch );
		console.debug('---');
	}

	return diff_patch;
}


/**
 * Creates a `PatchMaker` instance based on a selected range within a diff chunk.
 *
 * This function analyzes the given diff chunk and processes the changes within
 * the specified `selectedRange`. It generates a patch that includes the modified
 * lines and their surrounding context. If no applicable changes are found, or if
 * there is an error during processing, an `Error` is returned instead.
 *
 * @param {ChangedFile} file - The file object representing the file associated with the chunk.
 * @param {Chunk} chunk - The chunk containing the range of lines being processed.
 * @param {LineRange} selectedRange - The line range within the chunk that is selected for patching.
 * @returns {PatchMaker | Error} A `PatchMaker` instance representing the patch to apply, or an `Error` if the operation fails.
 */
function getPatchMakerFromChunkSelection(
	file: ChangedFile,
	chunk: Chunk,	// fromRange
	selectedRange: LineRange
): PatchMaker | Error
{
	const header_buff: AnyLineChange[] = [];
	const footer_buff: AnyLineChange[] = [];
	const main_buff: AnyLineChange[] = [];
	const line_mergin = 3;

	const isModifiedChange = ( change: AnyLineChange ): boolean =>
	{
		switch( change.type )
		{
			case 'DeletedLine':
			case 'AddedLine':
				return true;

			default:
				return false;
		}
	};

	// 非 modify 系の change を 3行(line_mergin)分バッファリングする
	const push_to_header_buff = ( change: AnyLineChange ) =>
	{
		switch( change.type )
		{
			case 'DeletedLine':
			case 'UnchangedLine':
				header_buff.push( change );
				break;

			default:
				return;
		}
		
		while( header_buff.length > line_mergin )
		{
			header_buff.shift();
		}
	};

	const push_to_footer_buff = ( change: AnyLineChange  ): boolean =>
	{
		if( footer_buff.length >= line_mergin )
		{
			return false;
		}

		switch( change.type )
		{
			case 'DeletedLine':
			case 'UnchangedLine':
				footer_buff.push( change );
				break;
		}

		
		return true;
	};

	const chunkRange = chunk.fromFileRange;
	let lineNo = chunkRange.start;
	let isInSelection	= false;	// 初めて選択範囲に入ると true
	let isInApplyRange	= false;	// 選択範囲内で初めて modify 系の change が見つかったら true
	let applyStartLineNo: number | undefined = undefined;
	let applyEndLineNo: number | undefined = undefined;
	let applyEndIdx: number | undefined = undefined;

	// 選択範囲内の modify 系 change の塊を main_buff に、
	// その直前の非 modify 系 change を header_buff に溜めます。
	for(let i=0;i<chunk.changes.length;i++ )
	{
		const change = chunk.changes[i];

		if( selectedRange.isInRange( lineNo ) )
		{
			// 選択範囲の中
			isInSelection = true;

			console.debug( `[${change.type}]: ${change.content}`);

			if( isModifiedChange( change ) )
			{
				main_buff.push( change );
				applyEndLineNo	= lineNo;	// 常に更新続ける事で最後の modify 行番号を取得する
				applyEndIdx		= i;
				if( applyStartLineNo === undefined )
				{					
					// 初めて選択範囲内の modify 系 change を見つけたので記録する
					applyStartLineNo = lineNo;
					isInApplyRange	= true;
				}
			}
			else if( typeof applyStartLineNo === 'number' )
			{
				// modify 系ではないが apply 対象の追加フェーズ内なのでメインバッファに追加
				main_buff.push( change );
			}
		}
		else if( isInSelection )
		{
			// 選択範囲外に出た
			isInSelection = false;

			// 末尾に modify 系ではない change が含まれていたら一旦除外する
			while( ! isModifiedChange( main_buff[main_buff.length-1]) )
			{
				main_buff.pop();
			}

			break;
		}

		if( ! isInApplyRange )
		{
			// 選択範囲内の modify 系 change が見つかるまでの間バッファリングする
			push_to_header_buff( change );
		}

		switch( change.type )
		{
			case 'UnchangedLine':
			case 'AddedLine':
				lineNo ++;
				break;
		}
	}

	{
		// debug
		console.debug("---");
		console.debug("%% header_buff");
		for(const change of header_buff )
		{
			console.debug(change.content);
		}

		console.debug("---");
		console.debug("%% main_buff");
		for(const change of main_buff )
		{
			console.debug(change.content);
		}
	}

	// フッター分の	`UnchangedLine` (`DeletedLine` は `UnchangedLine` として扱う)
	// を footer_buff に溜めます。
	if( typeof applyEndIdx === 'undefined' )
	{
		return Error('apply end index is undefined.');
	}

	for( let i = applyEndIdx + 1 ;i<=chunk.changes.length ;i++ )
	{
		const change = chunk.changes[i];
		if( ! push_to_footer_buff( change ) )
		{
			break;
		}
	}

	const unchanged_header_buff	= changeTypeDeletedToUnchanged( header_buff );
	const unchanged_footer_buff	= changeTypeDeletedToUnchanged( footer_buff );
	const all_changes = unchanged_header_buff.concat( main_buff , unchanged_footer_buff );

	{
		// for debug
		console.debug("---");
		console.debug("## all_changes");
		for(const change of all_changes )
		{
			console.debug(`[${change.type}]: ${change.content}`);
			if( change.type === 'UnchangedLine' || change.type === 'DeletedLine' )
			{
				console.debug(`  lineBefore: ${change.lineBefore}`);
			}
			if( change.type === 'UnchangedLine' || change.type === 'AddedLine' )
			{
				console.debug(`  lineAfter : ${change.lineAfter}`);
			}
		}
	}

	const { fromLines ,toLines } = getFromToLinesFromChanges( all_changes );

	if( typeof applyStartLineNo === 'undefined' )
	{
		return Error('apply start line No is undefined.');
	}
	const fromRange	= LineRange.fromStartWithLines(
						applyStartLineNo - line_mergin,
						fromLines
					);
	const toRange	= LineRange.fromStartWithLines(
						applyStartLineNo - line_mergin,
						toLines
					);
	
	const patchMaker = new PatchMaker({
					from_file: file.path,
					to_file: file.path,
					from_range: fromRange,
					to_range: fromRange,			// "git apply" is not "git add". so build patch from "from-file"
					chunk_context: chunk.context ?? '',
					changes: all_changes
				});
	
	return patchMaker;
}


/**
 * Converts the `DeletedLine` “change” in the specified array to `UnchangedLine` “change”.
 *
 * In places other than where the actual change is applied, `DeletedLine` must
 * indicate `UnchangedLine`.
 * 
 * In other words, it is a conversion function for changes in the “margin
 * lines” that the diff uses to identify the changed parts.
 *
 * @param {AnyLineChange[]} changes - An array of line changes to process.
 * @returns {AnyLineChange[]} A new array where `DeletedLine` entries are converted to `UnchangedLine`.
 */
function changeTypeDeletedToUnchanged( changes: AnyLineChange[] ):AnyLineChange[]
{
	const newChnages:AnyLineChange[] = [];

	for( const change of changes )
	{
		if( change.type === 'DeletedLine' )
		{
			const asUnchnaged: UnchangedLine =
			{
				type: 'UnchangedLine',
				content: change.content,
				lineBefore: change.lineBefore,
				lineAfter: change.lineBefore
			};

			newChnages.push( asUnchnaged );
		}
		else
		{
			newChnages.push( change );
		}
	}

	return newChnages;
}


/**
 * The number of lines before(fromLines) and after(toLines) the change is calculated
 * from the AnyLineChange array.
 *
 * @param {AnyLineChange[]} changes
 * @returns {{
 * 	fromLines: number;
 * 	toLines: number;
 * }}
 */
function getFromToLinesFromChanges( changes: AnyLineChange[] ):
{
	fromLines: number;
	toLines: number;
}
{
	let fromLines = 0;
	let toLines = 0;
	
	for( const change of changes )
	{
		switch( change.type )
		{
			case 'UnchangedLine':
				fromLines ++;
				toLines ++;
				break;

			case 'DeletedLine':
				fromLines ++;
				break;

			case 'AddedLine':
				toLines ++;
				break;
		}
	}

	return { fromLines , toLines };
}
