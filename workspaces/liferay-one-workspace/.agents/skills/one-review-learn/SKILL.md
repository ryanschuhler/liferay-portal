---

allowed-tools: [Agent, Bash, Edit, Glob, Grep, Read, Write]
description: After a review session (AI or human), extract correction patterns and encode them as workspace rules, ESLint checks, or memory to prevent recurrence.
name: one-review-learn

---

# Review Learn

Harvest the correction patterns from a review session. Encode them as durable guardrails, so the same issue does not recur.

## When to Run

Run after any of these:
- A reviewer on GitHub leaves inline comments and you answer them
- `/code-review` or `/code-review --fix` applies a correction to the branch
- You see the same kind of fix in more than one file

## Model Tiering

No part of this work needs the model of the session. The collection is mechanical, so run it in this session or on a `haiku` subagent. Run the analysis and the guardrail writing on `sonnet` subagents, and set the model explicitly on every `Agent` call. Only the final choice of where to encode each pattern stays in the session.

## Signal Sources

Collect from every available source. Skip a source that does not apply.

### 1. GitHub PR Review Comments

```bash
# Resolve the PR for the current branch
PR=$(gh pr view --json number -q .number 2>/dev/null)

# Inline comments (each has path, line, body)
gh api "repos/liferay-one/liferay-portal/pulls/${PR}/comments" --paginate \
  --jq '.[] | {path: .path, line: .original_line, body: .body, resolved: .resolved}'

# Review-level summaries
gh api "repos/liferay-one/liferay-portal/pulls/${PR}/reviews" --paginate \
  --jq '.[] | {state: .state, body: .body}'
```

When no PR exists for the current branch, skip this source.

### 2. Recent Post-Review Commits

Read the commit log since the branch diverged. A commit with a short message (SF, cleanup, fixup, update, fix) that follows the first feature work is a correction signal.

```bash
git log --oneline "$(git merge-base HEAD liferay-one/master-temp)...HEAD"
git show --stat <short-sha>   # for any suspect commit
```

### 3. Current Uncommitted Changes

```bash
git diff HEAD         # unstaged
git diff --cached     # staged
```

These are the newest corrections. The current review session produced them directly.

## Analysis

Use a `sonnet` agent to read every collected signal and to produce a list of correction patterns. Capture four things for each pattern:

- **What changed** — a concrete before/after example
- **Why it was wrong** — the rule the code violates
- **How general it is** — does it apply to the whole codebase, or to this one file?
- **Category** — one of: `naming`, `structure`, `style`, `pr-hygiene`, `object-naming`, `logic`, `concurrency`, `data-access`, `other`

Group the related comments and diffs that point to one root issue into a single pattern. Five "sort this" comments from one reviewer are one pattern, not five.

## Guardrail Selection

For each pattern, pick the option with the strongest enforcement that fits:

| Pattern type | Detectable in TS/TSX AST? | Where to encode |
| --- | --- | --- |
| Naming — file, class, function | Yes (filename, export name) | A new ESLint rule in `tools/eslint-plugin-local/src/rules/` |
| Naming — variable, prop | Sometimes | An ESLint rule where a rule can detect it, otherwise `.agents/rules/naming.md` |
| File/folder structure | Yes (path patterns) | An ESLint rule in `tools/eslint-plugin-local/src/rules/` |
| Sort order in TS/TSX | Yes | An ESLint rule |
| CSS/SCSS conventions | No | `.agents/rules/code-style.md` |
| Import conventions | Yes | An ESLint rule. Check the `@liferay/eslint-plugin` configuration first |
| PR hygiene | No | `.agents/rules/pr-hygiene.md` |
| Object ERCs / field names | No | `.agents/rules/object-naming.md` |
| Shared mutable state, effect races | No | `.agents/rules/concurrency.md` |
| N+1 calls, unbounded or over-wide reads | No | `.agents/rules/data-access.md` |
| General code style | No | `.agents/rules/code-style.md` |
| Non-obvious project context | No | Memory (`~/.claude/projects/.../memory/`) |
| A defect class a reviewer should hunt for | No | `.agents/skills/one-review/criteria.md`, under the lens it belongs to, or as a false positive to exclude |
| Workflow/procedure | No | A skill update |

**Before you encode anything**, check whether an existing rule covers the pattern. Run these commands from the workspace root (`workspaces/liferay-one-workspace`).

```bash
# Rules docs
grep -ri "<keyword>" .agents/rules/

# Review criteria
grep -i "<keyword>" .agents/skills/one-review/criteria.md

# Existing ESLint rules
ls tools/eslint-plugin-local/src/rules/
```

Skip a pattern that an existing rule covers completely. Sharpen a rule that covers the pattern in part.

## Applying Guardrails

### Rule Doc Update

Append the pattern to the most relevant `.agents/rules/<file>.md`. Match the style of the existing content: a table row for a naming rule, a fenced code example for a before and after pair, and prose for the rationale.

When no existing file fits, create a new file under `.agents/rules/`. Then name the updated file in the output, so the user can review it.

### Review Criteria Update

The rule files and the review criteria answer different questions, and one harvested pattern often belongs in both. A rule file states what correct code looks like, for whoever writes it. `.agents/skills/one-review/criteria.md` states how to *find* the incorrect code in a diff: which lens covers it, what to grep for, and how heavily to weight it.

Add a pattern to `criteria.md` where a reviewer would otherwise miss it, and add it under an existing lens rather than under a new one. Where the harvest instead shows that a reviewer reported something that was never wrong, add that to the Known False Positives section of the same file. A retracted finding is as much a signal as an accepted one. Both `/one-review` and the `one-team` reviewer read that file, so one edit reaches every review at once. Never encode a review heuristic in a caller.

### New ESLint Rule

Follow these steps when a rule can detect the pattern mechanically in a TypeScript or TSX file:

1. **Read an existing rule as a template.** Start with `tools/eslint-plugin-local/src/rules/filenameCamelcase.ts` for a simple rule, or with `tools/eslint-plugin-local/src/rules/pageFolderStructure.ts` for a rule that reads the path.

1. **Write the rule** to `tools/eslint-plugin-local/src/rules/<camelCaseName>.ts`. Use `@typescript-eslint/experimental-utils`. Always export the rule with `export =`. Copy the SPDX header from the existing rules.

1. **Register it** in `tools/eslint-plugin-local/src/index.ts`:
   - Add `import <camelCaseName> = require('./rules/<camelCaseName>');`
   - Add `'<kebab-case-name>': <camelCaseName>` to `rules`
   - Add `'local/<kebab-case-name>': 'error'` (or `'warn'`) to `configs.recommended.rules`

1. **Build and verify:**

   From the workspace root:

   ```bash
   yarn build:plugin && yarn install --check-files
   yarn lint 2>&1 | grep -E "local/<kebab-case-name>|<RuleName>" | head -20
   ```

   The rule reports every file that matches the pattern and reports nothing on a clean file. When it reports a file it should not, tighten the condition. When it reports nothing on a known violation, widen the condition.

1. **Fix every existing violation** in the codebase before you commit. Otherwise set the rule to `'warn'` for now, and record the reason in a TODO comment inside the rule file.

### Memory Entry

Write a memory entry when a correction reveals something about the project that is not obvious and that Claude needs across sessions: an unexpected constraint, a name that causes a failure, or an unusual step in a workflow.

Follow the format of the memory system. Write a file under the memory directory of the session (`~/.claude/projects/<slugified-repo-path>/memory/`), with the correct frontmatter (`type: feedback` or `type: project`). Then add a one-line pointer to `MEMORY.md`.

### Skill Update

A correction can reveal a gap in the procedure of an existing skill: a missing precondition, a wrong command, or an omitted step. Append to the relevant section of the `SKILL.md` of that skill, or correct that section. Keep the change small. Add only what was missing.

## Output

Report what you did, grouped by the type of guardrail:

```
## Patterns Found

1. <Pattern name>
   - Before: ...
   - After: ...
   - Encoded as: ESLint rule `local/css-filename-upper-camel-case` (tools/eslint-plugin-local/src/rules/cssFilenameUpperCamelCase.ts)

2. <Pattern name>
   - ...
   - Encoded as: `.agents/rules/naming.md` (appended)

## Skipped

- <Pattern>: already covered by `.agents/rules/code-style.md` line 42
```

Keep the report short. Sometimes no pattern is actionable, because every correction was specific to one piece of logic or behavior. Say so plainly. Do not write a rule that does not fit.
