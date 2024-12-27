<p align="center">English / <a href="https://tettekete.github.io/vscode-git-add-with-git-add-extension/README.ja.html">日本語</a></p>

**目次:**

- [git add with git add](#git-add-with-git-add)
	- [コマンドパレットからの操作](#コマンドパレットからの操作)
		- [使い方](#使い方)
		- [コマンドと実行内容](#コマンドと実行内容)
	- [エクスプローラー上のコンテキストメニュー](#エクスプローラー上のコンテキストメニュー)
- [動機](#動機)
- [必要環境](#必要環境)


# git add with git add

VSCode で `git add` を行うにはコマンドパレットで `git stage changes` とタイプする必要があります。

この機能拡張はコマンドパレット上から  `git add` と入力して `git add` コマンドを実行する機能を提供します。

またエクスプローラー上のコンテキストメニューから `git add` や `git add -u` の他、`git restore --staged`(アンステージ)などを行う事が出来ます。


## コマンドパレットからの操作

コマンドパレットから `git add` と入力し、サジェストされた `git add: File in Active Editor` を選ぶことで、現在アクティブとなっているファイルを `git add` します。

同じように `git add` と入力してサジェストされる `git add: Selected Lines or Cursor Line` を選ぶと、選択範囲またはカーソル位置の行を `git add` することが出来ます。

`git add: -u (Update Tracked Files)` で追跡中の更新があったファイルを全て `git add` することも出来ます。


### 使い方

1. コマンドパレットを開きます
   - mac: `cmd` + `shift` + `p`
   - windows: `ctrl` + `shift` + `p`
2. `git add` と入力すれば `git add: File in Active Editor` がサジェストされるので選択してください
   - `git add -u` と入力すれば `git add: -u (Update Tracked Files)` がサジェストされます
3. サジェストされたコマンドを実行すれば現在アクティブなファイルが `git add` されます


### コマンドと実行内容


- **`git add: File in Active Editor`**:

	アクティブウィンドウのファイルが `git add` されます

- **`git add: Selected Lines or Cursor Line`**:

	アクティブウィンドウの選択された行が `git add` のインタラクティブモードで行を選択した時のように `git add` されます（正確には `git apply --cached` を利用しています）

- **`git add: -u (Update Tracked Files)`**:

	`git` 追跡中で更新のあるファイルが `git add` されます。つまり `git add -u` が実行されます。


## エクスプローラー上のコンテキストメニュー

エクスプローラー上のコンテキストメニューからファイルやフォルダに対して以下のコマンドが実行出来ます。

- `git add`
- `git add -u`
- `git restore --staged`
- `git restore`

複数のファイルを選択している場合、選択されたアイテムの上でコンテキストメニューを開いてください。
エクスプローラー下部の空白部分からコンテキストメニューを開いた場合ワークスペースフォルダ全体が対象となりますのでご注意ください。


# 動機

- [“Where is `git add` in Visual Studio Code? - Stack Overflow”](https://stackoverflow.com/questions/49834016/where-is-git-add-in-visual-studio-code)
- [“"Stage Changes" command should be called "Add" · Issue #47876 · microsoft/vscode”](https://github.com/Microsoft/vscode/issues/47876)
- [“Add "Git: Start tracking current file and stage contents" to Command palette · Issue #167715 · microsoft/vscode”](https://github.com/microsoft/vscode/issues/167715)

`git add` は `git add` で実行出来るべきです。


# 必要環境

`git` がインストールされていてパスが通っている必要があります。

