# git-add-with-git-add

コマンドパレットから `git add` と入力し、サジェストされた `git add: current active file` を選ぶことで、現在アクティブとなっているファイルを `git add` します。

# 使い方

1. コマンドパレットを開きます
	- mac: `cmd` + `shift` + `p`
	- windows: `ctrl` + `shift` + `p`
2. `git add` と入力すれば `git add: current active file` がサジェストされるので選択してください
    - `git add -u` と入力すれば `git add -u: Update Tracked Files` がサジェストされます
3. サジェストされたコマンドを実行すれば現在アクティブなファイルが `git add` されます


# 動機

- [“Where is `git add` in Visual Studio Code? - Stack Overflow”](https://stackoverflow.com/questions/49834016/where-is-git-add-in-visual-studio-code)
- [“"Stage Changes" command should be called "Add" · Issue #47876 · microsoft/vscode”](https://github.com/Microsoft/vscode/issues/47876)
- [“Add "Git: Start tracking current file and stage contents" to Command palette · Issue #167715 · microsoft/vscode”](https://github.com/microsoft/vscode/issues/167715)

`git add` は `git add` であり `git add` 以外の何者でも無い。