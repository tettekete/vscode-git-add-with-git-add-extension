import {
	AnyChunk,
	AnyLineChange,
	Chunk,
	UnchangedLine,
	DeletedLine,
	AddedLine,
	MessageLine,
	AnyFileChange,
	ChangedFile
} from 'parse-git-diff';


/** Type Gurd for Chunk */
export function isChunk(chunk: AnyChunk): chunk is Chunk
{
  return "fromFileRange" in chunk
  		&& 'toFileRange' in chunk
		&& 'changes' in chunk
		&& 'context' in chunk;
}

/** Type Gurd for ChangedFile */
export function isChangedFile( file: AnyFileChange ): file is ChangedFile
{
	return file.type === 'ChangedFile';
}

/** Type Gurd for UnchangedLine */
export function isUnchangedLine( change: AnyLineChange ): change is UnchangedLine
{
	return change.type === 'UnchangedLine';
}

/** Type Gurd for DeletedLine */
export function isDeletedLine( change: AnyLineChange ): change is DeletedLine
{
	return change.type === 'DeletedLine';
}

/** Type Gurd for AddedLine */
export function isAddedLine( change: AnyLineChange ): change is AddedLine
{
	return change.type === 'AddedLine';
}

/** Type Gurd for MessageLine */
export function isMessageLine( change: AnyLineChange ): change is MessageLine
{
	return change.type === 'MessageLine';
}

/**  UnchangedLine | AddedLine is after line change*/
export function isAfterLineChange( change: AnyLineChange ):change is UnchangedLine | AddedLine
{
	return isUnchangedLine( change ) || isAddedLine( change );
}

/** UnchangedLine | DeletedLine is before line change*/
export function isBeforeLineChange( change: AnyLineChange ):change is UnchangedLine | DeletedLine
{
	return isUnchangedLine( change ) || isDeletedLine( change );
}

/** Type Guard for modified line that is AddedLine | DeletedLine */
export function isModifiedLineChange( change: AnyLineChange): change is AddedLine | DeletedLine
{
	return isAddedLine( change ) || isDeletedLine( change );
}