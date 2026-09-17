---

allowed-tools: [Bash]
description: Merge the current branch's PR to liferay-one master-temp, then forward it to liferay-one master via a new PR with ci:forward. Use when the user asks to forward a PR, send a PR upstream, or invokes /one-pr-forward.

name: one-pr-forward

---

# Forward Current Branch PR Upstream

Run this skill from the current branch. Merge the open pull request of the branch into `liferay-one/liferay-portal:master-temp`. Rebase the branch onto `liferay-one/master`. Open a forwarding pull request against `liferay-one/liferay-portal:master`. Start CI with `ci:forward`.

## Usage

```
/one-pr-forward
```

Run this skill from the branch with a reviewed pull request that is ready to send.

## Preconditions

- The working tree has no uncommitted changes. Stop when the tree holds a change. Ask the user to commit the change, or to stash it.
- The current branch is not a protected branch. The protected branches are `master` and `master-temp`. Stop on one of these branches, and report the error.

## Steps

### 1. Resolve Context

Read the GitHub username from the `origin` remote URL, for example `ryanschuhler` from `git@github.com:ryanschuhler/liferay-portal.git`.

Record the current branch name.

Run `git remote -v`. Find the remote with `liferay-one/liferay-portal` in its URL. Record the name of that remote. The name is `liferay-one` or `team`.

### 2. Find the Open PR

Read the open pull request for the current branch with the base `master-temp`:

```bash
gh pr list \
  --repo liferay-one/liferay-portal \
  --head <github-username>:<branch-name> \
  --base master-temp \
  --state open \
  --json number,title,body,url
```

Stop when the command finds no open pull request. Report this message: "No open PR found for branch `<branch-name>` targeting master-temp on liferay-one/liferay-portal."

Read these four fields:
- `number` — the number of the pull request.
- `title` — the title of the pull request. The Jira ticket comes from this title.
- `body` — the description of the pull request.
- `url` — the link to this pull request.

Read the Jira ticket ID from the title with the pattern `[A-Z]+-[0-9]+`, for example `LRSD-12345`.

### 3. Merge the PR into master-temp

```bash
gh pr merge <number> \
  --repo liferay-one/liferay-portal \
  --merge \
  --delete-branch=false
```

Stop when the command fails. Report the error message.

### 4. Rebase onto liferay-one/master

Fetch the current master branch:

```bash
git fetch <liferay-one-remote> master
```

Rebase the current branch onto it:

```bash
git rebase <liferay-one-remote>/master
```

Run `git rebase --abort` when the rebase reports a conflict. Report the files with the conflict. Stop the skill. Do not resolve a conflict yourself.

### 5. Push to origin

```bash
git push origin <branch-name> --force-with-lease
```

The rebase wrote a new history for the branch, so this push needs `--force-with-lease`. Stop when the push fails. Report the error.

### 6. Create the Forwarding PR

Build the body of the pull request:

```
<original PR body>

---

Jira: https://liferay.atlassian.net/browse/<ticket-id>
Forwarded from: <original-pr-url>
```

Create the pull request against `liferay-one/liferay-portal:master`:

```bash
gh pr create \
  --repo liferay-one/liferay-portal \
  --base master \
  --head <github-username>:<branch-name> \
  --title "<original title>" \
  --body "$(cat <<'EOF'
<body>
EOF
)"
```

Record the number and the URL of the new pull request from the command output.

### 7. Trigger CI Forwarding

```bash
gh pr comment <new-pr-number> \
  --repo liferay-one/liferay-portal \
  --body "ci:forward"
```

## Report

Return these two items:
- The URL of the forwarding pull request.
- The confirmation that the skill posted `ci:forward`. CI then runs the tests and sends the pull request to bchan.