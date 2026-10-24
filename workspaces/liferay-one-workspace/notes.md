- Presentation Type
    -  Deep Dive (40min)
- Applications
    -  Building Liferay with Liferay
    -  Architecture
    - AI & ML
    -  Low Code / No code
- Presentation Title
    - The Agentic Workspace
- Presentation Abstract
    - Every developer knows the rule: Fast, Cheap, or Good—pick two. But in the era of autonomous AI, those rules are being rewritten. This session explores how an agentic approach to the Liferay Workspace is helping internal teams deliver value faster and more reliably than ever before. We’ll dive into the "agent-ready" toolkit—including declarative configs and portable content—and share the performance benchmarks that prove it works. From reducing manual tasks to improving deployment frequency, join us to see how we’ve harnessed AI to finally achieve the trifecta of software excellence.
- Bio
    - Ryan is an Engineering Team Lead at Liferay, where he builds and optimizes the core internal systems driving company operations. Passionate about modern developer workflows and autonomous AI, he focuses on turning complex infrastructure into streamlined, high-impact tools that help engineering teams move faster without compromising quality.

### Notes
#### Agentic SDLC
- Tooling
    - [ ] docs (context)
    - [ ] linting rules (structure)
    - [ ] test coverage (behavior)
    - [ ] spec (intent)
- Declarative Configurations
    - [ ] local environment
    - [ ] configs cx
- Custom Code
    - [ ] custom element cx 
    - [ ] spring boot cx
- Portable Content
    - [ ] batch cx

#### Agenticness
1. Goal complexity: How sophisticated are the tasks the AI is designed to complete?
2. Environmental complexity: How well does the AI perform across different, unpredictable conditions?
3. Adaptability: Can the AI adjust to novel situations, or is it limited to predefined rules?
4. Independent execution: How much can the AI achieve without human intervention?
#### Benefits
- More reliable outputs: Instead of pulling from static training data, agentic AI searches, refines, and verifies information in real time, leading to more accurate and up-to-date results.
- Less manual effort: Instead of waiting for step-by-step instructions, AI can take a broad objective, execute multiple steps autonomously, and refine its method along the way.
- Scalability: A single AI system can handle tasks that would normally require multiple human workers, whether that’s automating customer support, optimizing supply chains, or managing complex workflows.
- Faster decision-making: As we previously covered, since agentic AI doesn’t just analyze data (it acts on it), it could adjust production schedules, reroute, or respond to customer needs before issues arise.

##### SDLC

| **Phase**          | Objective    | **Deliverable**    | **Owner**           | **Pitfall**           | Metric                |
| ------------------ | ------------ | ------------------ | ------------------- | --------------------- | --------------------- |
| **Planning**       | Alignment    | Requirements Doc   | Product Manager     | Changing Requirements | Flow Score            |
| **Analysis**       | Discovery    | Requirements Spec  | Business Analyst    | Analysis Paralysis    | Lead Time to Start    |
| **Design**         | Architecture | Architecture Spec  | Solutions Architect | Tech Debt             | Code Score            |
| **Implementation** | Execution    | Code Commits       | Software Engineer   | Cutting Corners       | Cycle Time            |
| **Testing**        | Validation   | Test Reports       | QA Engineer         | Feedback Delay        | Quality Score         |
| **Deployment**     | Delivery     | Release Report     | DevOps Engineer     | Alert Fatigue         | Lead Time for Changes |
| **Maintenance**    | Resilience   | Performance Report | SRE                 | Knowledge Silos       | Resilience Score      |
#### Principles
- Fast - Agility through Response
    - Tight feedback loops
    - Automate by default
    - **Outcome:** High Deployment Frequency ($DF$) and low Lead Time for Changes.
- Cheap - Efficiency through Clarity
    - Everything as Code
    - Traceability
    - **Outcome:** Lower Total Cost of Ownership ($TCO$) and reduced technical debt.
- Good - Quality through Discipline
    - Shift-left
    - Definition of Ready
    - Definition of Done
    - **Outcome:** Low Change Failure Rate ($CFR$) and high system reliability.

#### Metrics
##### FAST
- Flow score
    - Lead time 
        - lead time to start
        - cycle time
        - lead time for changes
    - deployment frequency
    - backlog readiness
    - wip
    - pr lead time
##### CHEAP
- Business Score
    - Cloud cost per unit of value
    - Feature to bug ratio
    - Total cost of Ownership
##### GOOD
-  Code Score
    - Tech debt
    - IaC coverage
    - Code Complexity
- Quality score
    - Test coverage
    - Change failure rate
    - Defect escape rate
- Resilience Score
    - Mean time to recovery
- Security Score
    - Mean time to remediation of vulnerabilities
    - Dependency freshness
    - Compliance ratio


### Other talks
- Alex
    - MCP latest and greatest creating content
- Victor
    - Skills creating code
    - take a design doc and some written business requirements and show it generate the code/site
    - loop vs prompts
- Mine
    - Harness for the sdlc
    - Real world use case 

#### Harness Components
- Tools: APIs, code execution, search, databases and business applications
- Context: Prior context, user preferences and workflow history
- Sandbox: Files, data, environments and systems the agent can access
- Guardrails: Permissions, policies, approvals and monitoring

#### What a Harness Includes
Concretely, a harness includes things like:
- System Prompts
- Tools, Skills, MCPs + and their descriptions
- Bundled Infrastructure (filesystem, sandbox, browser)
- Orchestration Logic (subagent spawning, handoffs, model routing)
- Hooks/Middleware for deterministic execution (compaction, continuation, lint checks)

#### Article: Agentic Harnesses, the New Infrastructure Layer for AI Systems
Balaji Bal, Medium, April 5, 2026. https://medium.com/@balajibal/agentic-harnesses-the-new-infrastructure-layer-for-ai-systems-3939c6fac1a6

- **Main claim:** the real product is often not the model, and not the interface. It is the harness, and the harness is becoming infrastructure.
- **Definition:** "the configurable runtime that sits between the model and the world." It receives tasks, assembles context, selects models, invokes tools, keeps state, enforces permissions, recovers from failure, and returns outputs.
- **What the harness is not:**
    - Not the model: the model reasons and generates, but gives no durable workflow, state, environment control, or safety.
    - Not the UI: a terminal, IDE, or chat surface is presentation, not the mechanism that governs execution.
    - Not a tool registry: the harness decides when a tool can be used, under what constraints, in what order, with what approvals, and how to recover.
- **Why now:** coding agents put the loop on stage (files, plans, commands, retries, errors), and more teams build on an existing harness instead of writing their own. Once others depend on it, it is infrastructure.
- **Two architectures:**
    - Integrated: harness and UX built as one product. Coherent and optimized, but strategically constrained.
    - Decoupled: the harness is a standalone runtime and the UI is one client of many (chat, API, IDE, messaging). Reusable and more valuable as a platform. Example: Hermes Agent.
- **Why harness as infrastructure:** separation of concerns, faster iteration, reuse across surfaces, stronger governance (controls implemented once), enterprise viability (configurable, observable, extensible), and better economics (a platform, not one app).

##### The Layers of the Harness
"A layered but highly linked system."

1. **Interface and ingress:** where tasks enter and outputs return (terminal, IDE, web, chat, API, webhook). It translates intent and renders progress. It depends on stable harness APIs; orchestration logic must not leak into the UI.
1. **Session and state management:** sessions, history, checkpoints, resumability, artifact tracking. Knows what is in progress and where recovery starts. Without it, nothing works across turns or long workflows.
1. **Orchestration and control loop:** "the core of the harness," the "brainstem." Decomposition, planning, execution, branching, retries, escalation, approval pauses, termination. Decides the next move: ask, call a tool, update context, switch models, or answer.
1. **Model abstraction:** routing, fallback, provider selection, normalized and structured output, capability aware selection. Different steps need different models: speed, long context, code quality, reliability.
1. **Tool execution:** files, terminals, browsers, APIs, enterprise systems, MCP connectors. The issue is controlled access: permissions, schemas, validation, execution policies. "A good harness does not simply let the model use tools."
1. **Context and memory:** assembles what the model sees at each step: templates, instructions, retrieved docs, summaries, prior actions, long term memory, preferences. "The goal is not to dump everything into the context window. The goal is to supply the right context at the right time in the right format." Decides what is ephemeral, durable, retrieved on demand, or compressed.
1. **Environment and runtime:** where actions happen: file systems, container sandboxes, terminals, browsers, test runners, deploy targets. Drives safety, reproducibility, and capability.
1. **Safety and governance:** approvals, policy, identity and access, budgets, risk classes, audit, secrets, guardrails. "As soon as the system can act, safety stops being a prompt problem and becomes an infrastructure problem." It wraps both what the model proposes and what the system may do.
1. **Observability and evaluation:** traces, logs, metrics, replay, regression evaluation. Answers why the agent took a step, which tool failed, which model ran, what policy blocked it. "A harness that cannot be inspected will not be trusted."
1. **Extension surface:** plugins, adapters, policy modules, custom tools, model routers, configurable workflows. "Where the product becomes a platform." Healthy if features attach to a clear module boundary; weak if every feature needs invasive rewrites.

- **Linkages matter more than components:** orchestration consumes model and tool output; context feeds orchestration and model selection; safety wraps model calls, tools, and state changes; observability spans everything. Brittle systems leak logic across boundaries and "work in demos but resist extension." "Flexibility does not come from adding more components. It comes from designing the right separation between them."
- **The real product question:** not whether it completes a task in a demo, but whether it can be configured, embedded, extended, governed, and evolved. "A harness that cannot be observed will not be trusted in serious environments."
- **Conclusion:** the future of agentic systems depends on the quality of the harness underneath: its boundaries, controls, extensibility, and observability. Decoupling the harness from the interface makes both more valuable.

##### How the Layers Map to the Talk
| Article Layer | Our Part | In Our Workspace |
| --- | --- | --- |
| Interface and ingress | Tools | Claude Code, herdr panes, slash commands |
| Session and state | Context | Memory files, `plan.md` and handoff files, commit early |
| Orchestration and control loop | Tools | `/one-team`, phase gates, fan out skills |
| Model abstraction | Tools | Model routing in `one-review-learn` |
| Tool execution | Tools | 46 skills, Liferay MCP, headless APIs, scripts |
| Context and memory | Context | Path scoped rules, specs, memory, context rot |
| Environment and runtime | Sandbox | Worktree and partitioned instance per ticket |
| Safety and governance | Guardrails | Lint, tests, read only reviewer, human approval |
| Observability and evaluation | Guardrails | Workspace Health, `viz:check`, test history |
| Extension surface | Tools | `author-skill`, `commit-skill`, ESLint plugin |
