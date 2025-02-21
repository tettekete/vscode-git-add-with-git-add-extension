# Change Log

See GitHub Release and commit comments.

## [0.0.9] - 2025-02-22

### Fix & Internal improvements

- Fixed an issue where commands for context menus were being suggested in the command palette.
- Improved so that in the rare case where the git command cannot be executed due to .git/index.lock, it will automatically retry internally.


## [0.0.8] - 2025-02-11

### Fix

- Fixed an issue where `git add` could not be performed when the active tab was displaying non-text content.  
- Resolved an issue where `Show File Status In Status Bar` displayed `No file open` when the active tab was displaying non-text content.
