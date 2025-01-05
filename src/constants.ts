
export const kMessageTimeOut = 8000;


/** kPatchPaddingSize:
 * The diff padding size when creating patches for “git apply”.
 * This should match the default for git diff. The default for git diff is 3.
 */
export const kPatchPaddingSize = 3;

export const kNoNewlineAtEndOfFile = 'No newline at end of file';

export const kValidGitCommands =
{	
	kGitAdd:			'git add',
	kGitAddUpdate:		'git add -u',
	kGitRestoreStaged:	'git restore --staged',
	kGitRestore:		'git restore',
	kGitStatusPorcelain:'git status --porcelain',
	kGitStatusPorcelainUno:		'git status --porcelain -uno',
	kGitDiffCachedNameStatus:	'git diff --cached --name-status',
} as const;

export const
{
	kGitAdd,
	kGitAddUpdate,
	kGitRestoreStaged,
	kGitRestore,
	kGitStatusPorcelain,
	kGitDiffCachedNameStatus,
	kGitStatusPorcelainUno
} = kValidGitCommands;


type ValidGitCommandsKey = keyof typeof kValidGitCommands; 
export type ValidGitCommands = (typeof kValidGitCommands)[ValidGitCommandsKey];
