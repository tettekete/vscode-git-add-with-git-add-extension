import * as vscode from 'vscode';
import { PatchFromChunk } from './patch-from-chunk';
import { LineRange } from './line-range';
import { AnyLineChange ,AddedLine } from 'parse-git-diff';
import { ChangeSet } from './change-set';

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

	const changes: AnyLineChange[] = [];

	for(let i=startLine;i<=endLine;i++)
	{
		const change: AddedLine =
		{
			type: 'AddedLine',
			lineAfter: i + 1,
			content: document.lineAt( i ).text
		};

		changes.push( change );
	}

	const change_set = new ChangeSet({ changes: changes });

	const patchFromChunk = new PatchFromChunk({
		from_file: '/dev/null',
		omit_a_prefix: true,
		to_file: rel_file_path,
		from_range: zeroRange,
		to_range: selectionRange,
		change_set: change_set
	});

	return patchFromChunk.toString();
}