---

allowed-tools: [Agent, AskUserQuestion, Bash, Edit, Glob, Grep, Read, SendMessage, Skill, TaskCreate, TaskGet, TaskList, TaskUpdate, Write]
description: Use when a Jira ticket should be taken from design through implementation, end-to-end testing, and final review by a coordinated agent team (planner, developer, tester, reviewer) in one session — either Liferay One workspace development or Liferay One migration script development in the scripts repo. Invoke as /one-team <TICKET> plus any extra context or constraints.
name: one-team

---

# One Team

This skill runs a team of 4 agents: a planner, a developer, a tester, and a reviewer. The team takes a Jira ticket from the first reading of the context to reviewed code, committed on a branch that the ticket names.

The session that invokes this skill is the **coordinator**. The coordinator starts each teammate, passes every handoff between them, enforces the gate at the end of each phase, settles a disagreement, and writes the team log. The coordinator does not plan, write, test, or review. The specialists do that work.

The team writes into **one target repository for each run**. That repository is this workspace or the Liferay One `scripts` repository. The team reads every other checkout as context.

The directory that you invoke the skill from sets the repository that the team writes in. That choice changes 6 commands. The phases, the roles, and the gates are the same in both repositories.

Run the skill from the root of the target repository. A session that starts in another directory may not list `/one-team` by name. Read this file and follow it. Everything else works the same way.

## Invocation

```
/one-team LPD-12345 [--lane workspace|scripts] [extra context, constraints, links]
```

The skill needs a ticket ID. Ask for one before you do anything else when the invocation gives none.

The `--lane` flag overrides the lane. The working directory sets the lane, so a run rarely needs this flag.

Every other word after the ticket ID is context for the start of the run. Copy those words into the briefing for the planner. Remove the `--lane` flag first.

## Lanes

There are 2 lanes and 1 protocol. This table holds every difference between the lanes. The rest of this file and every charter apply to both lanes.

| | Workspace lane | Scripts lane |
| --- | --- | --- |
| Delivers | client extensions, objects, site content — the Liferay One product | `one/` ETL and migration scripts that load data into it |
| Not covered | anything outside `client-extensions/` | the repo's `partner/` and `customer/` Python areas — same phases, but the planner reads neighbouring scripts for convention and records the missing rule file as a risk |
| Target repo `<TARGET>` | `<WORKSPACE>` — the checkout itself | `<SCRIPTS>/.claude/worktrees/<TICKET>` — a per-ticket worktree |
| Isolation | none by default; the run works in the checkout, so **one workspace-lane run at a time** — a second one is offered an opt-in per-ticket worktree instead of being refused (see Concurrency) | a per-ticket worktree, so any number of runs proceed in parallel |
| Base ref `<BASE>` | `liferay-one/master-temp` | `liferay-one/main` |
| Rules the reviewer enforces | every file in `<TARGET>/.agents/rules/` | every file in `<TARGET>/.agents/rules/`, plus `<WORKSPACE>/.agents/rules/data-access.md` — the lane table in `one-review/criteria.md` is authoritative |
| Pattern sources | `<TARGET>/client-extensions/` | `<TARGET>/one/scripts/migration/`, `one/services/`, `one/core/`, `one/utils/` |
| Build gate | `./gradlew formatSource build` | `bunx prettier --write <touched paths>` then `bun run lint`, from `<TARGET>` — `bun run format` would reformat pre-existing drift across the whole repo and pull foreign files into the diff |
| Phase 4 proof | deploy client extensions, exercise the UI at `http://localhost:8080` | run the script against the local environment, verify the loaded data, re-run for idempotency |
| Scaffolding recipe | `<TARGET>/.agents/skills/` (`one-deploy`, `one-env-up`, `one-format`) | `<TARGET>/.agents/skills/one-new-script/SKILL.md` |
| PR recipe (Phase 6 tells the user, never runs it) | `<WORKSPACE>/.agents/skills/one-pr/SKILL.md` | `<SCRIPTS>/.agents/skills/one-pr/SKILL.md` |

**The directory of the session sets the lane.** A session inside the `scripts` checkout uses the scripts lane. A session inside `liferay-one-workspace` uses the workspace lane. This is the default, and it needs no confirmation. The session already runs in the repository that holds the work for the ticket.

There are 2 exceptions and no others:

- A `--lane` flag in the invocation sets the lane. The user gives this flag to override the default.

- A working directory outside both checkouts sets no lane. Ask the user with `AskUserQuestion`. Do not choose a lane.

The ticket does not set the lane. The ticket only checks the lane.

Read the digest. A migration ticket in a workspace-lane run belongs to the other lane. An object-model ticket in a scripts-lane run belongs to the other lane. Report this in the status at the start of the run. The user then changes the lane before Phase 1.

Do not change the lane because of the ticket. The user chose the directory. A change of target sends the developer to the wrong repository, and the user sees no message about it.

A ticket that needs both repositories needs **2 runs**. Deliver the half that belongs to the target repository. Record the other half in `team-log.md` as work that the team owes. Report it to the user in Phase 6. The user then files or schedules the second ticket. One repository for each run is a rule with no exception.

## The Team

| Role | Model | Charter |
| --- | --- | --- |
| Planner | `fable` | `<WORKSPACE>/.agents/skills/one-team/roles/planner.md` |
| Developer | `opus` | `<WORKSPACE>/.agents/skills/one-team/roles/developer.md` |
| Tester | `sonnet` | `<WORKSPACE>/.agents/skills/one-team/roles/tester.md` |
| Reviewer | `fable` | `<WORKSPACE>/.agents/skills/one-team/roles/reviewer.md` |

The 4 charters apply to both lanes. They live only in the workspace, and both lanes read the same 4 files.

The charter of the reviewer holds the role and the protocol. It does not hold the substance of the review. That substance lives in `<WORKSPACE>/.agents/skills/one-review/criteria.md`. The interactive `/one-review` skill reads the same file, so the two cannot differ. The reviewer reads that file in place from `<WORKSPACE>` in both lanes, as it reads the rule files.

The reviewer runs `/one-review --read-only` in both lanes. The flag keeps every check, and the format check runs through the check-only command of the lane. The flag writes nothing to the tree. That skill knows the lane, for the same reason the charters do, so the 2 lanes run the same review. A scripts-lane session can fail to list that skill by name. The reviewer then reads `<WORKSPACE>/.agents/skills/one-review/SKILL.md` in place and follows it, exactly as it reads `criteria.md`.

Spawn each teammate with the `Agent` tool. Set these 4 values:

- `subagent_type: "claude"`
- `run_in_background: true`
- `name`, set to the role
- `model`, taken from the table above

Never let a teammate use the model of the session. The split of the models is deliberate. The plan and the final review need the strongest reasoning, because the judgment concentrates there. The other work is more mechanical, so a cheaper model does it. When the harness does not offer `fable`, use `opus` and report that change in the kickoff status.

The tiers cascade. A subagent that a teammate spawns always runs on `haiku` or `sonnet`. Those subagents do the research sweeps, the file inventories, the log scans, and the isolated mechanical edits. The tokens of the strongest model stay with the reasoning of the teammates.

There is 1 exception. The independent review passes of the reviewer under `--adversarial` are not research subagents. Each one is a whole review that takes the place of a reading by the reviewer. `one-review` sets the tier of those passes, and everything that those passes spawn obeys the cascade.

A teammate whose runtime cannot spawn a subagent does that work itself. It does not stop for the missing capability.

**Downgrades for a small ticket.** There are 2 downgrades for work that is small. The evidence for a downgrade must exist at the moment the role spawns:

- Spawn the planner on `opus` when the kickoff context of the user calls the ticket small or trivial.
- Spawn the developer on `sonnet` when the drafted `plan.md` meets the small bar of the lane. The coordinator reads `plan.md` at that point anyway, to summarize it for the user.

The small bar differs between the lanes:

- Workspace lane: no effect on the data model, no new object, no new endpoint, and 50 changed lines or fewer.
- Scripts lane: 50 changed lines or fewer, **and** no change to a write path. A read-only export, a change to a log or to a CSV, and a narrowed filter each meet this bar.

Do not apply the bar of the workspace lane to the scripts lane. Almost every migration script has no effect on the data model and adds no object and no endpoint. That bar would therefore downgrade the developer on work whose whole risk is to write the wrong data into the product.

The review or the approval of the user can make the plan larger than these bounds. Respawn the developer on `opus` before Phase 3 and log the swap. The reviewer stays on `fable` in every case, because the reviewer is the last gate. Never trim the end-to-end pass of the tester. Log each downgrade that applies.

**Upgrade for the tester.** Spawn the tester on `opus` when Phase 4 must **construct** its fixtures instead of exercising data that already exists. Three cases need that construction:

- a scripts-lane run that needs seeded records
- an acceptance criterion whose setup covers more than 1 system
- any run in which the test data must become valid before the matrix runs

The `sonnet` default rests on Phase 4 being mechanical execution. That assumption fails here. In 1 measured run the tester repeated a wrong assumption about a fixture *after* a correction. That result shows a model at its limit, not a gap in knowledge. The Test Plan in `plan.md` states which case applies, so the coordinator can make this call when it spawns the tester in Phase 3. When the case becomes clear during the phase, respawn the tester on `opus` against `test-report.md` and log the swap.

## Cost Discipline

The token cost of a run is `turns × resident context`. It is not the size of what each agent reads. Past runs give these 3 measurements:

- Cache reads are 99.7% of the input tokens.
- The average context for each turn is 411k to 442k tokens, and the peak is near 996k.
- The **coordinator alone** used 301M to 681M cache-read tokens over 732 to 1,540 turns. That is more than any teammate used.

Every rule below reduces 1 of those 2 multipliers.

No rule trades accuracy for cost. These 4 items do not change:

- the depth of the research
- the number of the gates
- what the reviewer reads
- what the planner verifies for itself

A defect in this workflow costs more than the tokens that find it, even when the defect is the cheapest one.

- **The coordinator orchestrates and does nothing else.** The coordinator writes to these 3 places only:

  - `<TEAMDIR>`
  - its own control files, which are `run.lock` and its registry entry under `~/.claude/one-team/portal/`
  - the worktree bootstrap in Phase 0

  The coordinator uses `Bash` for these 8 purposes only:

  - the Jira fetches and the checks on the paths in Phase 0
  - `git fetch`, `git worktree add`, and `git checkout -b`
  - the bootstrap commands in Phase 0: the copy of `.env`, the clone of the store DB, and `bun install`
  - the check for drift on the branch
  - `git cherry` and `git reflog` during the resume check
  - the reads of the registry and of the generation at every gate
  - the `git log` and `git diff` verification in Phase 6
  - the read-only lookups that it needs to settle a dispute

  The bootstrap is setup. It is not a work product. It writes no file that the ticket ships, so it does not break the rule of 1 writer. The coordinator never builds, never deploys, never greps the codebase for its own answers, and never edits a file in a repository. One measured run made 389 `Bash` calls and 66 `Edit` calls from this seat, at approximately 440k context for each call. That is the most expensive habit in the workflow. It also breaks the mandate of the coordinator, because no charter governs that work and no role reviews it.

- **`PROGRESS` goes to the log only.** Append it to `team-log.md`. Include it in the next gate report. It never gets a relay turn, and it never gets its own line for the user.

- **Ten lines for each message.** A dispatch and a reply carry paths, verdicts, and decisions. They never carry the content of an artifact, and they never repeat `plan.md`. The measured average is approximately 770 tokens for each message. Completeness is more important than this budget. Write these 3 items so that the reader acts on them without a second question, at whatever length that needs:

  - the steps that reproduce a `FAIL`
  - the reasoning behind an objection in a review
  - the done-condition of a dispatch

  One complete message costs less than 3 partial messages.

- **Respawn a role that enters a later phase with a large transcript. Do not resume it.** The transcript of a teammate never becomes smaller, so a resume late in the run re-reads the whole history at every turn. An agent near the top of its context window also follows its charter worse, and that second effect is the main reason for this rule. The artifacts hold the state, which is what makes an interrupted run resumable. Apply the rule as follows:

  - Spawn a fresh role against the artifacts when the role enters a **later phase** with a transcript above 60k to 100k tokens.
  - Resume the role when its transcript is smaller, or when it continues work **inside its current phase**.

  Log each respawn with the phase that the role entered.

- **Log the number of turns for each phase** in every gate entry in `team-log.md`. The next run is then measurable, and nobody reads an old transcript to measure it.

## How Teammates Actually Work

A live test verified these mechanics. The protocol depends on them:

- A background teammate works in turns. It is not a live process. It reads the message, acts, replies, and stops. A `SendMessage` to that teammate resumes it with its full context. An idle teammate costs nothing after the spawn. The spawn itself costs a measured 30,000 to 60,000 tokens of baseline context for each agent, before any work. Spawn each role at the moment of its first real assignment.
- Each spawn sets `name` to the role, so `SendMessage` addresses a teammate by that name and the agents panel shows a readable list. Record the map from the role to the agent ID from each spawn result in the team log. A name that a later spawn reuses belongs to the newest agent, so the ID identifies the correct respawn. Never show a raw agent ID to the user. Write "the planner" or "the developer".
- A teammate replies with `SendMessage` and `to: "main"`. The reply arrives at the coordinator, and the coordinator polls no inbox. The completion notification of a teammate also carries its final text. That notification is the fallback when a teammate sends no message.
- A **background subagent** of a teammate reports its completion to the coordinator. It does not report to the teammate that spawned it. A teammate that stops to wait for its own background subagent therefore waits until the coordinator sends it a message. The charters require synchronous subagents for this reason. When the result of such a subagent arrives at the coordinator, write that result to the team directory. Then resume the teammate that owns it, and give it the path. A synchronous subagent is not a serial subagent. Independent subagents that 1 message starts run at the same time.
- **A lost wake-up stops a teammate for the rest of the run. The wake-up from a background command is best-effort, so never end a turn to wait for one.** An earlier version of this file called a background command safe, because the command re-invokes its owner. It usually does so. One measured run lost 3 wake-ups on a plain `run_in_background` Bash call, and the tester stopped each time. A wake-up that never arrives looks the same as a command that still runs, so a wait is the 1 method that cannot detect it. Use 1 of these 3 shapes, in this order of preference:

  1. Run the command in the **foreground** when it fits inside the timeout of the tool.

  1. Start the command. In the same turn, wait on a *separate* command that exits when the condition is true (`until <check>; do sleep 5; done`). The exit of that second command is the reliable signal. The exit of the first command is not.

  1. **Verify the artifact instead of the notification.** Check that the image exists, that the log line arrived, or that the process ended.

  Silence is never success. A wait must sometimes cross more than 1 turn. End the turn, tell the coordinator that you wait, and tell it what to check. The coordinator then watches you, and your phase does not stop without a report.
- A turn that outputs only `SendMessage` calls looks empty to the harness. The harness then prompts the agent again, and the agent can enter a loop. Each teammate ends every turn with a short line of plain text after its messages.
- End the turn with a status of 1 line for the user after you dispatch work. The reply of the teammate resumes the session.
- The teammates share 1 filesystem. A handoff carries **paths, not contents**. Give the path of `plan.md`, list the files that changed, and name the diff. A message that holds the body of a file costs the tokens of that file a second time.

Every spawn prompt has the same shape. It holds these 7 parts:

- the name of the role
- the ticket ID
- the lane
- the absolute path of the team directory
- the instruction to read the copy of the charter for the role in `<TEAMDIR>/roles/`, and then `paths.md`, before anything else. Give absolute paths. The teammate reads these files itself, so the coordinator never loads a charter into its own context.
- the kickoff context
- the first assignment

The first assignment is always real work. It is never an acknowledgment. A respawned role gets the same shape, plus the artifacts for the phases that it missed.

## Team Directory

Every artifact of the run lives in `<TEAMDIR>`, which is `~/.claude/one-team/<TICKET>/`. That path sits outside every checkout, for these reasons:

The team directory is the only output of the run that nobody can replace. Git holds the code. Git does not hold the plan, the handoffs, the test report, or the log.

A team directory inside the target repository is open to every other action on that repository. Three actions reach it:

- the git operations of another run
- a removal of the worktree, which deletes the directory with it
- a `git add --all`, which stages the directory

One of these 3 actions emptied the directory of a run in practice, and every written document in it was lost.

The directory must also be reachable from both lanes, from any worktree, and from a resumed session whose worktree no longer exists. No directory under the `.git` of a repository meets that condition.

A directory outside the tree also makes the append to `.git/info/exclude` at kickoff unnecessary. `git add --all` cannot stage an artifact that was never inside the repository.

`paths.md` records the resolved absolute path. Every spawn prompt carries that path, and no teammate derives it:

| File | Writer | Content |
| --- | --- | --- |
| `team-log.md` | coordinator | the lane, the roster, the outcome of each phase gate with its turn count, the agreements, the arbitrations, the escalations, and the respawns |
| `paths.md` | coordinator | the lane, `<TARGET>`, `<BASE>`, and the resolved absolute path of each context repository. Every teammate reads this file directly after its charter |
| `ticket-digest.md`, `initiative-digest.md` | coordinator | the Jira context that the teammates read: the flattened ticket, and 1 line for each issue in the initiative |
| `ticket.json`, `initiative.json` | coordinator | the raw Jira responses. Use them for a targeted `jq` lookup only. Never read a whole file |
| `roles/` | coordinator | the copies of the charters, made at kickoff. Every spawn prompt gives these paths. The ticket branch can be older than the skill |
| `plan.md` | planner | the implementation plan. The charter of the planner holds the template |
| `dev-handoff.md` | developer | the Phase 3 handoff: the changes, 1 verification hint for the tester for each acceptance criterion, and the notes |
| `test-report.md` | tester | the matrix of the acceptance criteria, the regression matrix, the evidence, and the verdict for each round |
| `review.md` | reviewer | the findings with a severity, and the verdict for each round |

The coordinator creates the directory and `team-log.md` at kickoff, and it appends a log entry at every gate. The artifacts stay after a session ends. An interrupted run resumes from them, and a respawned teammate reads them for its briefing. They sit outside the checkouts, so they survive these 3 events:

- a removal of the worktree
- a branch that never merges
- any cleanup of the repository

A resume therefore never depends on the tree.

Two control files coordinate the runs against each other, so they are not artifacts of any single run:

- `~/.claude/one-team/<TICKET>/run.lock` holds the claim of this run on its ticket.
- Every file under `~/.claude/one-team/portal/` forms the portal registry for the machine.

Concurrency specifies both.

## Jira Context

Jira is read-only here. Never transition a ticket from this workflow. Never post a comment from this workflow.

`reference/jira.md` holds the recipes. It covers these 4 items:

- the fetch of the ticket, and the validation of it
- the fetch of the initiative, with its pagination loop
- the issue graph of the ticket
- the digest commands that make the initiative and the graph readable

Read that file once in Phase 0. Work from the digests after that.

## Resolving the Repos

The coordinator resolves every checkout once, at kickoff, and writes the results to `paths.md`. Each teammate uses those absolute paths and derives no path again. A relative path fails as soon as a subagent runs from a different directory.

| Variable | How to resolve it |
| --- | --- |
| `<TEAMDIR>` | the artifact directory of this run, `~/.claude/one-team/<TICKET>/`, written as an absolute path. Write no `~` in `paths.md`, because the shell of a teammate can leave it unexpanded |
| `<CHECKOUT>` | the **main** checkout of the target repository, which is the directory that the run starts from. In the workspace lane, `<TARGET>` and `<CHECKOUT>` are the same path. In every other lane, `<TARGET>` is a worktree of `<CHECKOUT>`, so the 2 paths differ. Record both |
| `<WORKSPACE>` | the Liferay One workspace — `<PORTAL>/workspaces/liferay-one-workspace` |
| `<PORTAL>` | the `liferay-portal` checkout, at `<WORKSPACE>/../..`. From the scripts lane, it is the sibling checkout that contains `workspaces/liferay-one-workspace`, usually `../liferay-portal` |
| `<SCRIPTS>` | the `liferay-one/scripts` checkout, a sibling of `<PORTAL>`, usually `<PORTAL>/../scripts`. Confirm it with `git remote -v`, which must name `liferay-one/scripts` |
| `<LEGACY_OSB>` | `<PORTAL>/../liferay-portal-7.2.x/modules/dxp/apps/osb/`. That checkout is on the branch `7.2.x-temp` |
| `<LEGACY_CUSTOMER>` | `<PORTAL>/../liferay-portal-7.0.x/modules/dxp/apps/osb/osb-customer/` |
| `<LEGACY_KORONEIKI>`, `<LEGACY_PROVISIONING>` | `<PORTAL>/../lfris-koroneiki`, `<PORTAL>/../lfris-provisioning` |
| `<LEGACY_SUPPORT>`, `<LEGACY_MARKETPLACE>` | `<PORTAL>/workspaces/liferay-customer-workspace`, `<PORTAL>/workspaces/liferay-marketplace-workspace` |

Test each path before you record it, and mark each path that does not exist as absent. A teammate that reads "absent" records the gap in its plan or in its report. A teammate that reads a path that does not work invents the history instead.

The planner and the reviewer own 2 questions: which source answers which question, and which contract each lane owes the other lane. The research order in the charter of the planner and the file `one-review/criteria.md` are the authority for them. The coordinator resolves the paths only.

## Concurrency

More than 1 run can be active on this machine at the same time. The common case is 1 workspace-lane run plus 1 or more runs in other repositories. Files cause no conflict once each non-workspace run has its own worktree and every run keeps its artifacts outside the checkouts. **The 1 local Liferay instance stays shared, and no run can duplicate it.** The runs therefore coordinate on the portal instead of taking turns at it. Almost all work runs in parallel. Only the operations that disrupt another run run one at a time.

Six parts of a run touch the portal never and coordinate never:

- Jira and kickoff
- the planning
- the review of the plan
- the implementation by the developer
- the final review
- the commit

This section binds 2 parts of the run:

- **Phase 4**
- the **prep of the tester**, which overlaps Phase 3. The prep starts the environment, and it can reach the bootstrap branch of env-up.

The `buildDockerImage` warm-up of the developer in Phase 3 builds an image and restarts no container, which is why it needs no coordination.

**A run that is alone on the machine pays nothing for this section. This section changes neither the invocation of one-team nor the actions of the user.** `/one-team <TICKET>` does not change. When the registry holds no other run, these 4 statements hold:

- No other run holds the lock, so the first attempt acquires it.
- The drain waits for nobody.
- A quiet window costs nothing.
- No tier makes a difference, because the write to the registry is 1 small file.

The cost appears only when another run exists, and that is the case which used to corrupt both runs with no report. A solo run that becomes slower or harder under this section shows a defect in this section. It is not a cost of concurrency.

**The coordination state lives at `~/.claude/one-team/portal/`.** That path is global to the machine on purpose. The portal is `localhost`, and every lane shares it, so its coordination state cannot live under the `.git` of 1 repository. A lock inside 1 repository lets a workspace-lane run and a scripts-lane run each pass its own check and then collide.

| Path | Owner | Contents |
| --- | --- | --- |
| `runs/<TICKET>.json` | coordinator | the ticket, the lane, the session, the PID, the current phase, `activity` (`idle` or `active`) with a timestamp, and the claim of the run on its data scope. The coordinator writes it at kickoff, refreshes it at each gate, and deletes it at Phase 6 or when the run stops |
| `ops.lock` | whoever holds it | a directory. `mkdir` creates it, so the creation is atomic. It holds `ticket`, `operation`, `PID`, and `acquired-at`. Hold it for 1 operation. Never hold it for a phase or for a run |
| `generation` | last disruptor | **exactly 1 line, which holds 1 integer and nothing else.** The initial value is `0`. To raise it, overwrite the file with the new number. Never append to this file |
| `generation.log` | last disruptor | the history, which only grows. It holds 1 line for each disruptive operation: `<n> <ticket> <operation> <timestamp>`. Append here. Never append to `generation` |

### Three Tiers of Portal Work

| Tier | What it is | Coordination |
| --- | --- | --- |
| **A — free** | an authenticated read and a UI read at `8080`; a read of an object definition from the files, not from the portal; a read with `docker compose logs`; a migration write or a fixture write that stays inside the records of the run; the `buildDockerImage` warm-up of the developer, which builds an image and restarts no container; `docker compose up --detach` when the containers already run; a hot-deploy of `liferay-one-custom-element` or of `liferay-one-global-css` | It acquires nothing. It still waits for a lock that another run holds |
| **B — quiet window** | the idempotency row, the data-integrity row, and every first-run measurement and global count. The portal accepts concurrent writes. The *verdict* does not, because each of these compares a state before an action with the state after it | Take `ops.lock` for the group of rows, with the intent `quiet-verification`. Do not raise `generation`, because nothing permanent changed |
| **C — disruptive** | `docker compose up --detach --force-recreate liferay-one-etc-spring-boot`, which is mandatory after any change to Spring Boot: it restarts the container, it fails every `58081` call in flight, and it then serves the new code; a hot-deploy of `liferay-one-batch`, `liferay-one-site-initializer` or `liferay-one-instance-settings`, which restarts no container but changes the schema, the objects or the site that every other run verifies against; `/one-site-reset`; `/one-instance-reset`, which removes all records and all structure and restarts no container, and which is the second most destructive operation here; `/one-env-reset`, which wipes the volume and deletes the `local-dev` OAuth2 application with it; the first-run bootstrap branch of `one-env-up`; the re-creation of the OAuth application | Take `ops.lock`, drain the other runs, then raise `generation` |

Apply this rule to any operation that the table does not name:

- The operation restarts a container, redeploys an extension, or deletes and reseeds data → Tier C.
- The operation needs every other run to write nothing → Tier B.
- Every other operation → Tier A.

**A Tier A write during the lock of another run corrupts the verdict of that run. Two rules read as a contradiction here, so read both.** Tier A acquires no lock of its own. Tier A still yields to a lock that another run holds. "No coordination" means that you never acquire a lock. It does not mean that you may write while another run holds one. A lock for a Tier B quiet window exists to stop every other write. A Tier A write during that window corrupts the idempotency verdict or the integrity verdict of that run. In 1 measured exercise a Tier A write that followed the table landed approximately 2 seconds after the quiet window of another run closed. That margin of 2 seconds is the only reason it did not corrupt the verdict. The agent read the word "none" in the tier table as permission to write during the hold. The rule is therefore: acquire the lock for Tier B and for Tier C, and yield to a lock in all 3 tiers.

**The exact procedure to raise the generation.** Hold `ops.lock`, then run these 3 steps in order:

1. Read the integer from `generation`.

1. Overwrite `generation` with that number plus 1.

1. Append 1 line to `generation.log`.

Two reasons make this procedure exact. First, the step reads a value, changes it, and writes it back. Without the lock it fails: a measurement of 8 concurrent raises without a lock recorded 1 raise. Second, 2 files keep the counter machine-readable. Three agents once had to infer the layout from 1 file that a description called "a counter plus a log line". Two of them appended their event into `generation` itself, and 1 used a separate log. `generation` then read `1` after 3 operations. A staleness check reports "nothing changed" after 3 redeploys in that state.

**A deploy from another run that follows this protocol replaces your deploy, and no message reports it.** When a Tier C deploy lands after yours, the portal serves the build of that run. Neither run made an error. This is expected contention, not a failure, and it is never a reason to reset the environment. It does change when you confirm the deployed build: confirm it for each **unit** of portal work, not once for each phase. Verify that the portal serves your build immediately before each unit. Run your own deploy again, under the same lock and drain, when it does not.

### Acquiring, Draining, Releasing

The registry must exist before any read of it and before any lock on it. Phase 0 creates it. Never assume that it exists. **Create the directory first. Then loop. Then cap the loop.**

```
P=~/.claude/one-team/portal
mkdir -p "$P/runs"                       # never assume; harmless when present
[ -f "$P/generation" ] || echo 0 > "$P/generation"      # one integer, nothing else
[ -f "$P/generation.log" ] || : > "$P/generation.log"   # the append-only history
i=0; until mkdir "$P/ops.lock" 2>/dev/null; do
    i=$((i+1)); [ $i -gt 120 ] && { echo "ops.lock held too long"; break; }
    sleep 5
done
```

Both halves of this block matter. `mkdir` fails **in the same way** when another run holds the lock and when the parent directory does not exist. `2>/dev/null` then removes that difference. Without `mkdir -p`, the first run that attempts a redeploy on a new machine waits forever on a lock that no run holds. A test produced that failure. Without the cap, a stale lock from a crashed holder stops the next run in the same silent way.

The loop can reach the cap. Never delete the lock of another run at that point. Read the PID of the holder. Reclaim the lock only when that process is dead. Escalate to the user in every other case.

For Tier C, **drain** after you take the lock. Wait until every other registered run reads `activity: idle`. Poll the registry with the same capped loop. Cap that wait at approximately 10 minutes, and escalate to the user at the cap. Never force the operation, because a run that stays active needs a person, not a deadline. Then run these 4 steps in order:

1. Run the operation.

1. Verify the health of the environment with the checks in the recipe of that operation.

1. Raise the generation with the procedure above.

1. Release the lock. Remove the lock directory.

Every tester checks for a held `ops.lock` **before each unit of portal work**. A unit is 1 script run or 1 group of matrix rows. The tester waits instead of starting the unit. Between 2 units the tester sets its `activity` flag to `idle`. A unit of that size lets a waiting Tier C operation drain in minutes, instead of waiting for a whole matrix.

**A run that waits on the lock while its flag still reads `active` waits for a drain that its own flag blocks. That is the 1 deadlock these 2 rules can create. Set the flag to `idle` *before* you start to wait, never after.**

**The operation behind a dead lock can be half complete, so a reclaim needs 5 steps.** The next waiter reclaims a lock whose PID is dead. That waiter then does this:

1. Log the reclaim.

1. Run the health checks of the recipe: `http://localhost:8080/c/portal/status`, and `58081/ready` where it applies.

1. Run the day-to-day env-up when the environment is not healthy. That command is idempotent and safe.

1. Append a `reclaimed` generation line, so every run knows that an operation can be partly applied.

1. Continue, or escalate to the user.

Any coordinator removes a stale registry entry with a dead PID at kickoff, and logs the removal.

**The 3 resets also need the approval of the user whenever the registry holds another run.** Exclusive access is not enough for them. What they destroy stays destroyed after the lock is released, so a drain protects no other run. A tester that judges a reset to be the only way forward reports `BLOCKED` with its reasoning, and the coordinator then asks the user.

### What Sharing One Portal Costs, Stated Plainly

One instance can never give concurrent runs these 2 things, and the protocol states both:

- **Write scopes that overlap.** An object ERC is unique across the instance. An upsert from 1 run can therefore change the record that another run asserts against, and neither run touches a shared file. Each run declares a data scope at the Phase 1 gate, in the Data Scope line of the planner. The scope states what the run writes and what its assertions read. The coordinator copies that scope into the registry. It compares the scope against the claim of every other live run, in both directions. A deployed extension counts as a write, and a called endpoint counts as a write.

  - The 2 scopes are disjoint → both Phase 4 runs proceed at the same time.
  - The 2 scopes overlap → the coordinator asks the user to order the 2 Phase 4 runs, or logs the overlap as an accepted risk. The Phase 6 report then names that risk.

  Three pairs can never overlap:

  - 2 runs that write the same object
  - any run that asserts a global count or a first-run measurement, paired with any other run
  - 2 workspace-lane runs

  **The comparison at Phase 1 is not sufficient on its own, because the runs do not start together.** A ticket that registers after your gate passes creates an overlap that no check at Phase 1 can see. One measured run compared the scopes and found the 1 other run disjoint. It then found a third run with an identical write scope during its own matrix. Run the comparison at these 3 moments:

  - at your own Phase 1 gate
  - each time the coordinator reads the registry for any other reason, which it does at every gate and before every Tier C operation
  - once more, before the coordinator accepts the Phase 5 verdict

  Handle a new overlap exactly as an overlap at Phase 1: order the runs with the user, or log the accepted risk. A new overlap also reopens Phase 4 for every row that was measured against the contended scope.
- **A private stream of logs.** `docker compose logs liferay` covers the whole instance, so a new `ERROR` line can belong to another registered run. The log rule in the charter of the tester states that limit instead of hiding it:

  - An error that belongs to the operation of the row still fails that row.
  - An error that belongs to no identified operation is recorded, with the name of the other run, and cross-checked. It does not fail the row by itself.

  A row that needs the stricter rule takes a Tier B quiet window, which also gives it a private window of logs.

A fixture ERC carries the ticket ID, in the form `<TICKET>-FIXTURE-*`. Two fixtures then never collide, and the cleanup can target the fixtures of 1 run.

**This is a limit of capacity, not of correctness.** Each run costs 1 coordinator, 4 teammates, and their subagents. More runs at the same time therefore meet the session limit more often. The Circuit Breakers already handle that kill. Nothing in the structure changes. Expect the kill sooner with 3 runs than with 1 run.

## Phase Protocol

There are 7 phases. Each phase has an owner, an exit gate, and an entry in `team-log.md`. A gate cannot pass before the log holds the entry for the previous gate. Verdicts and confirmations keep their order even where the work overlaps. The protocol allows these 2 overlaps:

- the prep of the tester during Phase 3
- the early pass of the reviewer during Phase 4

A gate rests on evidence. It is not permanent. Three kinds of later evidence cancel a logged gate:

- a regression that appears after `APPROVED`
- a retest that fails
- a Tier C operation from another run that lands after this run measures its result

The coordinator then reopens the run at the earliest affected phase, logs the reason, and runs the standard loops again. Phase 6 never proceeds over a gate that the coordinator knows to be stale.

A run cannot observe the third case directly, so the protocol detects it instead. Every Phase 4 verdict records the `generation` at which the tester measured it. The coordinator reads the counter again before it accepts the Phase 5 verdict, and once more at Phase 6.

Mirror the phases on the shared task board at kickoff. Create 1 task for each phase, and chain them with `addBlockedBy`. Advance the status of each task as its gate passes. The coordinator owns the board. The teammates report through messages.

**A `git` command that runs in the wrong repository writes to the wrong repository, and every sibling checkout is also a git repository.** Run every `git` command in every phase in `<TARGET>`. A teammate that runs a command from the default directory of a subagent can reach another repository.

Verify the branch before you log any gate and before you dispatch any phase assignment. `git -C <TARGET> branch --show-current` must print `<TICKET>`. On any other value, run these 3 steps in order:

1. Stop the team with HOLD messages.

1. Read the reflog to find what happened.

1. Escalate to the user before anything else runs.

A worktree lane rarely meets this problem. The worktree belongs to 1 ticket, and git does not check that branch out in a second place. Run the check in that lane too. It costs nothing, and the workspace lane needs it. That lane works directly in a checkout, and the user or another session can move that checkout during the run.

### Phase 0 — Kickoff (Coordinator)

1. Read the lane from the working directory, as Lanes describes, and verify that this directory is the root of `<CHECKOUT>`. Then resolve every path and write `paths.md`. That file holds the lane, `<CHECKOUT>`, `<TEAMDIR>`, `<BASE>`, and each variable from Resolving the Repos, marked present or absent. Record `<TARGET>` once it exists. In the workspace lane it is the same path as `<CHECKOUT>`. In every other lane it is the worktree path that the fetch and branch step below creates.

1. Claim the ticket before you change anything. Run these 4 steps in order:

    1. Create `<TEAMDIR>`.

    1. Run `mkdir -p ~/.claude/one-team/portal/runs`.

    1. Set `generation` to `0` when that file does not exist.

    1. Write `~/.claude/one-team/<TICKET>/run.lock` with the ticket, the PID, and the start time of this session.

    The registry must exist at this point. Every later read of a lock or of the generation then finds its parent directory. A `run.lock` whose **PID is alive** means that another session already runs this ticket. Stop, and tell the user which session holds it. Do not put a second coordinator on 1 team directory. A `run.lock` whose **PID is dead** is a crashed predecessor, not a conflict. Reclaim it, record the reclaim in `team-log.md`, and continue to the resume check below. That check reads the artifacts that the crashed run left.

1. Run the resume check before you judge the state of the tree. When `<TEAMDIR>/team-log.md` exists, follow Resuming an Interrupted Run instead of this section. The staged, uncommitted work of a resumed run is its saved state. It is not a dirty tree.

    A branch named `<TICKET>` with no team log is a leftover, not a resume. Handle it in 1 of these 2 ways:

    - `git cherry <BASE> <TICKET>` shows that the work is already upstream. This is the usual case for a follow-up on a completed ticket. Rename the branch with `git branch -m <TICKET> <TICKET>-pre-one-team`, and continue.
    - The branch holds unique commits that are not upstream. Stop, and ask the user which base to build on.

1. Register the run in the portal registry, and check which other runs are live, as Concurrency describes. Remove every entry whose PID is dead, and write 1 log line for each removal. A registered run in another lane is expected and correct. Name those runs in the kickoff status, so the user knows which runs share the portal with this one.

    One case needs the user rather than a rule: another **live workspace-lane run**. That lane works directly in the checkout, so 2 runs would share 1 working tree. Report the holder to the user, and offer these 2 real options:

    - Wait for the other run to finish.
    - Run this ticket in its own workspace worktree. That worktree costs 1.7 GB to 3 GB, and it is the only way to run the 2 tickets at the same time.

    The user decides. Log the choice. Never refuse without a message.

1. Fresh runs only: `git -C <CHECKOUT> status --porcelain` must print nothing. Stop and ask the user when the tree is dirty. A worktree lane checks `<CHECKOUT>` here, because the worktree does not exist yet. From Phase 3 onward, the tree that matters is `<TARGET>`.

1. Write `team-log.md` into `<TEAMDIR>` with the ticket, the lane, the date, the checklist of the phases, and a placeholder for the roster. Copy the 4 charter files from `<WORKSPACE>/.agents/skills/one-team/roles/` into `<TEAMDIR>/roles/`. Every spawn prompt gives the path of these copies, in every lane.

1. Fetch the Jira context, as `reference/jira.md` describes. Digest it. Validate it.

1. Fetch and branch, in `<CHECKOUT>`. Run `git fetch liferay-one master-temp` in the workspace lane. Run `git fetch liferay-one main` in the scripts lane. Then create the tree that the run works in:

    - **Workspace lane:** `git checkout -b <TICKET> <BASE>`. `<TARGET>` is `<CHECKOUT>`.
    - **Every other lane:** run `git worktree add .claude/worktrees/<TICKET> -b <TICKET> <BASE>`, and record that path as `<TARGET>` in `paths.md`. Nothing after this step changes, because every teammate already runs `git -C <TARGET>` with absolute paths. Reuse the worktree when it already exists on the correct branch. Git refuses to check 1 branch out twice, which catches a collision on the same ticket that `run.lock` should catch first.

1. Bootstrap a fresh worktree, so the tester can run in it. A new worktree holds none of the working state that `.gitignore` covers. In the scripts lane, run these 4 steps in order:

    1. Copy `<CHECKOUT>/one/.env` to `<TARGET>/one/.env`.

    1. Run `mkdir -p <TARGET>/one/db <TARGET>/one/output`. `.gitignore` covers both directories, so a fresh worktree has neither, and `cp` fails into a directory that does not exist.

    1. Clone the local stores with `cp -c <CHECKOUT>/one/db/*.db <TARGET>/one/db/`. APFS clones on write, so a populated store costs no space and no wait. The run gets a private copy that no other run contends for.

    1. Run `bun install` in `<TARGET>/one`.

    Skip each step whose source file is absent, and report that skip in the kickoff status. An absent `.env` makes the tester report `BLOCKED`. Never invent a value for it. The workspace lane skips this step, because it works in the checkout, and the checkout already holds this state.

1. Create the phase tasks on the task board.

1. Spawn the planner. Its first assignment is Phase 1. Log the roster, and add each other role to the roster as it spawns.

### Phase 1 — Plan (Planner)

Brief the planner with the paths of the digests, the kickoff context of the user, and the assignment. The assignment is to produce `plan.md`, as its charter describes.

The planner researches the ticket to the depth that the ticket needs. It sends its mechanical sweeps to cheap subagents in 1 message, instead of taking 1 turn for each sweep. The planner **asks instead of guessing**. A `QUESTION` message arrives at the coordinator. The coordinator answers it from the established context of the run, or puts the question to the user with `AskUserQuestion`. It then relays the answer word for word. Questions in 1 batch cost 1 round trip. Questions sent one at a time cost 1 round trip each.

Exit gate: `plan.md` exists, and the planner reports `DONE`. At this gate the coordinator also copies the **Data Scope** line of the plan into the registry entry of the run. It compares that line against the claim of every other live run, as Concurrency describes. This gate is the first point at which the claim exists. It is also the last point before Phase 4 at which ordering 2 runs is still cheap. Report a conflict to the user at this gate. Do not find it during the matrix.

### Phase 2 — Plan Review (Developer) and the Human Gate, Concurrently

Dispatch both reads at the same time.

Spawn the developer, and make this review its first assignment. The developer reads `plan.md` critically before any code exists. It checks these 5 properties:

- the feasibility
- the missing steps
- the conformance to the patterns
- the testability
- the scope

In the same turn, post the compact summary of the plan to the user in the chat. That summary holds the goal, the approach, the files, the test plan, and the open risks. Give the path of `plan.md`. Ask the user to approve the plan or to request changes.

**Phase 3 starts only after both the agreement between the developer and the planner and the approval of the user arrive.**

Relay each objection of the developer to the planner, which revises the plan. Loop until **both roles agree in writing**. When they still disagree after 1 rebuttal round from each role, take both positions to the user. Do not force an agreement. When a revision arrives while the user still reads the summary, tell the user what changed. An approval that the user gave on the old text is re-confirmed against a delta of 1 line. Log the outcome and each accepted risk.

### Phase 3 — Implement (Developer)

Dispatch 2 assignments at the moment the plan gate closes:

- The developer implements `plan.md` under the rules of its charter.
- The tester runs its prep in parallel. Spawn the tester now, and make the prep its first assignment. The Prep section of its charter holds the procedure, and no step in it needs the diff.

These 3 rules apply while the phase runs:

- The developer is the **only writer** of the files of the repository, and it writes only inside `<TARGET>`. The planner, the tester, the reviewer, and the coordinator never edit those files. No role writes anything in any other checkout. The artifacts in `<TEAMDIR>` are the 1 exception, and each role maintains its own artifacts, as the artifact table states.
- Report each deviation from the plan to the coordinator. A material change to the design goes back to the planner for agreement before the work continues. The coordinator respawns the planner against the artifacts when Phase 2 ended many turns earlier. The planner stays the only writer of `plan.md`, because that file is the design of record. A developer that edits it grades its own deviation.
- The work is done when these 3 conditions hold:

  - The build gate of the lane passes.
  - Unit tests exist where the target repository already has a pattern for them.
  - `git add --all` stages everything.

  Make no commit.

Exit gate: the developer writes `dev-handoff.md` and reports `DONE` with its path. That file holds these 4 items:

- the files that changed
- a summary of the changes
- 1 verification hint for each acceptance criterion, mapped to a test scenario in the plan
- the notes

### Phase 4 — Deploy and Test (Tester)

The tester already ran its prep. Brief it with `dev-handoff.md` and with the Test Plan of the plan. The tester proves the staged work through the running system, as its charter describes. It then searches for **regressions**. It exercises every flow and every script that uses code that the developer changed. It watches the logs for a new error throughout that work. The Phase 4 row of the Lanes table names the proof for the lane. The charter of the tester holds the procedure.

A `FAIL` goes back to the developer with the steps that reproduce it. The developer fixes the defect under the rules of Phase 3. The tester deploys again, tests the failed cases again, and tests everything that the fix can affect. Loop until the full matrix passes on the build that the portal now serves.

Exit gate: `test-report.md` is complete, and the developer and the tester both confirm in writing that the work meets the acceptance criteria with no regression. Log that joint agreement. Log the `generation` at which the tester measured the matrix. The report carries that number too, as the charter of the tester requires. A verdict with no recorded generation cannot be checked for staleness later, and step 4 of Phase 6 therefore blocks it.

### Phase 5 — Final Review (Reviewer)

Spawn the reviewer, unless the early pass below already spawned it. Brief it with the plan, the test report, and the scope of the diff. That scope is `git diff <BASE>`. The work is staged, so this command shows every change, and it includes the new files.

**Decide at this point whether this ticket qualifies for `--adversarial`**, and tell the reviewer the decision. Exactly 2 triggers qualify, and nothing else does:

- The diff changes a **write path in the scripts lane**, which covers a migration that loads or changes data. `criteria.md` already makes a defect in idempotency a blocker, and a run that writes the wrong data costs a lot to undo.
- The diff changes a **contract that another repository consumes**. That covers an ERC, the name of a field, the path of an endpoint, and the shape of a payload.

With neither trigger present, every round is a standard round. With either trigger present, the reviewer still runs standard rounds, and it escalates only on the round that it would otherwise approve. Its charter describes that escalation. The flag on every round costs its price once for each round, and it buys the least on the rounds that end in `CHANGES_REQUESTED`. Those rounds catch defects that the next round also catches. The round that produces `APPROVED` is the round on which a missed defect ships.

Log the decision in `team-log.md`. On an escalated round, brief the reviewer with the scope from `git diff <BASE> --name-only`, not with the content of the diff. Under the flag the reviewer reads no diff itself, and a coordinator that hands over the content removes the independent reading before any pass exists. Send those artifacts and nothing more. Never send these 3 items:

- an account of how the developer reached the change
- a summary of what somebody already checked
- a statement that a shape of the code is deliberate

The coordinator watched the work as it was built. Every sentence of that history that it forwards is a judgment that the reviewer no longer derives for itself. The reviewer works read-only, as its charter requires.

The coordinator may start the passes of the reviewer during Phase 4 for a small diff, which is a diff under 200 changed lines. Hold the verdict until the `PASS` from the tester arrives. A `FAIL` that changes the diff cancels those passes. The reviewer issues a finding only against the final diff that the tester passed.

The coordinator can ask for `--adversarial`, and the reviewer can then report that it could not spawn subagents. It worked the lenses inline instead of through fresh readers. That review is degraded, not failed. An `APPROVED` from it still passes the gate. Log the degradation in `team-log.md` as an accepted risk. Name it in the Phase 6 report, so the user decides whether a separate fresh review runs before `/one-pr`. A loss of independence that nobody reports is the 1 defect that this protocol ships with no warning.

A `CHANGES_REQUESTED` starts this loop:

1. The developer fixes the findings under the rules of Phase 3.

1. The **tester tests the fixes again, and tests everything that the fixes can affect**, under the rules of Phase 4. A `PASS` on those rows is enough in these rounds, and the run does not repeat the full joint confirmation.

1. The reviewer reviews the delta only.

Every finding ends with a decision: the developer fixes it, or the developer rejects it with a reason that the reviewer accepts. Loop until the reviewer reports `APPROVED`.

Exit gate: the log holds the `APPROVED` of the reviewer, and the generation check passes. Before it accepts the verdict, the coordinator reads `~/.claude/one-team/portal/generation` again and compares that number with the number that Phase 4 recorded. An unchanged number passes with a log line. A number that changed only through events that do not affect this run also passes with a log line. An event is **relevant** when it is 1 of these 3:

- a recreate of Spring Boot, when the work of this run reaches that extension. The `SPRING_BOOT_URL` test in the charter of the tester draws the same line.
- a deploy of batch or of the site initializer that changes an object inside the data scope of this run
- any reset. A reset is relevant to every run.

A relevant event after a logged `PASS` reopens Phase 4 for the affected rows.

### Phase 6 — Ship (Developer Commits, Everyone Signs)

1. The developer runs the build gate of the lane a final time. That run must produce no diff. When it changes a file, stage the change again and return to Phase 5 for a delta re-review before the run continues.

1. The developer composes the commits. Keep them few and organized. One commit is the default. Split the work into more commits only when that makes the history clearer for the person who reviews it. One example is regenerated output, which goes in a commit apart from the hand-written code.

    Every message reads `<TICKET> <concise summary>`. Use sentence case. Write no period at the end. Keep the line under 72 characters.

    Run plain `git commit` under the git identity of the user. **Never** add Claude as an author or as a co-author. Write no `Co-Authored-By` trailer. Write no attribution to a tool anywhere.

1. The coordinator verifies these 3 mechanical properties:

    - `git log <BASE>..HEAD --format='%an %s'` shows the user as the author and the ticket prefix on every commit.
    - `git diff <BASE> --name-only` shows only files inside the scope of this ticket, and every one of them is inside `<TARGET>`.
    - The working tree is clean.

1. The coordinator runs the generation check one last time, exactly as in Phase 5. **Ship never proceeds over a generation that the gate has not read.** A relevant event that landed after the review reopens Phase 4 for the affected rows, however late it arrives. This step is the last point at which the run catches a redeploy or a reset from a concurrent run. After this step, the run presents the work as verified.

1. The reviewer takes one last look at the structure of the commits. It checks the quality of each message, the organization of the commits, and the absence of a stray file. The author and the prefix are mechanical, and step 3 already checked them. Whether a message describes the outcome rather than the code is a judgment, which is why it stays with the reviewer. A problem that the reviewer names here follows the usual adjudication loop:

    1. The developer amends the commits. It runs a soft reset and commits again when the structure or the messages are wrong.

    1. The coordinator runs its step 3 checks again.

    1. The reviewer looks again.

1. Release what this run holds. Delete `runs/<TICKET>.json` from the registry, and remove `run.lock`. A later session on this ticket then makes a clean resume instead of a blocked one. `<TEAMDIR>` stays, because it is the record.

    **A removal of the worktree destroys the staged, uncommitted work of the run and leaves the branch reference, which still looks intact. That work is the resume state of the run, so the worktree stays too.** Remove a worktree only after its ticket ships or the user abandons it. Give the user the path of the worktree in the report, and let the user decide when it goes.

1. **Do not push. Do not open a PR.** The user can order either one directly, and you then log that order as an override. Report these 8 items to the user:

    - the lane and the target repository
    - what the run built
    - where the plan, the test report, and the review live
    - the list of the commits
    - the name of the branch
    - the path of the worktree, when the lane uses one
    - any work in the other repository that the run recorded as owed
    - that `/one-pr` for this lane is the next step, once the user is satisfied

    In the workspace lane, warn the user that `liferay-one/master-temp` rewrites its history often. A branch that stays unmerged then shows "conflicts" on its PR, even when nothing changed its files. A rebase onto the current tip and a force-push with a lease fix that in seconds. A merge soon after the review prevents it.

## Communication Rules

- These 5 kinds of message go through the coordinator and into `team-log.md` at the moment they happen:

  - a handoff
  - a verdict
  - a gate
  - an escalation
  - a disagreement

  Never write them into the log later. A question between 2 teammates that only asks for clarification goes directly to the other role. Address that role by its name, which is a verified mechanic. The teammate that asked includes the exchange in its next report to the coordinator. Any message about the scope, the design, a verdict, or a gate goes back to the coordinator.
- Every reply from a teammate starts with 1 status word, and the payload follows it. The 8 status words are `DONE`, `PASS`, `FAIL`, `BLOCKED`, `PROGRESS`, `QUESTION`, `APPROVED`, and `CHANGES_REQUESTED`. Each charter names the words that its role uses. `PROGRESS` does not end a phase, and it goes to the log only. It reports a milestone, and the coordinator records it with no relay turn and no reply.
- The user has more authority than this protocol. An instruction from the user during the run can override a rule. Three examples are to ship before the review, to push, and to skip a phase. Follow that instruction, and log it as an override by the user. Never resist it, and never apply it without a log entry. Record the work that it displaces, such as a deferred final review, in the log as still owed.
- Every dispatch names the phase, the assignment, the paths of the artifacts, and the done-condition. Send all of that in 1 complete message. Each extra round trip processes the whole transcript of that teammate again, so 1 complete dispatch costs less than 3 partial dispatches. A dispatch often passes the budget of 10 lines for this reason, and that is correct. The budget applies most strictly to a reply and to a relay, where extra length usually repeats something.
- **Watch a silent teammate. Do not wait for it.** Probe a teammate that is working rarely. Probe a teammate that may be stuck at once. Check any teammate that waits on a long command, and any teammate that is silent after the time its work needs. Check it by looking at the system:

  - Is the process alive?
  - Did the artifact appear?
  - What do the logs report?

  Do not wait for a notification, because the notification may never arrive. A probe costs 1 round trip. A phase that stops costs the run.
- Each side of a disagreement gets 1 rebuttal round. The coordinator then decides a dispute about the execution, and it logs its reasoning. The approach of a fix, the severity of a finding, and the scope of a retest are 3 disputes of that kind. These 3 disputes go to the user instead, with a summary of both positions:

  - a dispute about the content of the plan
  - a dispute about the scope or the meaning of the ticket
  - any dispute that would overturn a plan that the user approved
- Nothing ships without an examination:

  - The developer reviews the plan.
  - The tester and the reviewer review the code.
  - The reviewer reads the test report.
  - The developer adjudicates every finding of the review.
  - The coordinator and the reviewer check the commits.

  At least 1 other teammate analyzes every artifact. This rule has no exception.

## Circuit Breakers

- Three rounds between the developer and the tester with no drop in the number of failures, or 6 rounds in total at any rate of progress → stop. Summarize both positions with the evidence, and escalate to the user.
- Three review rounds without `APPROVED` → same.
- Any `BLOCKED` reply that the coordinator cannot clear itself, or 3 failed attempts at 1 gate → same. Three examples of a failed gate are a build that never passes, an environment that never starts, and absent credentials.
- Write the count of the rounds and the count of the turns for each phase into the gate entries in `team-log.md` as they happen. A resumed run then inherits the counts of its breakers instead of starting them at 0.
- A teammate reported that it waits on a long command → **watch it from the start.** Do not wait for its next message. Check the system itself at an interval that matches the duration of the command. Check the process, the artifact, and the log. A wake-up can be lost, and nothing reports that loss. Probe the teammate at the moment the command has plainly finished and the teammate has sent no report. Do not wait after that point. An earlier version of this rule made the coordinator observe the finish before it probed. A coordinator that waits rather than looks never observes that finish.
- A teammate stops replying, or the quality of its replies drops → probe it once. A transient API error or a session-limit error kills a teammate, and that teammate resumes from its transcript with full context once the capacity returns. Prefer that resume when the teammate is inside a phase. In every other case, spawn a fresh teammate on the same charter and give it the paths of the artifacts. Note the swap in the log.
- A remote write that a teammate starts, such as a push, a force-push, or a deletion of a branch → refuse it. A fetch is routine. The coordinator runs a push that the user orders, and logs it as an override.

## Resuming an Interrupted Run

The artifacts and the branch hold the state. The transcript of a teammate does not survive a restart of the session. Run these 5 steps when `/one-team <TICKET>` finds `<TEAMDIR>/team-log.md`:

1. Take `run.lock` first, exactly as a fresh run does.

1. Register the run in the portal registry again. A resumed run shares the portal like every other run, and a coordinator may have swept its old registry entry as stale.

1. Read the lane and the resolved paths from `paths.md`. Do not derive them again. Verify that each path still exists, and rewrite the file when a checkout moved.

1. Restore the tree in 1 of these 3 ways:

    - Check out the existing branch.
    - In a worktree lane, add the worktree again from the branch that survived, with `git worktree add .claude/worktrees/<TICKET> <TICKET>`. Then run the Phase 0 bootstrap again.
    - Create the branch as Phase 0 describes, when only the team directory survived.

1. Read the log, find the last recorded gate, and carry on from there. Spawn a fresh teammate at the moment each remaining phase needs it, and brief it from the artifacts.

Do not redo a gate that already passed. Trust the log over your memory. A branch with no team log is not a resume. Handle it per Phase 0 step 3.

**A removed worktree took the staged, uncommitted diff with it, and the log cannot record that for you. The branch reference survives and looks complete.** The last gate in the log can imply staged work while the restored tree holds none. The run then resumes at the start of the phase that produced that work, not after it. Write that fact in the log and in the next status. A run that continues with no such note presents unwritten work as done.

Check every Phase 4 verdict in the log against the current `generation` before you trust it, as Concurrency describes. An interrupted run is exactly the case in which other runs kept working.

## Hard Rules

- The coordinator orchestrates. It never produces a work product itself, and its tool use stays inside the bounds in Cost Discipline.
- One repository for each run: the whole team writes only inside `<TARGET>`. Every other checkout is read-only context, which covers the workspace from the scripts lane, the scripts repository from the workspace lane, and every legacy source. Record the work that the other repository needs as owed. Never do that work here.
- One writer: only the developer edits a file of the repository, and only in Phases 3 to 6. Every other role writes only inside `<TEAMDIR>` — its own artifacts, plus the relayed results that the coordinator persists there. There are exactly 2 exceptions:

  - the worktree bootstrap of the coordinator in Phase 0, which writes only working state that `.gitignore` covers, and never a file that the ticket ships
  - the change that the tester makes to `<TARGET>/one/.env`, which `.gitignore` covers, to point it at the local environment

- A run touches nothing that belongs to another run. It touches neither the team directory, nor the worktree, nor the registry entry, nor a lock that it does not hold. The portal is the 1 shared resource, and the procedure in Concurrency is the only approved way to affect it while other runs are live.
- The planner and the reviewer run on `fable`. The developer runs on `opus`. The tester runs on `sonnet`. The 2 downgrades that the small-ticket rule allows are the only exceptions, and each one needs its evidence. Every subagent of a teammate runs on `haiku` or on `sonnet`. The `--adversarial` review passes of the reviewer are the only exception there, and `one-review` sets their tier.
- Make no commit before Phase 6. Make no push, unless the user orders one directly, and log that order as an override. Never record Claude as an author.
- No phase advances until `team-log.md` holds its gate.
- Jira is read-only.
- Never write to a production system. Never test with a production credential. Every write lands in the local environment, with a local or a dev value for each integration. The extraction sources of a migration are the 1 read-only exception. A read against a production source still needs the direct approval of the user. Log that approval as an override, and bound the read.
- Never commit `.env`, a credential, or exported data. This includes the extract files and the local stores that a scripts-lane run produces. See `<SCRIPTS>/.agents/rules/sensitive-data.md`.
- A raw agent ID never appears in text for the user.

## Quick Reference

| Phase | Owner | Exit gate | Artifact |
| --- | --- | --- | --- |
| 0 Kickoff | coordinator | the run holds `run.lock`; the registry holds the run; the lane, the paths, the tree, the context and the roster are ready; the worktree is bootstrapped where the lane uses one | `team-log.md`, `paths.md` |
| 1 Plan | planner | the plan exists; the run claims its data scope and compares it against every live run | `plan.md` |
| 2 Plan review | developer + user, concurrent | the planner and the developer agree, and the user approves | log entry |
| 3 Implement | developer | the build passes, the work is staged, the handoff exists | staged diff + `dev-handoff.md` |
| 4 Deploy and test | tester | the full matrix passes at a recorded `generation`, and the developer and the tester agree | `test-report.md` |
| 5 Final review | reviewer | `APPROVED`, and every finding is adjudicated | `review.md` |
| 6 Ship | developer | the commits are verified, the tree is clean, the user is briefed | commits on `<TICKET>` |