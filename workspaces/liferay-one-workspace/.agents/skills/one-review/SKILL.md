---

allowed-tools: [Agent, Bash, Edit, Glob, Grep, Read, Skill, Write]
description: Run a full code review in either lane — formats source, then reviews the diff against the shared review criteria for correctness, concurrency, efficiency, security, and workspace rules. Invoke from the workspace or from the Liferay One scripts repo.
name: one-review

---

# One Review

Run a complete review pass. First run the automated formatter. Then apply the shared review criteria to the branch diff. Then add the results of the automated code review.

[`criteria.md`](./criteria.md) defines what a review covers: the lenses and their weighting, the rule files behind them, the mechanical sweep, the calibration of false positives, and the format of a finding. This file does not repeat that content. This skill is the interactive workflow around `criteria.md`. The `one-team` reviewer charter reads the same file, so a finding from either reviewer means the same thing. **Put every new review heuristic in `criteria.md`.**

**Under `--adversarial`, read [`orchestration.md`](./orchestration.md) first, then obey it.** That file defines the independent passes, who may read the diff, and how the findings combine. It replaces this session's own reading with delegated passes, and it governs every step below. Without the flag, do not read that file at all. Work the steps below in this session, as written.

Two results follow from that file being separate.

First, **a session whose own prompt names it a pass ignores `orchestration.md` completely**, whatever flags the run carries. Such a session works Steps 1 through 5 in this file. This rule stops a pass from spawning passes of its own.

Second, everything a pass must obey lives in *this* file. Four obligations matter most, because `orchestration.md` holds the reasons for them and a pass never reads that file.

- A pass **always runs Step 1 in its check-only form**, whatever flags the run carries. Every pass shares one checkout, and two mutating formatters that run at the same time corrupt the tree that all of them read.
- A pass **writes no receipt**. Record the Verdict belongs to the session that combines the passes, and `/one-pr` later reads a receipt as evidence that a reviewer reviewed the branch.
- A pass **stops after Step 5**. It does not run Step 6.
- A pass **records no independence state**. It writes no Independence section, no Passes section, and no Dropped candidates section. Those sections describe a combination that a pass cannot see.

## Lanes

There are two lanes and one review. This table holds everything that differs between them. The rest of this file applies to both lanes, and so do the shared rows in `criteria.md`.

| | Workspace lane | Scripts lane |
| --- | --- | --- |
| Reviews | `<WORKSPACE>` — client extensions, objects, site content | `<SCRIPTS>` — `one/` ETL and migration scripts |
| Base ref `<BASE>` | `liferay-one/master-temp` | `liferay-one/main` |
| Step 1 formatter | The `one-format` skill. Under `--read-only`, run `one-format --check` | Run `bunx prettier --write <touched paths>` from `<TARGET>`, then run `bun run lint`. Under `--read-only`, use `--check` in place of `--write` |
| Step 3 criteria rows | The rows tagged for the workspace lane | The rows tagged for the scripts lane |
| Step 4 blast radius | Trace into `<WORKSPACE>`. Then trace into `<SCRIPTS>/one/` for each symbol that crosses the contract | Trace into `<SCRIPTS>`. Then trace into the batch definitions and the Spring Boot controllers of the workspace |
| Step 5 automated pass | Run `/code-review` | Skip it. `criteria.md` explains why the skill does not fit this lane |
| Step 6 learn | Run the `one-review-learn` skill | Run the same skill. Read it from `<WORKSPACE>`. Encode the results into `<SCRIPTS>/.agents/rules/` and into the ESLint configuration of that repository |

**The invoking directory selects the lane.** A session that starts anywhere inside the `scripts` checkout is the scripts lane. A session that starts inside `liferay-one-workspace` is the workspace lane. This is the default, and it needs no confirmation.

Both lanes read `criteria.md` in place from `<WORKSPACE>`, as they read the rule files. Resolve `<WORKSPACE>` as `workspaces/liferay-one-workspace` inside a sibling `liferay-portal` checkout. From the root of the scripts repository, the usual path is `../liferay-portal/workspaces/liferay-one-workspace`. Confirm the path when you find `client-extensions/liferay-one-batch/batch/` below it.

A diff that changes a file outside `<TARGET>` is a blocker in both lanes, per `criteria.md`.

## Flags

- `--read-only` — Review everything. Change nothing in the working tree. Verify the formatting with the check-only command of the lane instead of correcting it. Skip Step 6, because Step 6 writes source. Record no receipt. Run `/code-review` plain. Every check still runs, so the coverage is the same as a plain run. The run still writes two artifacts. Both go inside the git common directory and neither goes in the tree: the derived criteria file that the pass prompts point at, and the `write-tree` snapshot that bounds a re-review round. This flag protects the tree, and the git directory is not the tree. The receipts live there for the same reason. Use this flag when another process owns the formatter, or when a read-only rule binds the caller. Such a rule binds the `one-team` reviewer, and this flag is what lets it run this skill.
- `--fix` — Apply every safe correction automatically: format, lint, and the fixes from the code review.
- `--comment` — Post the review findings as inline comments on the GitHub pull request. In the workspace lane, pass this flag through to `/code-review`. The scripts lane has no automated pass to carry it, so post the findings directly. Validate every anchor against the head of the pull request before you post. A comment on a line that the diff never touched reads as a false positive.
- `--adversarial` — **Off by default.** Replace this session's own reading of the diff with two or more independent passes that cannot see each other. Combine the passes here, per [`orchestration.md`](./orchestration.md). The flag exists for one reason. A session that wrote the code reviews it worse than a stranger does, and so does a session that a builder briefed. Neither session can detect that from inside. The cost is high. Each pass is a full review, so two passes cost about twice a plain run and three passes cost about three times. Use the flag under two conditions together. The first: a mistake is expensive, as in a migration that writes data, a contract that other code depends on, or anything that goes out to a customer. The second: the reviewing session also built the change. A plain run is the correct default everywhere else. Without the flag, nothing below changes.
- `--effort <low|medium|high|xhigh|max>` — Pass this value through to `/code-review`. The default value is `medium`. The flag has no effect in the scripts lane.

`--read-only` contradicts `--fix` and `--comment`. When they arrive together, stop and ask which one the caller meant. Do not guess.

## Step 1: Format

Run the Step 1 command for the lane from the Lanes table.

Under `--read-only`, run the check-only form. It verifies every formatter step and writes nothing. Report each violation as a finding under the Repo rules lens. Do not fix the violations. Do not run the mutating formatter again to confirm them.

Otherwise run the mutating form. When the formatter fails, stop and report the error. Do not review a diff after a failed formatter run.

A lint failure or a formatter failure that the diff did not introduce is not a finding. **Only the session confirms that**, and only in a temporary worktree. Create the worktree with `git -C <TARGET> worktree add --detach <tmp> <BASE>`, run the command there, then remove the worktree. In the workspace lane that command checks out the whole portal repository for one formatter run. Add `--no-checkout` and sparse-checkout only the paths the command needs.

Never confirm such a failure through a checkout or a stash in the shared checkout. In a `one-team` run the shared checkout holds staged work with no commit behind it, so one stash there discards the change under review.

Under `--adversarial` a second reason applies. The passes read that tree at the same time, and each one would then see a repository that differs from the one it started on. Under that flag a pass reports such a failure as unconfirmed and leaves the confirmation to the session. When the command fails at `<BASE>` as well, say so plainly and continue.

## Step 2: Establish the Diff

```bash
T=<TARGET>
BASE=$(git -C "${T}" merge-base HEAD <BASE>)

git -C "${T}" diff "${BASE}...HEAD" --name-only
git -C "${T}" diff "${BASE}...HEAD"
```

**Pin every git call to `<TARGET>` with `-C`, in this step and in every step below.** The working directory of a shell does not always persist between calls, because a harness can reset it. A `git diff` without `-C` then reports on whichever repository the process sits in, and it gives no warning. The result is a review whose diff comes from the wrong repository. No later step detects that, because every later step trusts the diff it receives. The risk is highest in the setups this skill already assumes: a worktree, a sibling workspace checkout, or two repositories open at the same time.

Include the uncommitted work when the tree holds any — `git -C "${T}" diff HEAD` and `git -C "${T}" diff --cached`. A staged and uncommitted change is a normal state, not a rare one. A `one-team` run reaches the review with every change staged and no change committed. There `${BASE}...HEAD` is empty, and `git diff --cached` holds the whole change. When all three commands return nothing, or when the base is ambiguous, stop and ask. Do not guess.

To review one commit rather than a branch, do not use `merge-base`. That commit is not an ancestor of `<BASE>`, so `merge-base` returns the wrong ancestor or returns nothing. Use the commit and its parent directly (`<SHA>~1..<SHA>`), and state in the report that the review covered that range.

When the prompt hands you two object names instead — a re-review round under `--adversarial`, per `orchestration.md` — diff them directly, `git -C "${T}" diff <old> <new>`. The two-argument form is the only form that accepts both commits and trees. `merge-base` rejects a tree, and so does the three-dot form. A pass that uses the recipe above on two trees stops on a fatal error.

To review a pull request rather than the local branch, fetch its head into a worktree and read the diff there. A review that runs against the local checkout while it reasons about a remote pull request reads the base and reports corrected code as broken.

Read the whole diff. Record the kind of change: feature, refactor, fix, or deletion. Then read the context around each changed file — the rest of the class, the callers, the tests. Read what the lenses need. Do not read the whole subsystem.

## Step 3: Work the Criteria

Read [`criteria.md`](./criteria.md) and work the whole file against the diff, in this order: the rule files for the lane, then every lens in the order that file gives, then the mechanical sweep. Apply the rows tagged for this lane and skip the rows tagged for the other lane. Step 4 owns the Regression risk lens instead. That lens reads code outside the diff, so it gets a pass of its own rather than a paragraph of attention here.

For a diff below about two hundred changed lines, work the lenses in this session. Every subagent reads the diff and the rule files again, so a fan-out on a small diff costs more than it saves.

For a larger diff, group the lenses into four `sonnet` subagents rather than one subagent per lens: correctness with concurrency, efficiency with architecture, security alone, and repo rules with simplicity. Put the mechanical sweep on `haiku`.

That threshold is the whole rule on a plain run. **Under `--adversarial` a pass owns this step instead** — see `orchestration.md`. Work the step here only on the `orchestrated` fallback in that file. On that fallback the threshold no longer applies: run every lens in a subagent at any diff size, in the four groups above. The prompts carry pointers and the acceptance criteria only. They carry nothing this session remembers and nothing a briefing gave it.

Give each subagent the scope of the diff, its lenses, and the rule files behind them. Set the model explicitly on every `Agent` call.

This session keeps the verification and the final judgment. Under `--adversarial` one limit applies. Drop a candidate here only when its citation is factually wrong. Never drop a candidate on a judgment that the code handles the case. Send every such judgment to two adjudicators that you spawn separately, per `orchestration.md`. Report every drop with the route that dropped it.

Cross-repo consistency is a lens of its own. Verify every ERC, every field name, every endpoint path, and every payload shape the diff touches against the other repository, per that lens in `criteria.md`.

## Step 4: Blast Radius

The diff starts this step. The diff does not bound it. Work the Regression risk lens in `criteria.md` as a pass of its own. The subject of that lens is the code the diff never touched. A review that works the lens while it reads the diff has already skipped it.

**Run this step on every review, at any diff size.** The size threshold in Step 3 governs how you split the *lens* work, and it does not apply here. A change of one line to a shared method reaches more call sites than a change of two hundred lines to a file nothing imports. The size of the diff therefore predicts nothing about the size of this step.

1. **Build the symbol list.** Derive the list from the text of the diff, not from the stated purpose of the change. Read the added lines and the removed lines, and take every identifier they declare, rename, or delete. Take every string literal that carries a contract: an ERC, an endpoint path, a list-type value, a config key, an environment variable, a column in the local store. That one pass also yields the signatures, the exported components and hooks, the service methods, the payload shapes, and the shared types. Then drop each symbol only one file uses, and **name every drop and its reason in the report**. Build the list mechanically. The alternative is to remember which symbols mattered, and memory returns the symbols this diff edited rather than the symbols other code references.

1. **Find every reference.** Grep each symbol across `<TARGET>` and across the other repository, per the Lanes table. Search the identifier form and the string form both, because ERCs, endpoint paths, and dynamic keys never appear as identifiers. This step is search alone, so fan it out. Give one `haiku` subagent each group of symbols. Send the calls in a single message, so the subagents run at the same time. Each subagent returns `file:line` references and nothing more. Do not ask a subagent whether a call site is broken. This session keeps that judgment.

1. **Read the call sites and judge them.** Judge each site against the new behavior, not the old one. Keep the list in `criteria.md` at hand, which orders the cases from hardest to easiest: a behavior change behind an unchanged signature, reordered parameters whose types still match, a return value that is now nullable, a `catch` in a caller that no longer matches the thrown type. When the reference count is too high to read every site in this session, group the references by calling module. Give each group to a `sonnet` subagent, with the old behavior, the new behavior, and one bounded deliverable. Verify what the subagent returns before it becomes a finding. Under `--adversarial` a pass owns this step. On the `orchestrated` fallback in that file, where this session works the step, delegate the call-site reading whenever the reference count is above zero. A contaminated session says "that caller is fine" from its memory of what the change intended. Record an empty search as a count of zero, and do not ask a reader to confirm that nothing exists.

1. **Report the coverage.** Name the symbols you traced, the reference count for each one, and the call sites you read. Report this even when you found nothing. Also name each symbol you dropped as private to one file, and the reason you dropped it. A reader cannot tell a trace you did not report from a trace that never ran. A reader cannot tell a drop you did not report from a symbol nobody listed.

Set the model explicitly on every `Agent` call. When the session cannot spawn subagents, trace the symbols in this session and say so. Never skip this step because a fan-out is unavailable.

## Step 5: Automated Code Review

Workspace lane: run the automated pass as `criteria.md` describes it. Pass the `--fix`, `--comment`, and `--effort` flags through to `/code-review`. Under `--read-only`, pass `--effort` alone.

Scripts lane: skip this step, per the Lanes table.

## Output

Write one consolidated report, with the severity tags and the finding format from `criteria.md`. Omit Mechanical when the sweep found nothing. State every other section in both states, and include the one-line PASS from Format, because that line reports coverage like any other line. A reader cannot tell a missing section from a step that never ran.

**Four sections belong to `--adversarial` alone**, and a plain run omits all four: Independence, Passes, Dropped candidates, and Completeness pass. They report on work a plain run does not do.

Under `--adversarial` each pass writes a report in this shape, and the reader receives the combination of those reports, per Combining the Passes in `orchestration.md`. This session adds the Independence, Passes, and Dropped candidates sections, because no single pass can know them. This session changes nothing else a pass wrote, except to merge duplicate findings and to set the severity. On a plain run, omit those three sections and write the report in this session.

```
## Independence            (--adversarial only)
SELF | BRIEFED | FRESH, and reading: fresh | orchestrated | contaminated
— never omitted under the flag. Wherever this session did the
orchestrating, the change kind and, per changed file, what was read
around it. Where passes ran, their own coverage statements are that
evidence and this session adds nothing it did not do.

## Passes                  (--adversarial only)
How many ran, and their overlap — how many findings appeared in more than
one. A single pass is stated as such, with the reason there was only one.

## Format
PASS — no changes needed
(or) Applied N changes; N lint violations remain (rule + file for each)
(or, read-only) CHECKED — N violations, nothing written (rule + file for each)

## Findings
Grouped by lens, in the criteria.md order — rule violations and verified
/code-review hits included under their lens, never in sections of their own.
Under --adversarial each finding carries its corroboration count
(2/2, 1/3 verified here, …) as provenance, never as confidence —
agreement between passes does not make a finding right.
A lens with nothing to report still gets its one-line coverage statement
here, per the Evidence rule.

## Dropped candidates      (--adversarial only)
Every candidate not promoted to a finding, each tagged `fact` (with the
file:line read showing the citation was wrong) or `adjudicated` (with both
rejections), plus any severity down-rated the same way. "None" is itself
the datum, in every state.

## Completeness pass       (--adversarial only)
What the fresh completeness reader named against the combined report, and
what came of each. Stated even when it named nothing. Owed wherever
subagents could be spawned at all.

## Blast radius
Each traced symbol, its reference count, and what was read, plus each
symbol dropped as file-private and why. Stated even when it found
nothing; findings themselves go under Regression risk above.

## Mechanical
Identifier typos, string typos, then whitespace grouped by type

## Verdict
APPROVED | CHANGES_REQUESTED — one line of reasoning
```

When `--fix` ran, name the fixes the run applied automatically and the fixes that need a person.

## Record the Verdict

Write a receipt, so that `/one-pr` can tell whether a reviewer reviewed this branch, and at which commit:

```bash
T=<TARGET>
RECEIPTS="$(git -C "${T}" rev-parse --path-format=absolute --git-common-dir)/one-review/receipts"

mkdir -p "${RECEIPTS}"

{
	echo "verdict: <APPROVED|CHANGES_REQUESTED>"
	echo "commit: $(git -C "${T}" rev-parse HEAD)"
	echo "branch: $(git -C "${T}" rev-parse --abbrev-ref HEAD)"
	echo "lane: <workspace|scripts>"
	echo "mode: <standard|adversarial>"
	echo "independence: <SELF|BRIEFED|FRESH>"   # --adversarial only; omit otherwise
	echo "reading: <fresh|orchestrated|contaminated>"   # --adversarial only
	echo "tree: $([ -z "$(git -C "${T}" status --porcelain)" ] && echo clean || echo dirty)"
	echo "reviewed: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
} > "${RECEIPTS}/$(git -C "${T}" rev-parse HEAD)"
```

The `--path-format=absolute` option is necessary. `--git-common-dir` alone returns a path relative to the repository. A bare `$(git rev-parse --git-common-dir)` therefore resolves against whichever directory the shell sits in. It writes the receipt into the wrong tree, or into no repository at all.

The receipt lives inside the git directory. Git never tracks it, it never reaches the diff of a pull request, and it needs no `.gitignore` entry. Use `--git-common-dir` rather than `--git-dir`. `--git-dir` returns one directory per worktree. A review that ran in a worktree then stays invisible when the pull request goes out from the main checkout. Every worktree of the repository shares the common directory, and the name of each receipt is a commit SHA, so two receipts never collide.

Name the receipt after the reviewed commit. A receipt is evidence about that commit and about no later commit. Record `tree: dirty` when the review covered staged or uncommitted work. A review of a working tree is not a review of the commit that follows it, and `/one-pr` is right to ask again.

Always record `mode`. Write `independence` and `reading` under `--adversarial` only. A receipt without those two fields means a standard run. It does not mean a missing field. Under the flag, read the two fields as a pair. `independence` names the session that answered for the branch. `reading` names where the work that produced the findings happened. Neither field tells a later reader anything on its own. `SELF` with `reading: fresh` is a delegated review, and it is worth as much as a fresh one. `SELF` with `reading: contaminated` is the weakest record this file carries, and the word `SELF` alone covers both cases. Neither field fails `/one-pr`, which shows them rather than blocking on them.

Skip this section under `--read-only`, which writes no receipt. The caller owns the record there. For the `one-team` reviewer that record is `review.md`.

## Step 6: Learn

Skip this step under `--read-only`. The step writes rule files and memory, and a review whose findings are not yet adjudicated holds nothing settled to harvest. Whoever owns the change runs the step once the findings settle.

Otherwise invoke the `one-review-learn` skill, and encode the results into the rule files for the lane, per the Lanes table. The skill harvests correction patterns from three sources in this session: the uncommitted changes, the recent commits, and the comments on the pull request. It encodes them as durable guardrails, so the same issues do not recur.