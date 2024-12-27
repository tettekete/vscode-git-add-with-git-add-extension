<p align="center">English / <a href="https://github.com/tettekete/vscode-git-add-with-git-add-extension/blob/main/docs/README.ja.md">日本語</a></p>

**Table of contents:**

- [git　add　with　git　add](#gitaddwithgitadd)
	- [Operations from the command palette](#operations-from-the-command-palette)
		- [Usage](#usage)
		- [Command and to be executed](#command-and-to-be-executed)
	- [Context menu in Explorer](#context-menu-in-explorer)
- [Motivation](#motivation)
- [Requirement](#requirement)


# git　add　with　git　add

To perform `git add` in VSCode, you need to type `git stage changes` in the command palette.

This is a VSCode extension that provides `git add` commands accessible from the Command Palette by typing `git add`.

You can also use the context menu in Explorer to perform `git add` and `git add -u`, as well as `git restore --staged` (unstage).

## Operations from the command palette

Type `git add` from the command palette and select the suggested `git add: File in Active Editor` to `git add` the currently active file.

Similarly, typing `git add` and selecting the suggested `git add: Selected Lines or Cursor Line` will `git add` the selected range or the line at the cursor position.

`git add -u` is also supported.


### Usage

1. open command palette
	- mac: `cmd` + `shift` + `p`
	- windows: `ctrl` + `shift` + `p`
2. Type `git add` from the command palette and select the suggested `git add: File in Active Editor`
    - If you type `git add -u`, `git add: -u (Update Tracked Files)` will be suggested.
3. Execute the suggested command.

### Command and to be executed

- **`git add: File in Active Editor`**:

	The file in the active window is staged using `git add`.

- **`git add: Selected Lines or Cursor Line`**:
	
	The selected lines in the active window are staged as if using the interactive mode of `git add`, achieved via `git apply --cached`.

- **`git add: -u (Update Tracked Files)`**:

	Files with changes that are being tracked by `git` are staged using `git add`, meaning `git add -u` is executed.


## Context menu in Explorer

The following commands can be executed for files and folders from the context menu in Explorer.

- `git add`
- `git add -u`
- `git restore --staged`
- `git restore`

If you have selected multiple files, open the context menu on the selected items.

Please note that if you open the context menu from the blank area at the bottom of Explorer, the entire workspace folder will be the target.


# Motivation

- [“Where is `git add` in Visual Studio Code? - Stack Overflow”](https://stackoverflow.com/questions/49834016/where-is-git-add-in-visual-studio-code)
- [“"Stage Changes" command should be called "Add" · Issue #47876 · microsoft/vscode”](https://github.com/Microsoft/vscode/issues/47876)
- [“Add "Git: Start tracking current file and stage contents" to Command palette · Issue #167715 · microsoft/vscode”](https://github.com/microsoft/vscode/issues/167715)

`git add` should be able to run with `git add`.


# Requirement

Git must be installed and available in the system PATH.
