import * as vscode from "vscode";

/**
 * Git モデルをリフレッシュする
 *
 * VSCode 外で git 操作が行われた場合 VSCode はそれを感知しないことがある。
 * その場合、ステージングしたのに VSCode から Git Commit が出来ないと言った問題が
 * 出ることがある。
 * この問題に対処するために VSCode 側の Git モデルをリフレッシュする。
 */
export async function refreshGitModel()
{
	// `git.refresh` は built-in Git 拡張のコマンド ID
	// 無効化されている環境や、Git 拡張が死んでいるケースもあるので握りつぶしてOK
	try
	{
		await vscode.commands.executeCommand( "git.refresh" );
	}
	catch( err )
	{
		// noop
	}
}
