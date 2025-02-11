import * as vscode from 'vscode';
import { VSCConfig } from './lib/vsc-config';
import { createStatusBarText } from './lib/file-status-in-bar';
import {
	dispatchGitStatusUpdateEvent,
	onGitStatusChanged
} from './lib/git-status-listener';
import { GAWGADisposer } from './lib/gawga-disposer';
import type { ValidGitStatusEventsT } from './constants';
import { GitStatusObserver } from './lib/git-status-observer';
import {
	kGitStatusUpdated,
	gitEventBus
} from './lib/git-status-event-bus';
import { kGitStatusPollingInterval } from './constants';

const codeIconInStatusItem = '$(chevron-right)';

let statusBarItem: vscode.StatusBarItem | undefined;
let activeEditorListener: vscode.Disposable | undefined;
let configChangeListener: vscode.Disposable | undefined;
let statusMessageDisposer: vscode.Disposable | undefined;
let gitStatusDisposer: GAWGADisposer | undefined;

export function activateShowFileStatusInStatusBar()
{
	registerConfigChangeListener();
	setupShowFileStatusInStatusBar();
}

export function deactivateShowFileStatusInStatusBar()
{
	activeEditorListener?.dispose();
    configChangeListener?.dispose();
    statusBarItem?.dispose();
}

function registerActiveEditorListener( updateDisplayCallback: ( editor?: vscode.TextEditor ) => void )
{
	if (activeEditorListener)
	{
		activeEditorListener.dispose();
	}

	activeEditorListener = vscode.window.onDidChangeActiveTextEditor( updateDisplayCallback );
}


function registerConfigChangeListener()
{
	if (configChangeListener)
	{
		configChangeListener.dispose();
	}

	configChangeListener = vscode.workspace.onDidChangeConfiguration((event) =>
	{
		if( event.affectsConfiguration('git-add-with-git-add.showFileStatusInStatusBar') )
		{
			setupShowFileStatusInStatusBar();
		}

		if( event.affectsConfiguration('git-add-with-git-add.gitStatusPollingInterval') )
		{
			GitStatusObserver.pollingInterval = VSCConfig.gitStatusPollingInterval( kGitStatusPollingInterval )!;
		}
	});
}


function registerGitStatusListener(  updateDisplayCallback: ( editor?: vscode.TextEditor ) => void )
{
	if( gitStatusDisposer )
	{
		gitStatusDisposer.dispose();
	}

	gitStatusDisposer = onGitStatusChanged( (e:ValidGitStatusEventsT) => {updateDisplayCallback();} );
}


function startGitStatusObserver()
{
	GitStatusObserver.start();
	gitEventBus.removeListener( kGitStatusUpdated , dispatchGitStatusUpdateEvent );
	gitEventBus.on( kGitStatusUpdated , dispatchGitStatusUpdateEvent );
}

function stopGitStatusObserver()
{
	gitEventBus.removeListener( kGitStatusUpdated , dispatchGitStatusUpdateEvent );
	GitStatusObserver.stop();
}

function setupShowFileStatusInStatusBar()
{
	const showFileStatusConfig = VSCConfig.showFileStatusInStatusBar( 'none' );
	switch( showFileStatusConfig )
	{
		case 'status-bar-item':
			statusMessageDisposer?.dispose();
			_createFileStatusItem();
			updateFileStatusInStatusItem( vscode.window.activeTextEditor );
			registerActiveEditorListener( updateFileStatusInStatusItem );
			registerGitStatusListener( updateFileStatusInStatusItem );
			startGitStatusObserver();
			break;

		case 'status-message':
			statusBarItem?.dispose();
			registerActiveEditorListener( updateFileStatusAsMessage );
			registerGitStatusListener( updateFileStatusAsMessage );
			updateFileStatusAsMessage( vscode.window.activeTextEditor );
			startGitStatusObserver();
			break;
		
		default:
			statusMessageDisposer?.dispose();
			statusBarItem?.dispose();
			activeEditorListener?.dispose();
			gitStatusDisposer?.dispose();
			stopGitStatusObserver();
			break;
	}
}

async function updateFileStatusAsMessage( editor?: vscode.TextEditor ):Promise<void>
{
	const message = await createStatusBarText( editor );
	
	if( statusMessageDisposer ){ statusMessageDisposer.dispose(); }
	statusMessageDisposer = vscode.window.setStatusBarMessage(`${message}`);
}

async function updateFileStatusInStatusItem( editor?: vscode.TextEditor ):Promise<void>
{
	if( ! statusBarItem )
	{
		_createFileStatusItem();

		if(! statusBarItem )
		{
			return;
		}
	}

	statusBarItem.hide();
	let message = await createStatusBarText( editor );

	statusBarItem.text		= `${codeIconInStatusItem}${message}`;
	statusBarItem.show();
}

function _createFileStatusItem()
{
	if( statusBarItem )
	{
		statusBarItem.dispose();
	}

	const priority	= VSCConfig.fileStatusPriority( 1 );

	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left ,priority);
	statusBarItem.tooltip	= vscode.l10n.t("Displayed by 'git add with git add'");
}

