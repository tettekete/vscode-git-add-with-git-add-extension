<p align="center">English / <a href="https://tettekete.github.io/vscode-git-add-with-git-add-extension/README.ja.html">日本語</a></p>

**Table of contents:**

- [git add with git add](#git-add-with-git-add)
	- [Operations from the command palette](#operations-from-the-command-palette)
		- [Usage](#usage)
		- [Command and to be executed](#command-and-to-be-executed)
	- [Context menu in Explorer](#context-menu-in-explorer)
	- [Displaying Git Tracking Status in the Status Bar](#displaying-git-tracking-status-in-the-status-bar)
		- [How to Configure:](#how-to-configure)
		- [Display Format](#display-format)
		- [Important Notes](#important-notes)
- [Motivation](#motivation)
- [Requirement](#requirement)


# git add with git add

To perform `git add` in VSCode, you need to type `git stage changes` in the command palette.

This is a VSCode extension that provides `git add` commands accessible from the Command Palette by typing `git add`.


<img width="623" alt="command palette" src="https://tettekete.github.io/vscode-git-add-with-git-add-extension/images/command-palette.jpg">

Additionally, from the context menu in the Explorer, you can perform actions such as `git add`, `git add -u`, and `git restore --staged` (unstage).  


<img width="545" alt="command palette" src="https://tettekete.github.io/vscode-git-add-with-git-add-extension/images/context-menu.jpg">


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


## Displaying Git Tracking Status in the Status Bar

You can display the Git tracking status and file path of the currently active file in the status bar.

VSCode's Explorer only shows an `M` icon even if a file is partially staged, which can be confusing. Therefore, this feature was implemented. (Of course, this is unnecessary for those who frequently use VSCode's built-in "Source Control" view.)

<img width="189" alt="git tracking status in the status bar" src="https://tettekete.github.io/vscode-git-add-with-git-add-extension/images/git-stat-in-status-bar.jpg">

### How to Configure:

1. Open "Settings"
   - Go to "Settings" → "Extensions" → "git add with git add" → "Show File Status in Status Bar"
   - Alternatively, search for `git-add-with-git-add.showFileStatusInStatusBar` in the settings search bar.
2. Choose either "Display as a status message" or "Always display as a status bar item."

If you choose "Always display as a status bar item," the status will persist in the status bar. If you choose "Display as a status message," it is displayed as a simple status bar message, so it may be overwritten by other messages.

### Display Format

You can specify the display format in the "File Status Display Format" setting. To search for the configuration, look for `git-add-with-git-add.fileStatusFormat`.

The default format is `${git_short_stat} : ${rel_path}`.

Below are the available placeholders and their descriptions:

| Placeholder        | Description |
|--------------------|-------------|
| `${abs_path}`      | Absolute file path |
| `${rel_path}`      | Relative path from the workspace folder |
| `${file}`          | File name |
| `${git_stat}`      | Long style status notation such as `Added`, `Modified`, `Modified+Added` |
| `${git_short_stat}`| Short style status notation such as `A`, `M`, `M+A` |

### Important Notes

The Git command results provided by "git add with git add" are reflected immediately. However, if changes to the tracking status are made by other means, there may be a slight delay in updates. By default, updates can be delayed by up to 3 seconds.

If you want faster updates, you can shorten the `git status polling interval(second)` in the settings. Although it is possible to set the interval to less than 1 second, for performance reasons, the minimum interval is internally limited to 0.3 seconds.



# Motivation

- [“Where is `git add` in Visual Studio Code? - Stack Overflow”](https://stackoverflow.com/questions/49834016/where-is-git-add-in-visual-studio-code)
- [“"Stage Changes" command should be called "Add" · Issue #47876 · microsoft/vscode”](https://github.com/Microsoft/vscode/issues/47876)
- [“Add "Git: Start tracking current file and stage contents" to Command palette · Issue #167715 · microsoft/vscode”](https://github.com/microsoft/vscode/issues/167715)

`git add` should be able to run with `git add`.


# Requirement

Git must be installed and available in the system PATH.
