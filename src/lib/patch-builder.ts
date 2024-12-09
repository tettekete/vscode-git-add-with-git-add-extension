
import { LineRange } from './line-range';
import { kNoNewlineAtEndOfFile } from '../constants';
import { PatchFromChunk } from './patch-from-chunk';

export class PatchBuilder
{
	#PatchFromChunks: PatchFromChunk[] = [];

	pushPatch( patch: PatchFromChunk )
	{
		this.#PatchFromChunks.push( patch );
	}

	getPatchString(): string | Error
	{
		switch( this.#PatchFromChunks.length )
		{
			case 0:
				return Error("There are no PatchFromChunk object.");

			case 1:
				return this.#PatchFromChunks[0].toString();
		}

		let patchLines = this.#PatchFromChunks[0].fromToFileHeaderLines();
		let afterLineOffset = 0;
		for(const patch of this.#PatchFromChunks )
		{
			patchLines.push( patch.fromToLineHeader({ afterLineOffset }) );
			patchLines = patchLines.concat( patch.chunkBodyLines() );

			afterLineOffset = patch.afterLines - patch.beforeLines;
		}

		return patchLines.join("\n") + "\n";
	}
}
