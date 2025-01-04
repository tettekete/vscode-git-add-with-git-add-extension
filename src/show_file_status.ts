import * as vscode from 'vscode';
import { createStatusBarText } from './lib/file-status-in-bar';

let statusBarItem: vscode.StatusBarItem | undefined;
let activeEditorListener: vscode.Disposable | undefined;
let configChangeListener: vscode.Disposable | undefined;
let statusMessageDisposer: vscode.Disposable | undefined;

export function activateShowFileStatusInStatusBar()
{
	registerConfigChangeListener();
	setupShowFileStatusInStatusBar();
}

export function deactivateShowInFileStatusStatusBar()
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
		if (event.affectsConfiguration('git-add-with-git-add.showFileStatusInStatusBar'))
		{
			setupShowFileStatusInStatusBar();
		}
	});
}


function setupShowFileStatusInStatusBar()
{
	const config = vscode.workspace.getConfiguration();
	const showFileStatusConfig	= config.get<string>('git-add-with-git-add.showFileStatusInStatusBar','none');
	switch( showFileStatusConfig )
	{
		case 'status-bar-item':
			statusMessageDisposer?.dispose();
			_createFileStatusItem();
			updateFileStatusInStatusItem( vscode.window.activeTextEditor );
			registerActiveEditorListener( updateFileStatusInStatusItem );
			
			break;

		case 'status-message':
			statusBarItem?.dispose();
			registerActiveEditorListener( updateFileStatusAsMessage );
			updateFileStatusAsMessage( vscode.window.activeTextEditor );
			break;
		
		default:
			statusMessageDisposer?.dispose();
			statusBarItem?.dispose();
			activeEditorListener?.dispose();
			break;
	}
}

async function updateFileStatusAsMessage( editor?: vscode.TextEditor ):Promise<void>
{
	let message = 'No file open';
	if (editor && editor.document)
	{
		const filePath = editor.document.uri.fsPath;
		message = await createStatusBarText( editor );
	}

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

	let message = '$(chevron-right)No file open';
	if (editor && editor.document)
	{
		const filePath = editor.document.uri.fsPath;
		message = await createStatusBarText( editor );
	}

	statusBarItem.text		= `${message}`;
}

function _createFileStatusItem()
{
	if( statusBarItem )
	{
		statusBarItem.dispose();
	}

	const config		= vscode.workspace.getConfiguration();
	const priority		= config.get<number>('git-add-with-git-add.fileStatusPriority', 0);

	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left ,priority);
	// statusBarItem.tooltip	= vscode.l10n.t('Open SourceTree for the current workspace');
	// statusBarItem.command	= 'tettekete.openSourcetreeButton';

	statusBarItem.show();
}

