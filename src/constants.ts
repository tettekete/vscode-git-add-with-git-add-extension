
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
	kGitDiffCachedNameStatus: 'git diff --cached --name-status'
} as const;


type ValidGitCommandsKey = keyof typeof kValidGitCommands; 
export type ValidGitCommands = (typeof kValidGitCommands)[ValidGitCommandsKey];

export const kGitAdd: typeof kValidGitCommands['kGitAdd'] = kValidGitCommands.kGitAdd;
export const kGitAddUpdate: typeof kValidGitCommands['kGitAddUpdate'] = kValidGitCommands.kGitAddUpdate;
export const kGitRestoreStaged: typeof kValidGitCommands['kGitRestoreStaged'] = kValidGitCommands.kGitRestoreStaged;
export const kGitRestore: typeof kValidGitCommands['kGitRestore'] = kValidGitCommands.kGitRestore;
export const kGitStatusPorcelain: typeof kValidGitCommands['kGitStatusPorcelain'] = kValidGitCommands.kGitStatusPorcelain;
export const kGitDiffCachedNameStatus: typeof kValidGitCommands['kGitDiffCachedNameStatus'] = kValidGitCommands.kGitDiffCachedNameStatus;
