---

allowed-tools: [AskUserQuestion, Bash, Glob, Grep, Read]
description: Create a GitHub pull request for the current branch, transition the corresponding Jira ticket to review, and record the PR link on the ticket. Use when the user asks to create a PR, send a PR, or invokes /pr.
name: one-pr

---

# Create a Pull Request

Create a GitHub pull request against `liferay-one/liferay-portal`. Transition the linked Jira ticket to review. Record the pull request URL on that ticket.

## Preconditions

- The current branch is a development branch, not `master` or any other protected branch.

- The working tree has no uncommitted changes. Stop when the tree holds a change. Ask the user to commit the change first, and name `/commit`. Do not stash the work. Do not delete the work.

## Pre-flight Checks

Verify these four requirements before you create the pull request. Brian enforces each one.

**Scope:** Run `git diff liferay-one/master-temp --name-only`. Confirm that every changed file belongs to the workspace for this ticket. Stop when a file from another workspace appears, for example a file in `clarity-solution-workspace`. Ask the user to remove that file.

**Commit messages:** Confirm that every commit on the branch has a valid Jira ticket prefix, such as `LPD-`, `LRSD-`, or `LCD-`. The CI bot closes a pull request that holds a commit with no ticket reference.

**Merge conflicts:** Confirm that the branch sits on top of `liferay-one/master-temp` with no conflict. Run `git merge-base --is-ancestor liferay-one/master-temp HEAD`. Offer to run `/one-rebase` first when the branch is behind.

**Code review:** Report the review that the branch has. Recommend a review when the branch has none. The author makes the decision. This check stops for one question. This check never blocks the pull request after the author answers.

Both parts of this check matter. A check that cannot stop gives no value, because the author must hear about a branch with no review before the branch goes out. A check that can block the pull request is worse. Each correction is a new commit. Each new commit makes the receipt out of date. The next review reads the correction and reports something in it. The rounds continue, and the branch grows past the ticket that it was opened for. Ask one question. The answer of the author is then final in both directions. The pull request is not the end of the review. The comments on the pull request are the second part of the review.

Look for one of these two signals:

1. A `one-review` receipt — for `HEAD` first, then for the branch's own commits:

	```bash
	RECEIPTS="$(git rev-parse --path-format=absolute --git-common-dir)/one-review/receipts"

	cat "${RECEIPTS}/$(git rev-parse HEAD)" 2>/dev/null ||
		for SHA in $(git log --format=%H liferay-one/master-temp..HEAD); do
			[ -f "${RECEIPTS}/${SHA}" ] &&
				echo "receipt on ancestor ${SHA}" &&
				cat "${RECEIPTS}/${SHA}" &&
				break
		done
	```

	The `--path-format=absolute` flag gives the path in the form that the receipt uses. A `--git-common-dir` flag without it gives a path relative to the current directory. That path is `.git` at the root of the repository, and `../../.git` in a subdirectory. The path is correct only while the shell stays in the directory that computed it. A `cd` command after the capture, or a later use of the value, makes the path point at another directory. The receipt then reads as missing.

1. A `one-team` review artifact for this ticket. The file is `.one-team/<TICKET>/review.md` at the root of the repository. The `one-team` protocol commits only after the reviewer writes `APPROVED`, so the file is evidence for the branch as committed. The file itself is the signal. A run with `--adversarial` writes an Independence line in place of a receipt, because the reviewer runs with `--read-only`. Name that line in the summary.

Give the state in one or two sentences. Write a note, not a report:

- **A receipt for `HEAD` that reads `verdict: APPROVED` and `tree: clean`, or a `one-team` artifact** — the branch has a review. Say so. Continue without a question.
- **A receipt on an ancestor** — the review covers that commit. The review does not cover the later commits. List the later commits with `git log --oneline <receipt-commit>..HEAD`. This is the usual state of a branch with review corrections on it. It is not a problem.
- **`verdict: CHANGES_REQUESTED`, or `tree: dirty`** — the review has open findings, or it covered a working tree and not a commit. Say which one applies. Name the findings when the receipt holds them.
- **No signal** — the branch has no review. This is the one case with a real recommendation: run `/one-review` before the branch goes out.

In every case except the first case, **do not push. Do not open the pull request. Do not transition the Jira ticket.** Ask one question with `AskUserQuestion`. Give these two options in this order:

1. **Run `/one-review` first** — this is the recommendation, and it is the first option every time. Stop the run here. Return control to the user, so that the user invokes `/one-review`.

1. **Open the pull request anyway** — run every step below, and the Jira transition with them.

Do not open the pull request on a default answer. Do not open it on an unclear answer. Open it only when the author selects it at that question, or when the author says so later.

**A later answer settles the question.** The run stops for the review. The author then says to send the pull request, in this turn or in a later turn. That answer is the decision: open the pull request. Do not ask a second time. Do not report the findings again. Do not ask the author to run the review first. Do not treat an open finding as a block, at any severity. The author knows what the branch is missing. The decision to send the branch belongs to the author. A pull request with no review is a normal pull request.

Never run `/one-review` inside this skill. This rule holds with permission and without permission. This skill reads the record and reports it. This skill is not the review. A review here makes the pull request into another review round.

Read every review in the same way. The `--adversarial` flag is an option for a change that needs it. It is not the requirement. A standard review is an equal signal. A receipt with no `mode` line, or with `mode: standard`, is an equal signal. Name the `mode` in the summary, because the mode is useful information. Do not offer a second run of any review. The user who asks for a pull request already decided how much review this change needs.

**Ticket scope.** This skill does not wait for the correction of every finding. The branch holds the work that the ticket asks for. A finding outside the ticket belongs to a companion ticket. Record such a finding. Do not correct it on this branch. A pull request that grows past its ticket for a review is more difficult to review, and it is not safer.

## Input

### Branch

The current Git branch must hold the commits for the pull request.

### Jira Ticket

Resolve a ticket key in this order:

1. **Branch Name** — read the ticket from the current branch. The branch `LRSD-12299` gives the ticket `LRSD-12299`.

1. **Recent Commits** — read the recent commit messages for a ticket prefix when the branch name gives no ticket.

1. **Fallback** — ask the user when no ticket appears.

The ticket key has the form `LPD-12345`: uppercase letters, a hyphen, and digits.

### Target Repository

The target repository is always `liferay-one/liferay-portal`. The head of the pull request is `<github-username>:<branch-name>`. Read the GitHub username from the `origin` remote URL of the user. The base is `master-temp`.

## Expected Output

### Pushed Branch

Push the current branch to the remote of the user when the remote holds no copy of the branch. Push it also when the branch holds new local commits.

### Pull Request

Write a title under 72 characters. Start the title with the Jira ticket:

```
LPD-12345 Fix something in liferay-one
```

The body follows this format:

```markdown
https://liferay.atlassian.net/browse/TICKET-ID

## What is being fixed

Explain the problem or bug that motivated the change — what was going
wrong or what was missing.

## How it is being fixed

Explain the approach taken across all commits. Describe the key changes
and the reasoning behind the approach. Write in plain prose rather than
bullet points.
```

Show the title and the body to the user before you submit them. Continue after the user approves them.

### Transitioned Jira Ticket

Read the issue type, the status, and the subtasks of the input ticket. Resolve the **target ticket** from them. The target ticket carries the status of the active work. The target ticket also carries the pull request URL:

| Ticket Type | Target |
| --- | --- |
| Bug (`10004`) | The bug itself |
| Task (`10002`) | Its Technical Task (`10153`) subtask |
| Technical Task (`10153`) | Itself |

Transition the target ticket first when it is not in an in-progress status:

| Target Type | Destination | Transition ID |
| --- | --- | --- |
| Bug | In Progress | `61` |
| Technical Task | In Progress | `41` |

Then transition it to review:

| Target Type | Destination | Transition ID |
| --- | --- | --- |
| Bug | In Review | `71` |
| Technical Task | In Peer Review | `31` |

Record the pull request URL also when the review transition fails, for example when the ticket is already in a later status.

Set the **Git Pull Request** field (`customfield_10201`) on the target ticket to the new pull request URL.

### Summary

Report these three items to the user:

- The Jira ticket status and link.
- The pull request URL.
- The review state of the pull request. Give the commit and the verdict of the receipt. Give the `one-team` artifact in place of them when the branch has one. Say instead that the branch has no review and that the author chose to send it. Write one line, in the same form in every case. This line is a record, not a warning, and it counts against nothing in the pull request. Name the `mode` of the receipt next to its verdict when the receipt holds one. For `mode: adversarial`, name the `independence` value and the `reading` value next to it.