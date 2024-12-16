# git　add　with　git　add

To perform `git add` in VSCode, you need to type `git stage changes` in the command palette.

This is a VSCode extension that provides `git add` commands accessible from the Command Palette by typing `git add`.


## Overview

Type `git add` from the command palette and select the suggested `git add: File in Active Editor` to `git add` the currently active file.

Similarly, typing `git add` and selecting the suggested `git add: Selected Lines or Cursor Line` will `git add` the selected range or the line at the cursor position.

`git add -u` is also supported.


# Usage

1. open command palette
	- mac: `cmd` + `shift` + `p`
	- windows: `ctrl` + `shift` + `p`
2. Type `git add` from the command palette and select the suggested `git add: File in Active Editor`
    - If you type `git add -u`, `git add: -u (Update Tracked Files)` will be suggested.
3. Execute the suggested command.

## Command and to be executed

- **`git add: File in Active Editor`**:

	The file in the active window is staged using `git add`.

- **`git add: Selected Lines or Cursor Line`**:
	
	The selected lines in the active window are staged as if using the interactive mode of `git add`, achieved via `git apply --cached`.

- **`git add: -u (Update Tracked Files)`**:

	Files with changes that are being tracked by `git` are staged using `git add`, meaning `git add -u` is executed.


# Motivation

- [“Where is `git add` in Visual Studio Code? - Stack Overflow”](https://stackoverflow.com/questions/49834016/where-is-git-add-in-visual-studio-code)
- [“"Stage Changes" command should be called "Add" · Issue #47876 · microsoft/vscode”](https://github.com/Microsoft/vscode/issues/47876)
- [“Add "Git: Start tracking current file and stage contents" to Command palette · Issue #167715 · microsoft/vscode”](https://github.com/microsoft/vscode/issues/167715)

`git add` should be able to run with `git add`.


# Requirement

Git must be installed and available in the system PATH.


# Appendix

- [日本語版 README](docs/README.ja.md)
