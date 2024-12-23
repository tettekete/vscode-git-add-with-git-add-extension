import * as vscode from 'vscode';

import parseGitDiff,
{
	GitDiff,
	ChangedFile,
	Chunk,
	AnyFileChange,
	AnyLineChange
} from 'parse-git-diff';

import
{
	isChangedFile,
	isChunk,
	isUnchangedLine,
	isDeletedLine,
	isAddedLine,
	isBeforeLineChange
} from './type-gurd/parse-git-diff';

import { LineRange } from "./line-range";
import { PatchFromChunk } from './patch-from-chunk';
import { ChangeSet } from './change-set';
import { kPatchPaddingSize } from '../constants';
import { PatchBuilder } from './patch-builder';

import {
	WarningError,
	AlertError,
	InformationError,
	CommonError,
	CriticalError,
	isUserError
} from './user-error';
import type { AnyUserError } from './user-error';

export class MakePatchFromSelection
{
	private selectedChunks: Chunk[] = [];
	private selectionRange: LineRange;
	private changedFile:ChangedFile | undefined = undefined;

	constructor({
		diff,
		selectionRange
	}:
	{
		diff: string;
		selectionRange: LineRange;
	})
	{
		const parsed = parseGitDiff( diff );
		this.selectionRange	= selectionRange;

		const r = this.getSelectedChunksAndFile( parsed );
		if( r )
		{
			this.selectedChunks = r.chunks;
			this.changedFile	= r.changedFile;
		}
	}

	/**
	 * Part of the instantiation process
	 * 
	 * It is called by getSelectedChunksAndFile(), which also performs instantiation
	 * processing.
	 * 
	 * It returns true when the chunk overlaps with the selected range (i.e. the
	 * chunk includes the target for patch creation).
	 *
	 * @param {Chunk} chunk - diff chunk that parsed by 'parse-git-diff'
	 * @returns - It returns true when the chunk overlaps with the selected range.
	 */
	
	private isSelectionInChunk( chunk: Chunk ):boolean
	{
		const chunkRange = LineRange.fromChunkRange( chunk.toFileRange );
		
		return chunkRange.getOverlapRange( this.selectionRange ) ? true : false;
	}

	
	/**
	 * Part of the instantiation process
	 * 
	 * Returns a list of chunks that overlap with the selected range on the GUI,
	 * from the given parsed-diff.
	 * 
	 * **Remember that there are cases where the selection spans multiple chunks.**
	 */
	private getSelectedChunksAndFile( parsedDiff: GitDiff ):
	{
		chunks: Chunk[];
		changedFile: ChangedFile;
	} | undefined
	{
		const chunks:Chunk[] = [];

		let changedFile:ChangedFile | undefined = undefined;
		for(const file of parsedDiff.files )
		{
			if( ! isChangedFile( file ) )	{ continue; }

			for( const chunk of file.chunks )
			{
				if( ! isChunk( chunk) )	{ continue; }

				if( this.isSelectionInChunk( chunk ) )
				{
					chunks.push( chunk );
					if( ! changedFile )
					{
						changedFile = (file as ChangedFile);
					}
				}
			}

			if( changedFile ){ break; }		// Only one file is supported.
		}
		
		if( chunks.length && changedFile )
		{
			return {chunks: chunks, changedFile: changedFile };
		}

		return undefined;
	}

	
	/**
	 * The de facto main processing method
	 *
	 * It creates a PatchFromChunk object based on the modify-change in the overlapping
	 * range of the received chunk and this.selectionRange, and returns it.
	 * 
	 * If there is no modify-change in the overlapping range, it returns an Error
	 * object.
	 *
	 * The processing procedure is outlined as follows:
	 *
	 * 1. Get modify-type changes that overlap with the selected range.
	 * 2. Get the changes that will be used as header padding.
	 * 3. Get the changes that will be used as footer padding.
	 * 4. Creates a ChangeSet object that combines three parts.
	 * 5. A PatchFromChunk instance is created from this data and returned.
	 *
	 * @private
	 * @param {Chunk} chunk
	 * @returns {(PatchFromChunk | Error)}
	 */
	private getPatchFromChunkFromSelection( chunk:Chunk ):PatchFromChunk | AnyUserError
	{	
		
		let chunkLines = Math.max( chunk.fromFileRange.lines , chunk.toFileRange.lines );
		const chunkRange	= LineRange.fromStartWithLines(
								chunk.toFileRange.start,
								chunkLines
							);
		const selectedRange	= chunkRange.getOverlapRange( this.selectionRange );

		if( typeof selectedRange === 'undefined' )
		{
			return CommonError('There are no over-laped range.');
		}

		const sourceChangeSet = new ChangeSet({ changes: chunk.changes });

		// 1. Get modify-type changes that overlap with the selected range.
		const modifiedChangeSet = sourceChangeSet.getModifyChangesInRange(selectedRange.start ,selectedRange.end );

		if( ! modifiedChangeSet.length() )
		{
			return CommonError('There are no modified lines.');
		}

		// 2. Get the changes that will be used as header padding.
		const headerChanges = sourceChangeSet.getChangesByIndexAndSize(
			{
				startIndex: modifiedChangeSet.startIndex -1,
				searchDirection: -1,
				size: kPatchPaddingSize,
				push_ok_filter: ( change: AnyLineChange ) =>
				{
					return isBeforeLineChange( change );
				}
			}
		);

		// Convert DeletedLine in the header to UnchangedLine.
		headerChanges.convertDeletedToUnchnanged();

		// 3. Get the changes that will be used as footer padding.
		const footerChanges = sourceChangeSet.getChangesByIndexAndSize(
			{
				startIndex: modifiedChangeSet.endIndex +1,
				searchDirection: 1,
				size: kPatchPaddingSize,
				push_ok_filter: ( change: AnyLineChange ) =>
				{
					return isBeforeLineChange( change );
				}
			}
		);

		footerChanges.convertDeletedToUnchnanged();

		// Creates a ChangeSet object that combines three parts.
		const allChangeSet = headerChanges.concat( modifiedChangeSet , footerChanges );

		console.debug("---");
		console.debug("%% allChangeSet" );
		console.debug( allChangeSet.description() );
		console.debug("---");

		if( this.changedFile === undefined )
		{
			// This is a TypeScript type checking measure.
			// It is basically impossible because it has already been validated by the caller.
			return Error('The file that was changed could not be found.');
		}

		const file = this.changedFile.path;

		const toLineRange = allChangeSet.afterLineRangeForPatch();

		return new PatchFromChunk({
			from_file: file,
			to_file: file,
			from_range: allChangeSet.beforeLineRange(),
			to_range: toLineRange,
			chunk_context: chunk.context,
			change_set: allChangeSet
		});
	}

	getPatchString():string | AnyUserError
	{
		if( typeof this.changedFile === 'undefined')
		{
			// This means that the constructor could not find a chunk that overlaps with the selection.
			return InformationError(vscode.l10n.t('The selection does not include any changes.'));
		}

		if( this.selectedChunks.length === 0)
		{
			// This is the same thing as above, but with validation to make it more resistant to code changes.
			return InformationError(vscode.l10n.t('The selected chunk was not found.'));
		}
		
		const patchBuilder = new PatchBuilder();

		for(const chunk of this.selectedChunks )
		{
			const patchFromChunk = this.getPatchFromChunkFromSelection( chunk );
			if( patchFromChunk instanceof PatchFromChunk )
			{
				patchBuilder.pushPatch( patchFromChunk );
			}
			else if( isUserError( patchFromChunk ) )
			{
				const userError = patchFromChunk;
				switch( userError.name )
				{
					case 'CommonError':
						break;
					
					default:
						return userError;
				}
			}
			else
			{
				return CommonError( patchFromChunk );
			}
		}

		const patch = patchBuilder.getPatchString();

		if( typeof patch !== 'string' )
		{
			return patch as Error;
		}

		console.debug('---');
		console.debug('%% patch');
		console.debug( patch );
		console.debug('---');

		return patch;
	}
}