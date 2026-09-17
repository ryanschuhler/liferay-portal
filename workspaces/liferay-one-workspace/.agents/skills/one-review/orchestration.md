# One Review — Orchestration

This file states how to *run* a review adversarially: who reads the diff, how many independent passes run, and how their findings combine. [`criteria.md`](./criteria.md) states what a review *covers*. [`SKILL.md`](./SKILL.md) states the steps.

**This file applies under `--adversarial` and nowhere else.** A plain `/one-review` never reads it and works `SKILL.md` directly. The plain run is the default, because everything in this file gains accuracy at two or three times the tokens of a plain run. The flag list in `SKILL.md` states when that trade is worth making.

**A pass never reads this file.** A session whose prompt names it a pass works Steps 1 through 5 in `SKILL.md` and nothing here. That rule keeps a pass from spawning passes of its own. It is also why this content lives in a separate file rather than in a section a pass is asked to skip.

The rule applies in both directions, and it governs any edit to either file: **anything a pass must obey belongs in `SKILL.md`, never here.** A rule that binds a pass but sits in this file never reaches the one reader it governs. Nothing at runtime reports that mistake, because a pass that does not read this file is the mechanism rather than a fault. Only what the combining session acts on belongs here.

## Independence From the Change

A session that wrote the diff reviews it worse than a session that did not, and so does a session that a builder briefed. The session cannot see that gap from inside: it can satisfy every step below from what its context already holds, so the procedure finishes and finds less.

Record two facts in the report, and in the receipt under Record the Verdict. Under `--read-only` there is no receipt, so the artifact of the caller carries the two facts — `review.md` for the `one-team` reviewer. Read the two facts as a pair, never one alone.

**State**, settled before Step 1. Where the state is uncertain — a compacted session, inherited context, any earlier contact with this ticket — take the more contaminated state.

- **SELF** — the session wrote part of the diff.
- **BRIEFED** — the session did not write the diff, but it holds earlier conclusions: a briefing from an agent that watched the build, an earlier review of the same diff, a debugging pass over it. The `one-team` reviewer is always BRIEFED. A coordinator that watched the build writes its briefing. `dev-handoff.md` sits in the team directory. Each re-review round carries the developer's account of every rejected finding.
- **FRESH** — neither of the above. The session holds the branch and nothing else.

**Reading**, which names where the findings came from. It does not repeat the state. A `FRESH` session in a harness that cannot spawn subagents records `contaminated`, which means only that the session read the diff itself.

- `fresh` — two or more independent passes that could not see each other. This is the normal path in every state.
- `orchestrated` — one pass run in this session, with its lenses delegated. This is the fallback where the harness offers no second reader.
- `contaminated` — worked in this session, because the harness offers no subagent of any tier.

**The standard is parity, not disclosure.** A SELF or BRIEFED review must find what a FRESH review finds. The label alone is worth nothing.

### No session reviews its own target

**Unless its own prompt names it a pass**, a session that runs this skill does three things: it spawns the passes under Passes, it verifies what they return, and it combines them. It does not work the lenses, it does not read the call sites, and it does not judge the diff. The context of a subagent is clean by construction, so a pass is a fresh review rather than an approximation of one. For a contaminated session it is the only fresh review available.

That exemption is structural, and it overrides everything else in this file. **A session whose prompt names it a pass works Steps 1 through 5 itself, spawns no passes, and skips three sections: this one, Passes, and Combining the Passes.** It records no state of its own. It writes no Independence section, no Passes section, and no Dropped candidates section. Those belong to the session that combines it, the only reader that can know them. Write "you are a pass" in the prompt, in those words. Without those words a pass reads this paragraph and spawns two passes of its own, and each of those spawns two more.

Delegation removes nearly all the difference between the states. Three differences remain. Nothing from a briefing reaches a pass. A SELF session appears nowhere in its own list of findings. Only a FRESH session may settle a disagreement about severity by reading, per Combining the Passes.

**A pass prompt carries pointers only:** that the session is a pass, `<TARGET>`, `<BASE>`, the lane, the path to this skill, the path to the acceptance criteria, the ticket they came from, and, on a re-review round, the two object names that bound the delta. Send no summary of the change. Send no rationale. Send no account of what somebody already checked. Send no list of what to look at. A hint about where to look is how a contaminated session narrows a review while it complies with the form of the rule. Send the ticket. The session that wrote the code may have transcribed the criteria file, and only the source shows a requirement that narrowed during the transcription.

**The flags of the run do not travel to a pass.** A pass always runs Step 1 check-only. A pass writes no receipt. A pass never runs Step 6, `--fix`, or `--comment`. Those belong to this session, after it combines the passes. Every pass shares one checkout, and a mutating formatter in two passes at once causes three failures. It corrupts the tree that the passes read. It feeds each pass the edits of the other, through the rule on uncommitted work in Step 2. It invalidates the `file:line` anchors that the merge depends on. Under `--comment`, each pass would also post its own unmerged findings. **Run Step 1 once, in this session, before you spawn a pass.**

**A pass reads code, not the run.** The section What the readers are given defines that boundary. State it in every pass prompt.

**A re-review round keeps every part of this.** The delta bounds the scope, never the machinery. Each round runs its own passes over the delta, and a fresh `sonnet` reader confirms a claimed fix. This session does not confirm a fix against the developer's explanation.

To accept a developer's rejection of a finding is itself a judgment drop, so send it to the adjudicators. Where they split, this session keeps the finding.

Bound the delta by object name. Use commits where the branch commits between rounds. Use tree objects where it does not, because a `one-team` run stages every change until Phase 6 and `HEAD` never moves. Record `git -C <TARGET> write-tree` once the findings of a round settle. Write it in the entry for that round in the report, or in `review.md` for the `one-team` reviewer. An unrecorded tree name loses the lower bound of the next round. Bound the next round by that snapshot and the current one. After a long idle period, take a new snapshot rather than trust an old name: nothing references those trees, and a `gc --prune=now` deletes them.

**Where the harness cannot spawn `fable`**, spawn the passes on whatever tier it offers and record that in the report. Do not prefer this shape. Independence does not compensate for the tier. One measurement put two `sonnet` passes at 26% recall against a single `fable` pass at 51%. So where the harness can spawn `fable` at all, one `fable` pass beats two cheaper passes, and two beat three.

The shape changes only where the harness can spawn no subagent of any tier. Then run one orchestrated pass in this session. Put every lens in its own subagent. Delegate the call-site reading of the blast-radius step, with the searches, at any reference count above zero. Record `reading: orchestrated`. Name a separate session as the better option.

Where the harness can spawn nothing, work the lenses in this session, record `reading: contaminated`, and name a separate session as the only real remedy. Phase 5 of `one-team` accepts that statement rather than failing the gate on it.

### How a candidate dies

This section governs the combining session, not a pass. A pass filters its own candidates directly. Its clean context is the whole reason it exists, and adjudicators convened against itself would cost two agents for every discarded candidate.

A contaminated session drops no candidate on its own judgment. This section splits the power to drop, and the split is narrower than it first appears:

- **Fact** — the citation is wrong: the line does not exist, the quoted code is not in the file, or the named identifier is not the one on that line. That is the whole of the fact route. To decide that the code *handles* what the candidate claims is judgment, however factual the reading felt. Three examples: a guard two lines above, a caller that already checks, a branch nothing reaches. It is also what a session that wrote the guard believes most readily.
- **Judgment** — everything else: every "intentional", every "not reachable", every "acceptable here". Spawn two `sonnet` adjudicators separately. Give each one the candidate, its `file:line`, the repository to read for itself, and the acceptance criteria. Give neither one this session's reason for doubting the candidate. Give neither an excerpt you chose, because the choice of what to show sets the outcome while it complies with the form of the rule. Drop the candidate only when both adjudicators reject it. Where they split, keep it.

Report every dropped candidate with the route that dropped it, and report a fact drop with the reading that disproved it. The verdict follows the list of surviving findings. It does not follow this session's own sense of whether the change is good, which is the last place contamination hides.

### What the readers are given

Give the acceptance criteria to every reader: each pass, its lens subagents, both adjudicators, the completeness reader, and each fix-verification reader. In a `one-team` run the criteria are `plan.md` and `test-report.md`. Otherwise they are the criteria file below. A FRESH reviewer reads those files, so withholding them breaks parity in the other direction. It also leaves no reader holding the code and the intent at once. That is how a change that implements the wrong requirement passes every reader. Withhold this session's **narrative** instead: the requirements as it remembers them, the rationale, "this is safe because", and anything forwarded from a briefing.

Where no `plan.md` exists, this session derives the criteria from the ticket and cites the ticket. Write the criteria **once, before any pass is spawned**, to `$(git -C <TARGET> rev-parse --path-format=absolute --git-common-dir)/one-review/criteria-$(git -C <TARGET> rev-parse HEAD)`. They go in the git directory for the reason the receipts do. The path is pinned and absolute for the reason Record the Verdict gives.

A pass only reads that file. Leave the derivation to the passes and two of them write the same path at once. The later pass then reads the transcription of the earlier one instead of the ticket.

Give every reader the ticket alongside the file, so a reader can still catch a criterion that narrowed during the transcription. Where no external statement of intent exists at all, this session writes the criteria from memory and the report says so. The intent is self-attested there, and every completeness verdict carries that caveat.

`--read-only` writes this file anyway. It is the one exception to that flag, because the flag protects the working tree and the git directory is not the tree. Without the file there is no artifact to hand a pass at spawn time. The session would then copy its own transcription into every prompt, which is the leak this section prevents.

Put the criteria at the top of the report as well.

**Every reader reads code, not the run.** The only artifacts of the run a reader may open are the acceptance-criteria paths you hand it. Name two groups as off limits in every prompt.

- The `one-team` team directory, which holds `dev-handoff.md`, `team-log.md`, and the `review.md` of each round.
- Everything under `one-review/` in the git common directory except the criteria file you handed over, the receipts and the earlier reports included.

The pointer-only rule governs what a reader is told. Without this rule it governs nothing. A reader that explores the repository finds the team directory and then anchors on the developer's account or on the findings of the last round. The cost is highest for the adjudicators. They are the drop gate a contaminated session may not operate, and an earlier `review.md` tells them how the same question went last time.

**Derive every check again** throughout, per the Evidence rule in `criteria.md`. Read each changed file from disk again. Grep each ERC and each endpoint path again. Trace each symbol again, including the symbols this session opened while it wrote the change. The session is most confident about those and least likely to open them again. Step 2 starts this work, and it is the cheapest step to claim without doing. State in the report what kind of change this is. State for each changed file what you read around it.

## Passes

One pass finds about half of the defects, and a measurement supports that number rather than an assumption. Eleven independent passes read the same migration diff of seven hundred lines, and between them they found thirteen real defects. One pass averaged 51% of all thirteen and 50% of the major ones. Two passes averaged 69% and 83%. Three passes averaged 77% and every major defect. A more careful read does not close that gap. A second read does.

**Every review runs at least two passes.** A pass is one complete run of Steps 1 through 5 by a reader that holds the branch and nothing else. Spawn the passes at the same time, with the pointer-only prompt above.

Two passes is the minimum at every diff size. The second pass gains the most for its cost: eighteen points of overall recall and thirty-three points of major recall. The cost also scales with the diff rather than adding a fixed amount. A pass over five changed lines is therefore a small agent that does a small job.

**Do not lower the tier to save tokens.** A measurement of that change returned the opposite of the intended result. A `sonnet` pass returned one third of the recall of `fable` and one fifth of its major recall. It also used *twice* the tokens, because it takes far more turns to do worse work. Two `sonnet` passes cost 15M tokens for 26% recall, where two `fable` passes cost 7M for 69%. A pass narrowed to the highest-yield lenses measured no better. A cheap pass mixed with a strong one measured worse than two strong passes. Run every pass on `fable`. The number of passes is the only control that trades cost against accuracy honestly.

One pass must not know about another — not its findings, not its prompt, not the fact that it exists. A pass that is told what an earlier pass found stops searching and starts agreeing. That is the anchoring this whole section prevents, returned at the last moment from a source that looks authoritative. This rule is worth more than the number of passes: two passes that saw each other are one pass plus one agreement.

Each pass establishes its own diff from `<BASE>`. One shared diff saves almost nothing. It also gives every pass the same mistake from Step 2, such as a wrong base or a missed uncommitted file. No reader is then left who could notice it.

A third pass costs about half as much again. In the one study that measured it, the third pass raised major recall from 83% to 100%. That result comes from a single sample, so use a third pass as the escalation for a change that must not ship broken, not as a rule. **Do not trigger the third pass on how much the first two overlapped.** A measurement of that heuristic shows it does not predict the result: the pair with the lowest overlap gained nothing from a third reader, and the pair with the highest overlap gained the most. One signal is clear. Two passes that both found nothing on a diff above a trivial size give a thin sample twice, which earns a third pass rather than an approval. State how many passes ran.

**A pass runs Steps 1 through 5, and none of the orchestration.** It spawns no pass of its own, per the structural exemption in Independence From the Change.

## Combining the Passes

Take the union of the findings, never the intersection. In the run above, one pass alone found each of the two serious defects. An intersection would have discarded both and reported the diff as cleaner than it was.

Merge on the defect, not on the wording. Two passes that describe one cache defect in different sentences report one finding. One line that carries two unrelated defects gives two findings.

- **Corroborated** — two or more passes reported it. Promote it and carry the count.
- **Single-pass** — one pass reported it. Read the cited `file:line` yourself and confirm it before you promote it, then promote it and mark it single-pass. A single report is not evidence against a finding: in the measured run, one pass alone found each of the two hardest defects. To drop such a finding is a drop like any other — the fact route only, and the judgment route to the adjudicators.

Where the passes disagree on a severity, carry the highest. Never carry the average, and where this session is `SELF` or `BRIEFED`, never carry its own read. To lower a blocker to a minor is the same power as dropping the finding, used more quietly. So a contaminated session that believes the lower severity is right sends the question to the two adjudicators, exactly as it sends a drop. A `FRESH` session may settle the question by reading, and it says in the report that it did.

An earlier round settles a finding in one direction only. An earlier round can **reject** a finding for a reason accepted at the time. That finding does not reopen because a new pass that cannot see the history found it again. Merge it against the record of that round and continue. Hiding the earlier findings buys fresh eyes. It does not reopen a settled question. A finding an earlier round marked **fixed** is the opposite case. A fresh reader that reports the same defect after the fix landed is evidence the fix did not work. Reopen the finding and cross-check it against the report of the fix-verification reader. To settle that finding away leaves one reader between an unfixed blocker and `APPROVED`.

Every finding carries its corroboration count into the report as **provenance, not confidence**. Agreement between passes is not evidence that a finding is right. In the study behind these numbers, the defect with the most corroboration was the only one the adjudicators judged false. Eight passes of eleven reported it. In the same study, one pass alone found two of the four major defects. Report the count so a reader knows how the finding arrived, and never let it replace the verification.

**Then run one completeness reader over the combined report.** Give a fresh `sonnet` subagent the diff and the merged findings. It answers a single question: what would a reviewer who sees this change for the first time examine that this report never mentions? Run that reader here rather than inside a pass, where it could see the gaps of one reader only. Over the combination it sees what every pass missed together, which is the gap worth finding. Send whatever it names to a fresh reader under the pointer-only rule, never to this session. Its candidates then enter the merge above like any other. Report what it named and what came of each item, even when it named nothing.