# The Agentic Workspace — Outline

Deep Dive, 40 minutes: 35 minutes of talk and 5 minutes of Q&A.

**Thesis:** AI alone makes you fast. The harness is what makes you good and cheap too.

**Frame:** Agent = Model + Harness, and Harness = Tools + Context + Sandbox + Guardrails. The model is rented. The harness is the part you build, and the body of the talk is one part of the harness at a time.

**Positioning:** Alejandro Tardin shows MCP creating content ("Stop Clicking, Start Prompting", Tue 3 Nov, 11:55, Main Stage). Victor Ware shows skills creating code ("Building With Autonomous Agents in Workspace", Wed 4 Nov, 14:40, Track A). This talk, Wed 4 Nov, 11:35, Track B, is the harness around both: what makes an agent's output trustworthy and shippable. "They showed you the engine. I'll show you the track, the brakes, and the pit crew."

| # | Section | Minutes |
| --- | --- | --- |
| 0 | Opener | 5 |
| 1 | Tools | 3 |
| 2 | Context | 6 |
| 3 | Sandbox | 6 |
| 4 | Guardrails, with Human in the Loop and the demo | 10 |
| 5 | Metrics | 3 |
| 6 | Takeaways | 2 |
| | Q&A | 5 |

## 0. Opener (5 min)

- Who I am and what Liferay One is: the internal product that runs the marketplace, projects, licensing, and support, built on Liferay with client extensions only.
- **Three talks, one system.** Three speaker cards in schedule order, with this talk marked "You are here". One line on each of the other two talks, and where this one fits.
- **Fast, Cheap, Good: pick two.** The claim that agents change the rule, and what each corner means here.
- **Seven phases, three stages.** All seven SDLC phases, then one click groups them: Discover (planning, analysis, design), Development (implementation, testing), Delivery (deployment, maintenance). "Discover what to build. Develop it. Deliver it and keep it running."
- **The agentic SDLC: deliverables become inputs.** A traditional deliverable is read once by a person. An agentic artifact is read every run by an agent, and checked.

| Phase | Traditional Deliverable | Agentic Artifact |
| --- | --- | --- |
| Planning | Requirements document | Jira ticket and an approved agent plan |
| Analysis | Requirements specification | `specs/business` with requirement IDs |
| Design | Architecture specification | `specs/technical` and path scoped rules |
| Implementation | Code commits | Commits made through skills, code and tests apart |
| Testing | Test reports | Test plan rows tied to requirement IDs, checked by `plan:check` |
| Deployment | Release report | Declarative client extensions, PR and Jira updated by `/one-pr` |
| Maintenance | Performance report | Rules and memory written by `one-review-learn` |

- **Agent = Model + Harness.** The model reasons and writes code; it is rented, everyone gets the same one, and it changes every few months. The harness is owned, built from your codebase and your reviews, and it compounds with every rule. "Everyone has the same model. The harness is the part you build."
- **Four parts of the harness.** The map for the rest of the talk:

| Part | Concretely | In Our Workspace |
| --- | --- | --- |
| Tools | Tools, skills, MCP servers, and their descriptions; orchestration: subagents, handoffs, model routing | 46 skills, the Liferay MCP server, headless APIs, `/one-team` |
| Context | System prompts, rules, specs, memory | `AGENTS.md`, 20 rules, 822 requirement IDs, review lessons |
| Sandbox | Bundled infrastructure: filesystem, sandbox, browser | A worktree and a Liferay instance per ticket, Playwright |
| Guardrails | Hooks and middleware for deterministic steps, permissions, approvals, monitoring | Lint, tests, Workspace Health, human approval |

- **Ten layers, four parts.** Balaji Bal's ten harness layers (April 2026) all land in the four parts, with nothing left over. Tools: interface and ingress, orchestration and control loop, model abstraction, tool execution, extension surface. Context: session and state, context and memory. Sandbox: environment and runtime. Guardrails: safety and governance, observability and evaluation. Cite the article on the slide.

## 1. Tools (3 min)

- **Skills are tools with instructions.** 46 skills, the Liferay MCP server, the headless APIs, and the Spring Boot sidecar. A raw API gives the agent a capability. A skill adds the procedure and the failure modes, for example `/one-deploy` and `deploy-and-verify`. The description matters as much as the tool: the agent reads it to decide when to use the skill. When an agent keeps getting a step wrong, turn the step into a script: the reprovision cycle became a script because agents kept waiting on a counter that had already moved.
- **Orchestration is a tool too.** The tool that uses the other tools.
	- **Subagents:** `/one-team` runs a planner, developer, tester, and reviewer. The coordinator never writes code, and the reviewer is read only.
	- **Handoffs:** written files (`plan.md`, `dev-handoff.md`, `review.md`), not a conversation, so each agent starts small and a human can read what was passed.
	- **Model routing:** `one-review-learn` collects on a small model, analyzes on a medium one, and keeps the decision on the large one.

## 2. Context (6 min)

- **Rules: what the agent knows.** 20 rules, 9 of them scoped by path so they load only for the code they govern. 72 commits to the agent docs since May. A rule is a fact, a skill is a procedure: the skills are tools, the rules are context.
- **Context rots, in two places.** More context is not better context: the right context, at the right time, still true.
	- **In the window:** rules load only for the code they govern, skills load on demand by description, subagents do the reading and hand back the answer, and `/one-review` records whether the reviewer was fresh, briefed, or the author, because a reviewer that watched the code get built finds less.
	- **In the repository:** rules carry the version they were verified on, the code wins when prose disagrees, and `plan:check` and `viz:check` fail on drift.
- **Intent is context.** 822 requirement IDs across the business and technical specs. `yarn plan:check` fails when code exists that the test plan does not cover, or a test cites no requirement. Without intent, an agent builds the wrong thing very well.
- **Writing for agents is writing for humans.** Simplified Technical English, no code comments, evidence in the doc ("verified on 2026.Q2", the source class named).
- **Knowledge silos go away** (talking point, no slide). Rules and memory are written knowledge that every agent and every new hire reads. `initial-setup-guide` serves a new person and an agent alike.
- **Every review comment becomes a guardrail** (slide title). A reviewer comments once, and `one-review-learn` turns the comment into a rule, a lint check, or a memory. This is the bridge into Guardrails.

## 3. Sandbox (6 min)

- **Declarative means disposable.** The site initializer and the batch client extension are the source of truth. Any sandbox can be deleted and rebuilt from the tree, so being wrong costs minutes.
- **Low code is agent code.** Objects, picklists, pages, and permissions are JSON. Liferay's low code investment turned out to be its agent investment.
- **A worktree per ticket.** Two agents in one checkout overwrite each other; a worktree isolates the files, shares the git history, and is ready in seconds. `/one-worktree LPD-12345` creates the worktree, its terminal workspace, and its Liferay instance; `/start-my-tickets` does it for every ticket in parallel; `/review-my-prs` rebases each PR into its own worktree. Rules it taught us: commit early, and never use a bare `git stash`, because every worktree shares it. A second worktree costs one database schema and one sidecar, not a second 10 GB stack.
- **One sandbox per agent.** A git worktree and a database partitioned virtual instance (about 8 minutes, seeded) per ticket. Parallel agents need parallel sandboxes.

## 4. Guardrails (10 min)

Permissions, policies, approvals, and monitoring.

- **Policy: a doc says "please," a lint rule says "no."** 10 custom ESLint rules, `ls-lint`, and 50 numbered style rules for the whole repository. When a convention matters, move it from a doc to a lint rule.
- **Behavior: tests at every tier.** 246 Vitest, 234 JUnit, and 32 Playwright files. Tests go in their own commit, and `one-test-add` picks the tier.
- **Monitoring: the harness reports on itself.** Workspace Health is one page built from the source by `yarn viz` (`tools/visuals`, 9 extractors), with a tab for each layer. Every problem becomes an action, and the Overview shows a triage queue of actions that no ticket tracks. `yarn viz:check` fails on drift, and `yarn viz:diff` marks the actions a branch adds and resolves. `/one-viz` republishes it to the same link, next to the Go-Live Tasks and Entitlement Coverage Map reports.
	- Show a screenshot or a short clip. Keep the link private: it shows where the audit found exploitable defects.
- **Approvals: human in the loop.**
	- **Where the humans are.** The SDLC table with a human checkpoint column: humans own intent and merge, the harness owns the middle.
	- **The ladder.** Each step up trades a human checkpoint for a harness check. Do not climb until the harness holds the weight: prompt, skill, composed skill, team, fan out, loops and scheduled agents.
	- **What humans still own:** intent, judgment, and the harness itself. `/plan-my-tickets` stops for approval, `/one-team` has phase gates, the reviewer agent is read only, and the coordinator never writes code.
	- **The leverage changed.** A human comment used to fix one PR. Now it becomes a rule that every agent follows.
	- Tension worth naming: in October, 44% of deliveries were self merged. When does the human step out of the loop, and is that fine?
- **Demo.** To be decided.

## 5. Metrics (3 min, being reworked)

Reference material from the previous version, from GitHub PR data (a PR counts as shipped when its commits landed upstream; forward PRs are excluded):

- Shipped PRs per week: 4–9 (Jan–Apr) → 14–21 (May–Sep 2026), with the same 9–12 authors.
- Shipped PRs per author per month: about 3 (2025) → 6–10 (May–Sep 2026).
- Median PR lead time with a human reviewer: 24–49 h → 3.7 h in September. p75: about 120 h → 23 h.
- Human review comments per PR fell about 85%. Pair it with the change failure rate.
- Caveat: the review gate moved in-team in May, so part of the drop is process. Do not headline October.
- Possible: open Workspace Health actions over time, cost per merged PR.

Scar candidates, each with the guardrail it produced:

- Another session's loop reverted uncommitted work.
- The formatter checked zero files and passed.
- ESLint ignored rule edits until the copied `file:` dependency was rebuilt; the build became a `prelint` step.
- Deleting batch owned objects triggered a re-import of everything.
- The sidecar lost its CORS patch on recreate; the JWKS startup race.

## 6. Takeaways (2 min)

Four principles:

1. Turn deliverables into inputs that an agent reads and the harness checks.
1. Turn every review comment into a rule, a lint check, or a test.
1. Give every agent its own sandbox, so being wrong is cheap.
1. Measure it, including the cost.

A starter kit for Monday (not on a slide yet):

1. Write one `AGENTS.md`.
1. Turn one review comment into a lint rule.
1. Make one sandbox you can rebuild with one command.
1. Wrap your deploy in one skill.

Close on "Building Liferay with Liferay" (not on a slide yet): the gotchas we hit are product feedback, and `commit-skill` sends our skills back to the portal.

## Q&A Prep

- Does this replace developers?
- What does it cost per month?
- How do you stop rules from contradicting each other?
- What happens when the model changes?
- How much of the code do agents write?

## Open Items

- [ ] Rework the Metrics section.
- [ ] Choose the demo.
- [ ] Measure the change failure rate (needs Jira credentials, or reverts and hotfixes from git).
- [ ] Measure cost per merged PR.
- [ ] Find a real PR for the review comment story.
- [ ] Confirm when the team adopted agents, since git has no record of it.
- [ ] Coordinate with Alejandro and Victor on overlap.
- [ ] Confirm the session times and rooms the week before (the agenda is preliminary).
- [ ] Resolve the [CHECK] notes in the slides:
	- How much of the code agents write (title slide).
	- The Liferay MCP claim (Tools).
	- The `/one-team` phase order and file names (Orchestration).
	- Only 9 of 20 rules are path scoped (Context Rots): scope more, or soften the wording.
	- The worktree scar story and the personal slash commands (A Worktree per Ticket).
	- What runs Workspace Health automatically, and how often.
	- Each enforcement bullet on What Humans Still Own.
- [x] Pull lead time and review rounds from GitHub.
