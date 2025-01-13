
export const kMessageTimeOut = 8000;
export const kGitStatusPollingInterval = 3;	// unit: second

/** kPatchPaddingSize:
 * The diff padding size when creating patches for “git apply”.
 * This should match the default for git diff. The default for git diff is 3.
 */
export const kPatchPaddingSize = 3;

export const kNoNewlineAtEndOfFile = 'No newline at end of file';


// - - - - - - - - - - - - - - - - - - - -
// Constants and type definitions related to git commands
// - - - - - - - - - - - - - - - - - - - -
export const kValidGitCommands =
{	
	kGitAdd:			'git add',
	kGitAddUpdate:		'git add -u',
	kGitRestoreStaged:	'git restore --staged',
	kGitRestore:		'git restore',
	kGitStatusPorcelain:'git status --porcelain',
	kGitStatusPorcelainUno:		'git status --porcelain -uno',
	kGitDiffCachedNameStatus:	'git diff --cached --name-status',
	kGitDiff:					'git diff'
} as const;

export const
{
	kGitAdd,
	kGitAddUpdate,
	kGitRestoreStaged,
	kGitRestore,
	kGitStatusPorcelain,
	kGitDiffCachedNameStatus,
	kGitStatusPorcelainUno,
	kGitDiff
} = kValidGitCommands;


type ValidGitCommandsKey = keyof typeof kValidGitCommands; 
export type ValidGitCommands = (typeof kValidGitCommands)[ValidGitCommandsKey];

// - - - - - - - - - - - - - - - - - - - -
// Constants and type definitions related to git status observing
// - - - - - - - - - - - - - - - - - - - -

export const kGitStatusUpdateEvent = 'update';
export const ValidGitStatusEvents = [
	kGitStatusUpdateEvent
] as const;

export type ValidGitStatusEventsT = (typeof kGitStatusUpdateEvent)[number];
