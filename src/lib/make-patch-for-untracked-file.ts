import * as vscode from 'vscode';
import { PatchFromChunk } from './patch-from-chunk';
import { LineRange } from './line-range';
import { AnyLineChange ,AddedLine } from 'parse-git-diff';

export function makePatchForUntrackedFile(
	{
		editor,
		rel_file_path
	}:
	{
		editor: vscode.TextEditor;
		rel_file_path: string
	}
)
{
	const document = editor.document;
	const selection = editor.selection;

	let startLine:number;
	let endLine:number;

	if ( selection.isEmpty )
	{
		const cursorPosition = selection.active;
		startLine = endLine = cursorPosition.line;
	}
	else
	{
		startLine	= selection.start.line;
		endLine		= selection.end.line;
	}

	const selectionRange = new LineRange( startLine , endLine );
	selectionRange.offsetRange( -startLine );
	const zeroRange	= new LineRange( 0,0 ,false);

	const patchFromChunk = new PatchFromChunk({
		from_file: '/dev/null',
		omit_a_prefix: true,
		to_file: rel_file_path,
		from_range: zeroRange,
		to_range: selectionRange
	});

	for(let i=startLine;i<=endLine;i++)
	{
		const change: AddedLine =
		{
			type: 'AddedLine',
			lineAfter: i + 1,
			content: document.lineAt( i ).text
		};

		patchFromChunk.pushChanges( change );
	}

	return patchFromChunk.toString();
}