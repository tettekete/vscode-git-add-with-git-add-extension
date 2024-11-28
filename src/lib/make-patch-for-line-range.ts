import parseGitDiff, { AnyFileChange ,AnyChunk ,Chunk ,CombinedChunk ,AnyLineChange ,ChangedFile } from 'parse-git-diff';
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
			if( isChunk( chunk) )
			{
				const chunkRange	= LineRange.fromChunkRange( chunk.toFileRange );
				const fromRange		= LineRange.fromChunkRange( chunk.fromFileRange );
				const patchRange	= chunkRange.getOverlapRange( selectedRange );

				console.debug( `context: ${chunk.context}`);
				console.debug( `chunkRange.start : ${chunkRange.start}`);
				console.debug( `chunkRange.end   : ${chunkRange.end}`);
				console.debug( `chunkRange.lines: ${chunkRange.lines}`);

				console.debug( `fromFileRange.start  : ${chunk.fromFileRange.start}`);
				console.debug( `fromFileRange.lines  : ${chunk.fromFileRange.lines}`);

				if( ! patchRange )
				{
					console.debug("NOT OVERLAPED.");
					return;
				}

				const patchMaker = new PatchMaker({
					from_file: file.path,
					to_file: file.path,
					from_range: fromRange,
					to_range: fromRange,			// "git apply" is not "git add". so build patch from "from-file"
					chunk_context: chunk.context ?? ''
				});

				console.debug( `patchRange.start  : ${patchRange.start}`);
				console.debug( `patchRange.end  : ${patchRange.end}`);

				// console.log(`chunk: \n${chunk}`);
				let list_idx = 0;	// for debug
				let current_line_idx = -1;	// In order for chunkRange.start + current_line_idx to be the current line, it needs to start from -1.
					// Editor state = for counting the number of lines in the state after editing
					// - `DeletedLine` lines are not counted up
					// - `UnchangedLine` lines are counted up
					// - `AddedLine` lines are counted up
					// Finally, patchMaker calculates the "lines" from the `pushChanges` content.
				for(const change of chunk.changes )
				{
					console.debug( `[${list_idx ++}] ${change.type}: ${change.content}`);

					switch( change.type )
					{
						case 'DeletedLine':
							patchMaker.pushChanges( change );
							break;
						case 'UnchangedLine':
							patchMaker.pushChanges( change );
							current_line_idx ++;
							break;
						case 'AddedLine':
							if( patchRange.isInRange( chunkRange.start + current_line_idx + 1 ))
							{
								patchMaker.pushChanges( change );
							}
							current_line_idx ++;
							break;
					}
				}

				diff_patch = patchMaker.toString();
				is_patch_created = true;
			}
		});
	});


	return diff_patch;
}