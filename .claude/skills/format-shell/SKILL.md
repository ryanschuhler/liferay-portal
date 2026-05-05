---

allowed-tools: [Bash, Edit, Glob, Grep, Read, Write]
argument-hint: "[path or glob of .sh files]"
description: Format shell scripts to match liferay-docker conventions — function keyword, local variables, long-form flags, quoting, and conditional layout. Use when the user asks to format or clean up .sh files.
name: format-shell

---

# Shell Script Formatter

Apply liferay-docker shell conventions to the target file(s).

## Input

When `${ARGUMENTS}` names a file or glob, format those files. When no path is supplied, ask the user which files to format.

Skip files that contain `# This is a generated file.`

## Workflow

### 1. Read the File

Read each target file in full before making changes. Note any deviations from the conventions in `.claude/rules/shell-scripts.md`.

### 2. Apply the Conventions

Work through each category in order. Apply all rules from `.claude/rules/shell-scripts.md`.

#### Checklist

- [ ] File name uses underscores, not hyphens (`extract_hotfix.sh` not `extract-hotfix.sh`) — rename with `git mv` and update all callers
- [ ] Shebang is `#!/bin/bash` on line 1
- [ ] Every script has a `main` function
- [ ] `main` is the last function defined, called as `main "${@}"` on the final line
- [ ] Function definitions use `function name {` form (not `name()`)
- [ ] Function-scoped variables are declared with `local` and `lowercase_snake_case`
- [ ] Script-level variables are `SCREAMING_SNAKE_CASE`
- [ ] All variables use `${braces}`: `"${var}"` not `"$var"`
- [ ] All command substitutions are quoted: `VAR="$(cmd)"` not `VAR=$(cmd)`
- [ ] Bare string assignments are quoted: `VAR="value"` not `VAR=value`
- [ ] Indentation is 4 spaces per level, no tabs
- [ ] `then` is on its own line, not inline after `]`
- [ ] `do` is on its own line, not inline after `]` or `in ...`
- [ ] Simple redirections have a space before `>`: `command > /dev/null`; combined forms have no space: `&>/dev/null`, `2>&1`
- [ ] `mkdir -p` → `mkdir --parents`
- [ ] `cp -R` → `cp --recursive`
- [ ] `rm -rf` → `rm --force --recursive`
- [ ] `sed -i` → `sed --in-place`
- [ ] `curl -f` → `curl --fail`, `-L` → `--location`, `-o` → `--output`, `-s` → `--silent`, `-X` → `--request`
- [ ] `grep -o` → `grep --only-matching`, `-P` → `--perl-regexp`, `-c` → `--count`, `-w` → `--word-regexp`
- [ ] `cut -d` → `cut --delimiter`, `-f` → `--fields`
- [ ] `sort -V` → `sort --version-sort`
- [ ] `tail -n` → `tail --lines`
- [ ] `tee -a` → `tee --append`
- [ ] `tr -d` → `tr --delete`
- [ ] `wc -l` → `wc --lines`
- [ ] Multi-flag commands broken into one flag per line with 8-space indentation and backslash continuation
- [ ] Pipelines spanning multiple lines use backslash continuation after `|`
- [ ] `source` used (not `.`) to load other scripts; same-directory files prefixed with `./`
- [ ] Arithmetic uses `$(( ))` expansion
- [ ] `echo ""` used for blank output lines (not bare `echo`)
- [ ] Dependent variable declarations are separated by a blank line (e.g. `WORKSPACE_DIR` that uses `SCRIPT_DIR` gets a blank line between them)

### 3. Validate

Re-read the formatted file and confirm every checklist item passes.

### 4. Report

List the changes made, grouped by category (naming, quoting, flags, conditionals).
