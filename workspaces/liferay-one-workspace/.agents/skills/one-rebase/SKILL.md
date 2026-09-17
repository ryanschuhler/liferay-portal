---

allowed-tools: [Bash]
description: Rebase the current branch onto liferay-one/liferay-portal master-temp. Use when the user asks to rebase, sync with upstream, or update their branch.
name: one-rebase

---

# Rebase onto liferay-one master-temp

Rebase the current branch onto the latest `master-temp` from `liferay-one/liferay-portal`.

## Preconditions

- The working tree has no uncommitted changes. Stop when the tree holds a change. Ask the user to commit the change first, and name `/commit`. Do not stash the work. Do not delete the work.

- The current branch is not a protected branch. The protected branches are `master` and `master-temp`. Stop on one of these branches, and report the error.

## Steps

### 1. Locate the Upstream Remote

Read `git remote -v`. Find the remote with `liferay-one/liferay-portal` in its URL. Record the name of that remote.

Add the remote when it does not exist:

```bash
git remote add liferay-one https://github.com/liferay-one/liferay-portal.git
```

Use `liferay-one` as the remote name in the next steps.

### 2. Fetch

```bash
git fetch <remote> master-temp
```

### 3. Rebase

```bash
git rebase <remote>/master-temp
```

Stop when the rebase reports a conflict. Report the files with the conflict to the user. Do not resolve a conflict yourself.

## Report

Report the branch name after a successful rebase. Report the upstream ref `<remote>/master-temp` that the branch now sits on.