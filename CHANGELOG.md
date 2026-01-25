# Change Log

See GitHub Release and commit comments.

## [0.1.0] - 2026-01-25

- We addressed an issue where VSCode failed to correctly handle Git operations performed outside of VSCode (including cases where Git commands were used via features or extensions), resulting in an warning dialog (“There are no staged changes to commit. Would you like to stage all your changes and commit them directly?”).


## [0.0.9] - 2025-02-22

### Fix & Internal improvements

- Fixed an issue where commands for context menus were being suggested in the command palette.
- Improved so that in the rare case where the git command cannot be executed due to .git/index.lock, it will automatically retry internally.


## [0.0.8] - 2025-02-11

### Fix

- Fixed an issue where `git add` could not be performed when the active tab was displaying non-text content.  
- Resolved an issue where `Show File Status In Status Bar` displayed `No file open` when the active tab was displaying non-text content.
