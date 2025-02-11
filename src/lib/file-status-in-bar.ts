import * as vscode from 'vscode';
import path from 'node:path';

import {
	findWorkspaceFolder,
	isGitTrackedDir,
	renderTemplate,
	escapeRegexMeta,
	getActiveTabFilePath
} from './utils';

import {
	kGitStatusPorcelain,
	kGitDiffCachedNameStatus
} from '../constants';

import { execGitCommandWithFiles } from './exec-git-commands';

type GitStats =
{
	git_stat: string;
	git_short_stat: string;
}

// - - - - - - - - - - - - - - - - - - - -
// createStatusBarText()
// - - - - - - - - - - - - - - - - - - - -
export async function createStatusBarText( editor?: vscode.TextEditor )
{
	const config = vscode.workspace.getConfiguration();
	const showFileStatusConfig	= config.get<string>('git-add-with-git-add.fileStatusFormat','');

	let filePath:string;
	if( editor )
	{
		filePath	= editor.document.uri.fsPath;
	}
	else
	{
		const pathOrUndefined = getActiveTabFilePath();
		if( pathOrUndefined === undefined )
		{
			return 'No file open';
		}

		filePath	= pathOrUndefined
	}

	
	const kvData:Record<string,string> =
	{
		abs_path: '',
		rel_path: '',
		file: '',
		git_stat: '',
		git_short_stat: ''
	};

	const abs_path		= filePath;
	kvData['abs_path']	= abs_path;

	if( abs_path.length )
	{
		kvData['abs_path'] = abs_path;
		kvData['file'] = path.basename( abs_path );

		const workspaceFolder = findWorkspaceFolder( abs_path );
		if( workspaceFolder )
		{
			kvData['rel_path'] = path.relative( workspaceFolder , abs_path );

			if( await isGitTrackedDir( workspaceFolder ) )
			{
				const stats = await getGitStat( abs_path , workspaceFolder );

				for(const [key,value] of Object.entries( stats ) )
				{
					kvData[key] = value;
				}
			}
			else
			{
				// not in git repository
				kvData['git_stat'] = 'Not a Repo';
				kvData['git_short_stat'] = 'NAR';
			}
		}
	}

	return renderTemplate( showFileStatusConfig , kvData );
}


// - - - - - - - - - - - - - - - - - - - -
// private getGitStat()
// - - - - - - - - - - - - - - - - - - - -
async function getGitStat( filePath: string ,workspace: string ):Promise<GitStats>
{
	const result:GitStats =
	{
		git_stat: 'Error',
		git_short_stat: 'e'
	};

	const { error , stdout , stderr } = await execGitCommandWithFiles({
		command: kGitStatusPorcelain,
		files:[filePath],
		cwd: workspace
	});

	if(! error )
	{
		let mark	= stdout.substring(0,2);
		if( mark === 'A ' )
		{
			// Running git status --porcelain on a renamed file returns 'A ' (while 'R'
			// is returned if no filename is specified).
			//
			// Therefore, when encountering 'A ', verify whether it is truly just "Added."
			if( await isStatusRenamed( filePath, workspace ) )
			{
				mark = 'R ';
			}
		}

		switch(mark)
		{
			case '':	// Clean
				result['git_stat']			= 'Clean';
				result['git_short_stat']	= '✓';
				break;

			case 'A ':	// New file added
			case 'M ':	// Added all modified
			case 'C ':	// Added copied file as new file
				result['git_stat']			= 'Added';
				result['git_short_stat']	= 'A';
				break;
			
			case 'AM':	// Modified after add,
			case 'MM':	// or added part of modified chunk
				result['git_stat']			= 'Modified+Added';
				result['git_short_stat']	= 'M+A';
				break;
			
			case 'R ':	// Renamed and stageed
				result['git_stat']			= 'Renamed';
				result['git_short_stat']	= 'R+A';
				break;
			
			case 'RM':	// Modified after renaming is staged
				result['git_stat']			= 'Renamed→Modified';
				result['git_short_stat']	= 'R→M';
				break;

			case 'RD':	// Deleted after Renaming is staged
				result['git_stat']			= 'Renamed→Deleted';
				result['git_short_stat']	= 'R→D';
				break;
			
			case 'D ':	// Deleted and staged
				result['git_stat']			= 'Deleted+Added';
				result['git_short_stat']	= 'D+A';
				break;
			
			case ' D': // Deleted but not staged
				result['git_stat']			= 'Deleted';
				result['git_short_stat']	= 'D';
				break;
			
			case ' M':	// Modified but not staged
				result['git_stat']			= 'Modified';
				result['git_short_stat']	= 'M';
				break;
			
			case 'MD':	// Deleted after modification is staged
				result['git_stat']			= 'Added→Deleted';
				result['git_short_stat']	= 'A→D';
				break;
			
			case '??':	// Untracked
				result['git_stat']			= 'Untracked';
				result['git_short_stat']	= 'U';
				break;
			
			case 'DD':
			case 'AU':
			case 'UD':
			case 'UA':
			case 'DU':
			case 'AA':
			case 'UU':
				result['git_stat']			= 'Conflicted';
				result['git_short_stat']	= '⚔';
				break;
			
			case '! ':
				result['git_stat']			= 'Ignored';
				result['git_short_stat']	= '!';
				break;

			default:
				result['git_stat']			= `?${mark}`;
				result['git_short_stat']	= `?${mark}`;
				break;
		}
	}

	return result;
}

async function isStatusRenamed( filePath: string ,workspace: string ):Promise<boolean>
{
	let rel_path = filePath;
	if( path.isAbsolute( filePath ) )
	{
		rel_path = path.relative( workspace , filePath );
	}

	const {error,stdout,stderr} = await execGitCommandWithFiles(
		{
			command: kGitDiffCachedNameStatus ,
			files:[],
			cwd: workspace,
			usePeriodWhenEmptyFiles: false
		}
	);

	if( error ){ return false; }

	const regex = new RegExp( escapeRegexMeta( rel_path ) ,'i' );

	for( const line of stdout.split(/[\r\n]+/) )
	{
		const match = line.match(/^(\S+)\s+(.+)/);
		if( ! match ){ continue; }

		const stat	= match[1];
		const files	= match[2];

		if( stat === 'R100' )
		{
			if( regex.test( files ) )
			{
				return true;
			}
		}
	}
	
	return false;

}