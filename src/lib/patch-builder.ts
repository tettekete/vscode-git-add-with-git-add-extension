import * as vscode from 'vscode';

import { LineRange } from './line-range';
import { kNoNewlineAtEndOfFile } from '../constants';
import { PatchFromChunk } from './patch-from-chunk';

import { InformationError } from './user-error';
import type { AnyUserError } from './user-error';

export class PatchBuilder
{
	#PatchFromChunks: PatchFromChunk[] = [];

	pushPatch( patch: PatchFromChunk )
	{
		this.#PatchFromChunks.push( patch );
	}

	getPatchString(): string | AnyUserError
	{
		switch( this.#PatchFromChunks.length )
		{
			case 0:
				return InformationError(vscode.l10n.t("The selection does not include any changes."));

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
