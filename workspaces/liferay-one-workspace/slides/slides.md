---
theme: default
title: The Agentic Workspace
info: |
  DevCon 2026 Deep Dive (40 min). Ryan Schuhler, Liferay.
layout: cover
eyebrow: DEEP DIVE
speaker: Ryan Schuhler
role: Team Lead, Liferay
canvasWidth: 1920
aspectRatio: 16/9
colorSchema: dark
fonts:
  sans: Source Sans 3
  serif: Source Sans 3
  mono: Fira Code
  weights: '300,400,600,700,900'
transition: slide-left
mdc: true
---

# The Agentic Workspace

Fast, Cheap, **and** Good

<!--
I lead the team that builds Liferay One: the internal product that runs our marketplace, projects, licensing, and support.
-->

---
layout: qr
qr: /devcon/qr-agentic-workspace.png
---

Scan to get session resources and join the discussion.

---
eyebrow: AGENTIC SDLC
---

<div class="devcon-equation">Agent = <span>Model</span> + <span>Harness</span></div>

<div class="grid grid-cols-2 gap-24 pt-8">
<div>

**Model**

- Reasons and writes the code
- Rented: everyone gets the same one
- Changes every few months

</div>
<div>

**Harness**

- Tools, skills, context, sandbox, and guardrails
- Owned: built from your codebase and your reviews
- Compounds with every rule you add

</div>
</div>

<!--
An agent is two things: a model and a harness. The model is the part you rent. Your competitor rents the same one, and next quarter there is a new one. The harness is everything around the model: the tools it calls, the context it reads, the sandbox it runs in, and the guardrails that stop it. That part is yours. You build it from your codebase and your reviews, and it gets better with every rule you add. When the model changes, you keep the harness and plug in the new model.
-->

---
eyebrow: AGENTIC SDLC
---

# Related Talks

<div class="devcon-talks">
<div class="devcon-talk">
<img class="devcon-talk__photo" src="/devcon/speakers/alejandro.png" alt="Alejandro Tardin">
<div class="devcon-talk__tag">MCP</div>
<div class="devcon-talk__title">Stop Clicking, Start Prompting: Building on Liferay with AI and MCP</div>
<div class="devcon-talk__speaker">Alejandro Tardin</div>
<div class="devcon-talk__when">Tue 3 Nov · 11:55 · Main Stage</div>
</div>
<div class="devcon-talk devcon-talk--current">
<img class="devcon-talk__photo" src="/devcon/speakers/ryan.jpeg" alt="Ryan Schuhler">
<div class="devcon-talk__tag">Harness</div>
<div class="devcon-talk__title">The Agentic Workspace</div>
<div class="devcon-talk__speaker">Ryan Schuhler</div>
<div class="devcon-talk__when">Wed 4 Nov · 11:35 · Track B</div>
<div class="devcon-talk__here">You are here</div>
</div>
<div class="devcon-talk">
<img class="devcon-talk__photo" src="/devcon/speakers/victor.jpeg" alt="Victor Ware">
<div class="devcon-talk__tag">Skills</div>
<div class="devcon-talk__title">Building With Autonomous Agents in Workspace: Context, Loops, and Validation</div>
<div class="devcon-talk__speaker">Victor Ware</div>
<div class="devcon-talk__when">Wed 4 Nov · 14:40 · Track A</div>
</div>
</div>

<!--
Three of us talk about agents on Liferay this week. Yesterday, Alejandro showed MCP: building on Liferay through conversation, with no clicks. This afternoon at 14:40 in Track A, Victor goes deep on autonomous agents in the workspace. Those two talks are the engine. This talk is the harness around it: what makes the output safe to ship. See all three and you get the whole system. [CHECK: the agenda is preliminary, so confirm the times and rooms the week before.]
-->
---
layout: statement
---

<div class="devcon-triangle">
<div class="devcon-triangle__text">

# Fast, Cheap, Good

## Pick two

<p v-click="1" class="devcon-triangle__note">With AI, you can have <strong>all three</strong>.</p>
<p v-click="2" class="devcon-triangle__note">The harness is how.</p>

</div>
<svg class="devcon-triangle__svg" viewBox="0 0 820 760">
<polygon points="410,90 80,660 740,660" class="devcon-triangle__edge" />
<circle cx="410" cy="90" r="22" class="devcon-triangle__dot" />
<circle cx="80" cy="660" r="22" class="devcon-triangle__dot" />
<circle cx="740" cy="660" r="22" class="devcon-triangle__dot" />
<g v-click="1">
<polygon points="410,90 80,660 740,660" class="devcon-triangle__edge devcon-triangle__edge--lit" />
<circle cx="410" cy="90" r="26" class="devcon-triangle__dot devcon-triangle__dot--lit" />
<circle cx="80" cy="660" r="26" class="devcon-triangle__dot devcon-triangle__dot--lit" />
<circle cx="740" cy="660" r="26" class="devcon-triangle__dot devcon-triangle__dot--lit" />
</g>
<text x="410" y="40" class="devcon-triangle__label">Fast</text>
<text x="80" y="730" class="devcon-triangle__label">Cheap</text>
<text x="740" y="730" class="devcon-triangle__label">Good</text>
</svg>
</div>

<!--
You all know this rule: fast, cheap, good, pick two. [click] With AI, you do not have to pick. You can have all three in the same change. [click] But the model does not give you that. The harness does, and the harness is what this talk is about.
-->

---
eyebrow: AGENTIC SDLC
---

# Ideal SDLC

<table>
<thead>
<tr><th>Ideal</th><th v-click="1">Practices</th><th v-click="4">Principle</th></tr>
</thead>
<tbody>
<tr><td><strong>Fast</strong></td><td v-click="1">Tight Loops, Automation</td><td v-click="4"><strong>Cadence</strong>: Agility through Feedback</td></tr>
<tr><td><strong>Cheap</strong></td><td v-click="2">Context, Shift-Left</td><td v-click="5"><strong>Cost</strong>: Efficiency through Clarity</td></tr>
<tr><td><strong>Good</strong></td><td v-click="3">Standards, Observability</td><td v-click="6"><strong>Craft</strong>: Quality through Discipline</td></tr>
</tbody>
</table>

<!--
Each ideal comes from a set of practices. [click] Fast comes from tight loops and automation. [click] Cheap comes from context and shift-left. Shift-left is a cost argument: the earlier you catch a mistake, the less it costs. The earliest catch is a rule in context, because then the mistake is never written. [click] Good comes from standards and observability. [click] Behind each ideal is one principle. Fast is cadence: agility through feedback. [click] Cheap is cost: efficiency through clarity. [click] Good is craft: quality through discipline. Keep these three words in mind: cadence, cost, and craft. At the end, I show how we measure each one.
-->

---
eyebrow: AGENTIC SDLC
---

# Traditional SDLC

<div class="devcon-phases">
<div class="devcon-phases__phase">Planning</div>
<div class="devcon-phases__phase">Analysis</div>
<div class="devcon-phases__phase">Design</div>
<div class="devcon-phases__phase">Implementation</div>
<div class="devcon-phases__phase">Testing</div>
<div class="devcon-phases__phase">Deployment</div>
<div class="devcon-phases__phase">Maintenance</div>
<div v-click class="devcon-phases__stage" style="grid-column: 1 / span 3">Discovery</div>
<div v-after class="devcon-phases__stage" style="grid-column: 4 / span 2">Development</div>
<div v-after class="devcon-phases__stage" style="grid-column: 6 / span 2">Delivery</div>
</div>

<!--
You know these seven phases. Each methodology names them a little differently, but the work is the same. [click] I group them into three stages. Discovery decides what to build. Development builds it and proves it works. Delivery ships it and keeps it healthy. Agents change all three, and they change most what each stage produces.
-->

---
eyebrow: AGENTIC SDLC
---

# Agentic SDLC

<div class="devcon-table--dense">
<table>
<thead>
<tr><th>Phase</th><th>Traditional Deliverable</th><th v-click="1">Agentic Artifact</th></tr>
</thead>
<tbody>
<tr><td><strong>Planning</strong></td><td>Requirements document</td><td v-click="1"><code>mockup.html</code></td></tr>
<tr><td><strong>Analysis</strong></td><td>Requirements specification</td><td v-click="1"><code>git diff specs/business</code></td></tr>
<tr><td><strong>Design</strong></td><td>Architecture specification</td><td v-click="1"><code>git diff specs/technical</code></td></tr>
<tr><td><strong>Implementation</strong></td><td>Code commits</td><td v-click="1"><code>git diff client-extensions</code></td></tr>
<tr><td><strong>Testing</strong></td><td>Test reports</td><td v-click="1"><code>yarn test:report</code></td></tr>
<tr><td><strong>Deployment</strong></td><td>Release report</td><td v-click="1"><code>yarn viz:diff</code></td></tr>
<tr><td><strong>Maintenance</strong></td><td>Performance report</td><td v-click="1"><code>yarn viz</code></td></tr>
</tbody>
</table>
</div>

<!--
The phases did not change. What changed is who reads the output. On the left, each deliverable is a document. A person reads it once, signs off, and then it goes stale. [click] On the right, each artifact is an input. The next agent reads it on every run, and the harness checks it. A requirement that no test cites fails plan:check. The last two rows are one tool used two ways: yarn viz builds the Workspace Report for the whole workspace, and yarn viz:diff shows what one branch changes in it. In the Guardrails section, I come back to this table to show where the humans sit.
-->

---
eyebrow: AGENTIC SDLC
---

# The Harness

<div class="devcon-table--dense">
<table>
<thead>
<tr><th>Ideal</th><th>Principle</th><th v-click="1">Harness</th><th></th></tr>
</thead>
<tbody>
<tr><td><strong>Fast</strong></td><td><strong>Cadence</strong></td><td v-click="2"><strong style="color: #FFFFFF">Tools</strong></td><td v-click="2">MCP servers, skills, scripts, orchestration, sandboxes</td></tr>
<tr><td><strong>Cheap</strong></td><td><strong>Cost</strong></td><td v-click="3"><strong style="color: #FFFFFF">Context</strong></td><td v-click="3">Instructions, rules, specs, memory</td></tr>
<tr><td><strong>Good</strong></td><td><strong>Craft</strong></td><td v-click="4"><strong style="color: #FFFFFF">Guardrails</strong></td><td v-click="4">Lint, tests, hooks, approvals, feedback</td></tr>
</tbody>
</table>
</div>

<!--
This is the table from before: each ideal and its principle. [click] Now add the harness. Each principle has one part of the harness that delivers it. [click] Tools give you cadence: MCP servers, skills, scripts, orchestration, and the sandbox. The sandbox is a tool too, because the agent calls it like any other tool. [click] Context gives you cost: instructions, rules, specs, and memory. [click] Guardrails give you craft: lint, tests, hooks, human approvals, and the feedback that turns review comments into rules. These three parts are the three sections of this talk.
-->

---
layout: section
eyebrow: PART 1
---

# Tools

Agility through Feedback

<!--
Tools give you cadence. Each tool in this section makes the time shorter between an agent's mistake and the moment the agent finds it.
-->

---
eyebrow: TOOLS
---

# Skills

<div class="grid grid-cols-3 gap-12">
<div><div class="devcon-stat">Scripts</div><div class="devcon-stat-label">bootstrap, seed, deploy</div></div>
<div><div class="devcon-stat">APIs</div><div class="devcon-stat-label">Liferay headless APIs, graphql</div></div>
<div><div class="devcon-stat">MCP</div><div class="devcon-stat-label">Liferay content, objects, and pages</div></div>
</div>

<div class="pt-12">

- Script whatever you can; it runs the same way every time and costs no tokens
- A skill wraps a tool with its procedure and its failure modes — `/one-deploy`
- A tool is only as good as its description: it decides when the agent uses it

</div>

<!--
The agent has three kinds of tools: our scripts, the Liferay APIs, and the Liferay MCP server. First, script what you can. A script runs the same way every time and costs no tokens. When an agent kept waiting on a counter that had already moved, we stopped describing the step in prose and wrote a script. Second, a skill wraps a tool with how to use it here and what goes wrong. /one-deploy does not only deploy: it checks that the bundle started. Third, the description matters as much as the tool. The agent reads it to decide when to use the tool, so a vague description means a skill that never loads. [CHECK: the MCP claim.]
-->

---
eyebrow: TOOLS
---

# Orchestration

<div class="devcon-team">
<div class="devcon-team__coordinator">Coordinator <span>relays, enforces the gates, never writes code</span></div>
<div class="devcon-team__pipeline">
<div class="devcon-team__role"><div class="devcon-team__role-name">Planner</div><div v-click="2" class="devcon-team__model">Fable</div><div v-click="1" class="devcon-team__file"><code>plan.md</code></div></div>
<div class="devcon-team__arrow">→</div>
<div class="devcon-team__role"><div class="devcon-team__role-name">Developer</div><div v-click="2" class="devcon-team__model">Opus</div><div v-click="1" class="devcon-team__file"><code>git diff</code></div></div>
<div class="devcon-team__arrow">→</div>
<div class="devcon-team__role"><div class="devcon-team__role-name">Tester</div><div v-click="2" class="devcon-team__model">Sonnet</div><div v-click="1" class="devcon-team__file"><code>yarn test:report</code></div></div>
<div class="devcon-team__arrow">→</div>
<div class="devcon-team__role"><div class="devcon-team__role-name">Reviewer</div><div v-click="2" class="devcon-team__model">Fable</div><div v-click="1" class="devcon-team__file"><code>review.md</code></div></div>
</div>
</div>

<ul class="pt-10">
<li><strong>Subagents</strong> — <code>/one-team</code> runs four specialists</li>
<li v-click="1"><strong>Handoffs</strong> — Passing off the deliverables back to the coordinator</li>
<li v-click="2"><strong>Model routing</strong> — the strongest model for the plan and the final review</li>
</ul>

<!--
Orchestration sounds big, but it is only another skill. /one-team takes a ticket from plan to reviewed code with four specialists. The coordinator relays and enforces the gates. It never plans, writes, tests, or reviews. [click] Each handoff is a file on disk: the plan, the developer handoff, the test report, and the review. That keeps each agent's context small, a human can read exactly what was passed, and an interrupted run can resume from the files. [click] Each role also gets its own model. The plan and the final review need the most judgment, so they get the strongest model. Implementation gets Opus, and testing gets Sonnet. That split gives you cadence and cost at the same time.
-->

---
eyebrow: TOOLS
---

# Sandboxes

<div class="devcon-layers">
<div class="devcon-layers__part">
<div class="devcon-layers__name">Code</div>
<div class="devcon-layers__layer">A git worktree on its own branch</div>
</div>
<div class="devcon-layers__part">
<div class="devcon-layers__name">Data</div>
<div class="devcon-layers__layer">A Liferay virtual instance with its own database and search indexes</div>
</div>
<div class="devcon-layers__part">
<div class="devcon-layers__name">Services</div>
<div class="devcon-layers__layer">A Spring Boot with its own container and ports</div>
</div>
<div class="devcon-layers__part">
<div class="devcon-layers__name">Browser</div>
<div class="devcon-layers__layer">A browser on its own subdomain</div>
</div>
</div>

<!--
A worktree isolates the files, but files are the easy part. Two agents on their own branches still break each other if they share one database. One seeds, the other asserts, and both tests fail. So each agent gets four things. Files: a git worktree, ready in seconds. Data: a Liferay virtual instance with its own database schema and search indexes, seeded in about eight minutes. Services: its own Spring Boot sidecar on its own port. Workspace: terminal tabs for code, environment, and tests, and a browser on its own URL. All of it runs on one shared Liferay server, so a second sandbox costs one schema and one sidecar, not a second 10 GB stack. One command does it. one-worktree builds the sandbox for one ticket. start-my-tickets builds one for each ticket assigned to me, and start-my-prs builds one for each PR I review. [CHECK: the command names. Today the skills are /plan-my-tickets and /review-my-prs.]
-->

---
layout: section
eyebrow: PART 2
---

# Context

Efficiency through Clarity

<!--
Context decides cost. You pay for each token the agent reads. You pay for a wrong token twice: once to read it, and once to undo what it caused.
-->

---
eyebrow: CONTEXT
---

# Four Kinds of Context

<div class="devcon-layers">
<div class="devcon-layers__part">
<div class="devcon-layers__name">Memory</div>
<div class="devcon-layers__layer">Personal, not in the repo</div>
<div class="devcon-layers__layer">Loads when a session recalls it</div>
</div>
<div class="devcon-layers__part">
<div class="devcon-layers__name">Instructions</div>
<div class="devcon-layers__layer"><code>AGENTS.md</code></div>
<div class="devcon-layers__layer">Loads every session</div>
<div class="devcon-layers__layer">The map: architecture, commands, links</div>
</div>
<div class="devcon-layers__part">
<div class="devcon-layers__name">Rules</div>
<div class="devcon-layers__layer"><code>.agents/rules/</code></div>
<div class="devcon-layers__layer">Load for the paths they govern</div>
</div>
<div class="devcon-layers__part">
<div class="devcon-layers__name">Specs</div>
<div class="devcon-layers__layer"><code>specs/</code></div>
<div class="devcon-layers__layer">Load when a plan or test cites them</div>
</div>
</div>

<!--
Context is what the agent reads before it acts. We split it four ways, by when it loads. Memory is what earlier sessions learned, one fact per file, recalled only when it matches. It is personal: it lives in my home directory, not in the repo. Instructions, in AGENTS.md, load every session, so they stay short: a map that points at everything else. Rules load only for the paths they govern, so an agent that edits CSS never reads the Spring Boot rules. Specs load when a plan or a test cites a requirement ID.
-->

---
eyebrow: CONTEXT
---

# What Context Costs

<div class="devcon-table--dense">
<table>
<thead>
<tr><th>What happened</th><th>Measured</th><th>The lesson</th></tr>
</thead>
<tbody>
<tr v-click="1"><td>The coordinator did the work instead of delegating it</td><td><strong>389</strong> shell calls at <strong>~440k</strong> tokens each</td><td>A big window is paid for on every call</td></tr>
<tr v-click="2"><td>Handoffs carry file paths, not file contents</td><td><strong>~770</strong> tokens per message</td><td>A pasted file is paid for twice</td></tr>
<tr v-click="3"><td>A long agent was resumed into a later phase</td><td>Past <strong>~60–100k</strong> tokens, it followed its instructions worse</td><td>Start fresh from the files</td></tr>
</tbody>
</table>
</div>

<!--
These numbers come from our own runs of /one-team. [click] The coordinator must only relay. In one run it did the work itself: 389 shell calls, each with about 440 thousand tokens of context. You pay for a big window again on every call. [click] So handoffs carry file paths, not file contents. The agents share the disk, so a message says where the plan is. The average message is about 770 tokens. [click] A long transcript never gets shorter. Past about 60 to 100 thousand tokens, an agent follows its instructions worse. So for a later phase, we start a fresh agent from the files.
-->

---
eyebrow: CONTEXT
---

# Keep Context Clear, Small, and Fresh

<div class="devcon-habits grid grid-cols-2 gap-10 pt-4">
<div class="devcon-team__role"><div class="devcon-team__role-name">Simplified Technical English</div><div class="devcon-team__file">One word has one meaning, and sentences are short.</div></div>
<div class="devcon-team__role"><div class="devcon-team__role-name">Load on Demand</div><div class="devcon-team__file">Rules load by path, and skills load by description.</div></div>
<div class="devcon-team__role"><div class="devcon-team__role-name">Short Sessions</div><div class="devcon-team__file">The longer a session runs, the worse it uses what it read.</div></div>
<div class="devcon-team__role"><div class="devcon-team__role-name">Fresh Review</div><div class="devcon-team__file">The session that wrote the code cannot see its own mistakes.</div></div>
</div>

<!--
Four habits keep context clear, small, and fresh. One: we write in Simplified Technical English. One word has one meaning, and sentences are short. Our team is global, and it is also the best way to write for a model. Two: load on demand. Rules load by path and skills load by description, so the agent reads only what applies. Three: keep sessions short. The longer a session runs, the worse the model uses what it read, so subagents do the broad reading. Four: review with a fresh session. The session that wrote the code cannot see its own mistakes.
-->

---
layout: section
eyebrow: PART 3
---

# Guardrails

Quality through Discipline

<!--
Guardrails give you craft. Discipline that depends on memory does not survive a hundred agent runs a week. Discipline that the build enforces does.
-->

---
eyebrow: GUARDRAILS
---

# Lint

<div class="devcon-team__pipeline" style="grid-template-columns: 1fr 64px 1fr">
<div class="devcon-team__role"><div class="devcon-team__role-name">Lint</div><div class="devcon-team__model">The build fails</div><div class="devcon-team__file">ESLint, <code>ls-lint</code>, <code>plan:check</code></div></div>
<div class="devcon-team__arrow">&gt;</div>
<div class="devcon-team__role"><div class="devcon-team__role-name">Rule</div><div class="devcon-team__model">Read when it applies</div><div class="devcon-team__file"><code>.agents/rules/</code>, scoped by path</div></div>
</div>

<div class="pt-10">

- **Can a machine check it?** Write a lint rule. The agent cannot argue with it.
- **If not, write a rule** — and scope it to the paths it governs.

</div>

<!--
When you want an agent to do something every time, where you write it matters more than how you word it. Lint comes first. If a machine can check it, make it a check. The build fails, and the agent cannot argue with a failed build. If a machine cannot check it, write a rule, and scope it to the paths it governs. A rule asks. A lint check enforces.
-->

---
eyebrow: GUARDRAILS
---

# Tests

<div class="grid grid-cols-3 gap-12">
<div><div class="devcon-stat devcon-stat--compact">Unit</div><div class="devcon-stat-label">JUnit and Vitest, with no portal</div></div>
<div><div class="devcon-stat devcon-stat--compact">Integration</div><div class="devcon-stat-label">Playwright against the APIs, with no browser</div></div>
<div><div class="devcon-stat devcon-stat--compact">E2E</div><div class="devcon-stat-label">Playwright through the browser</div></div>
</div>

<div class="pt-12">

- `one-test-add` picks the fastest tier that can prove the behavior
- Tests go in their own commit, so the reviewer reads what the change proves
- `plan:check` fails when code has no row in the test plan

</div>

<!--
Tests guard behavior, at three tiers. Unit tests run with no portal. Integration tests call the portal APIs with no browser. End to end tests go through the browser. The agent does not pick the tier by feel. one-test-add picks the fastest tier that can prove the behavior. Tests go in their own commit, so the reviewer reads what the change proves. And plan:check fails the build when code has no row in the test plan.
-->

---
eyebrow: GUARDRAILS
---

# Observability

<div class="devcon-team__pipeline">
<div class="devcon-team__role"><div class="devcon-team__role-name">Source</div><div class="devcon-team__model">9 extractors</div><div class="devcon-team__file">Code, batch, specs, test runs</div></div>
<div class="devcon-team__arrow">→</div>
<div class="devcon-team__role"><div class="devcon-team__role-name">Report</div><div class="devcon-team__model">Workspace Report</div><div class="devcon-team__file">One tab per layer</div></div>
<div class="devcon-team__arrow">→</div>
<div class="devcon-team__role"><div class="devcon-team__role-name">Triage</div><div class="devcon-team__model">Action queue</div><div class="devcon-team__file">Problems no ticket tracks</div></div>
<div class="devcon-team__arrow">→</div>
<div class="devcon-team__role"><div class="devcon-team__role-name">Fix</div><div class="devcon-team__model">An agent</div><div class="devcon-team__file">Closes the action</div></div>
</div>

<div class="pt-10">

- **Built from the source** — nobody maintains the page by hand
- **Drift fails the build** — `yarn viz:check`, and `yarn viz:diff` for each branch

</div>

<!--
Nine extractors read the code, the batch files, the specs, and the test runs. They build the Workspace Report: one page, with a tab for each layer. Nobody edits it by hand, so it does not go stale. Each problem becomes an action, and the triage queue shows the actions that no ticket tracks yet. Give that queue to an agent, and it fixes them. viz:check fails the build on drift, and viz:diff shows what one branch changes. [Show a screenshot or a 20 second clip of the live page here. Publish it private: it shows where the audit found exploitable defects.] [CHECK: what runs it automatically, and how often?]
-->

---
eyebrow: GUARDRAILS
---

# Approvals

<div class="devcon-table--dense">

| Phase | Artifact | Human Checkpoint |
| --- | --- | --- |
| Planning | `mockup.html` | Approve the plan |
| Analysis | `git diff specs/business` | Own the requirements |
| Design | `git diff specs/technical` | Approve the design |
| Implementation | `git diff client-extensions` | Review the code |
| Testing | `yarn test:report` | Review the test results |
| Deployment | `yarn viz:diff` | Merge and deploy |
| Maintenance | `yarn viz` | Check performance, review each new rule |

</div>

<!--
This is the seven phase table from the start. Look at the last column: each phase has a human checkpoint. A human approves the plan, owns the requirements, and approves the design. A human reviews the code and the test results, and a human merges and deploys. In maintenance, a human checks the Workspace Report and reviews each new rule. The harness makes sure nobody skips that step. /plan-my-tickets stops and waits for approval, and /one-team cannot pass a gate on its own. [CHECK: confirm each enforcement point against the skills before the talk.]
-->

---
eyebrow: GUARDRAILS
---

# Feedback

<div class="devcon-team__pipeline">
<div class="devcon-team__role"><div class="devcon-team__role-name">Comment</div><div class="devcon-team__model">A reviewer</div><div class="devcon-team__file">"sort"</div></div>
<div class="devcon-team__arrow">→</div>
<div class="devcon-team__role"><div class="devcon-team__role-name">Learn</div><div class="devcon-team__model"><code>one-review-learn</code></div><div class="devcon-team__file">Finds the pattern</div></div>
<div class="devcon-team__arrow">→</div>
<div class="devcon-team__role"><div class="devcon-team__role-name">Encode</div><div class="devcon-team__model">Rule, lint, or memory</div><div class="devcon-team__file">Written down once</div></div>
<div class="devcon-team__arrow">→</div>
<div class="devcon-team__role"><div class="devcon-team__role-name">Enforce</div><div class="devcon-team__model">Every next run</div><div class="devcon-team__file">The mistake does not return</div></div>
</div>

<!--
This guardrail makes all the others grow. Our reviewer comments "sort" on a PR, once. one-review-learn reads the review, finds the pattern, and writes it down: a lint check if a machine can check it, else a rule or a memory. From then on, every agent run gets it, and the mistake does not come back. A review comment used to fix one PR. Now it fixes every PR after it. [CHECK: use a real PR here.]
-->

---
layout: section
eyebrow: DEMO
---

# Demo

<!--
- /plan-my-tickets
- .agents
- specs
- tests
- Workspace Report
-->

---
eyebrow: TAKEAWAYS
---

# Measure and Iterate

| | Cadence | Cost | Craft |
| --- | --- | --- | --- |
| **Discovery** | Time to Plan | Tokens per Plan | Requirement Rework Rate |
| **Development** | Time to Merge | Tokens per Merge | Defect Escape Rate |
| **Delivery** | Time to Production | Tokens per Deploy | Change Failure Rate |

<!--
This is how you know the harness works. The rows are the three stages: discovery, development, and delivery. The columns are the three principles. Cadence is time: to plan, to merge, and to production. Cost is tokens for each plan, merge, and deploy. Craft is what comes back: requirements reworked, defects that escape, and changes that fail. Measure all nine, change one thing in the harness, and measure again. [CHECK: add our real numbers, or say which ones we track today.]
-->

---
eyebrow: TAKEAWAYS
layout: statement
---

<div class="devcon-triangle">
<div class="devcon-triangle__text">

# Fast, Cheap, Good

## Pick all three

<p v-click="4" class="devcon-triangle__note">Everyone has the same model.</p>
<p v-click="4" class="devcon-triangle__note">The harness is the part you build.</p>

</div>
<svg class="devcon-triangle__svg" viewBox="0 -90 820 920">
<polygon points="410,90 80,660 740,660" class="devcon-triangle__edge" />
<circle cx="410" cy="90" r="22" class="devcon-triangle__dot" />
<circle cx="80" cy="660" r="22" class="devcon-triangle__dot" />
<circle cx="740" cy="660" r="22" class="devcon-triangle__dot" />
<polygon v-click="3" points="410,90 80,660 740,660" class="devcon-triangle__edge devcon-triangle__edge--lit" />
<g v-click="1">
<circle cx="410" cy="90" r="26" class="devcon-triangle__dot devcon-triangle__dot--lit" />
<text x="410" y="35" class="devcon-triangle__sublabel">Tools</text>
</g>
<g v-click="2">
<circle cx="80" cy="660" r="26" class="devcon-triangle__dot devcon-triangle__dot--lit" />
<text x="80" y="800" class="devcon-triangle__sublabel">Context</text>
</g>
<g v-click="3">
<circle cx="740" cy="660" r="26" class="devcon-triangle__dot devcon-triangle__dot--lit" />
<text x="740" y="800" class="devcon-triangle__sublabel">Guardrails</text>
</g>
<text x="410" y="-30" class="devcon-triangle__label">Fast</text>
<text x="80" y="730" class="devcon-triangle__label">Cheap</text>
<text x="740" y="730" class="devcon-triangle__label">Good</text>
</svg>
</div>

<!--
This is the triangle from the start: fast, cheap, good, pick two. Now you know how to get all three. [click] Fast comes from tools: scripts, skills, and a sandbox for each ticket, so a mistake costs minutes. [click] Cheap comes from context: the right context, at the right time, and nothing more. [click] Good comes from guardrails: lint, tests, the Workspace Report, a human at each phase, and review comments that become rules. With all three, the triangle is complete. [click] None of this is the model. Everyone has the same model. The harness is the part you build.
-->

---
eyebrow: TAKEAWAYS
---

# Start Small, Then Grow

<div class="devcon-team__pipeline" style="grid-template-columns: 1fr 64px 1fr 64px 1fr">
<div v-click="1" class="devcon-team__role"><div class="devcon-team__role-name">Today</div><div class="devcon-team__model">Create an <code>AGENTS.md</code> with one rule</div><div class="devcon-team__file">Context</div></div>
<div v-click="2" class="devcon-team__arrow">→</div>
<div v-click="2" class="devcon-team__role"><div class="devcon-team__role-name">This Week</div><div class="devcon-team__model">Start a linter, grow it from each comment</div><div class="devcon-team__file">Guardrails</div></div>
<div v-click="3" class="devcon-team__arrow">→</div>
<div v-click="3" class="devcon-team__role"><div class="devcon-team__role-name">This Month</div><div class="devcon-team__model">Write a skill to spin up a worktree and virtual instance.</div><div class="devcon-team__file">Tools</div></div>
</div>

<!--
You do not need all of this on Monday. Start small. [click] Today: write an AGENTS.md file. Keep it short, a map of your workspace: the architecture, the commands, and links to everything else. That takes about an hour, and every session reads it. [click] This week: start a linter, even with one check. Each time you write the same review comment twice, add a lint check for it. The build fails, and the agent cannot argue with it. [click] This month: give each agent its own sandbox, with its own branch and its own data. Then two agents cannot break each other, and you can rebuild any sandbox.
-->

---
layout: cover
eyebrow: THANK YOU
qr: /devcon/qr-agentic-workspace.png
---

# Questions?
