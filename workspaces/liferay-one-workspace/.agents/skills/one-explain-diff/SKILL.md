---

allowed-tools: [Bash, Glob, Grep, Read, Write]
description: Produce a rich, interactive HTML explanation of a code change, diff, branch, or PR. Use when the user asks to explain, walk through, or teach a diff/branch/PR, or invokes /one-explain-diff.
name: one-explain-diff

---

# Explain a Diff

Produce an interactive explanation of one code change as a single HTML file. That file holds all of its own CSS and JavaScript. The explanation teaches the context of the change, the core idea, and the details. The reader can have no knowledge of the system around the change.

## Resolve the Target

Resolve the change to explain in this order:

1. **User argument** — an explicit ref, range, branch, or PR number the user names (e.g. `HEAD~3..HEAD`, `LPD-12345`, a PR URL, a branch name).

1. **Current branch vs. base** — when nothing is named, diff the current branch against `liferay-one/master-temp`:

	```bash
	git diff liferay-one/master-temp...HEAD
	```

1. **Fallback** — ask the user what to explain when the diff is empty, or when more than one change matches.

Read the complete diff before you write the file. Read the commit messages with `git log` before you write the file.

## Explore Before Explaining

Do not explain the diff alone. Read the code around the diff, so that the "Background" section is correct. Open each file that the diff changes. Follow the main types and their callers. Learn what the subsystem does. Read the reference cards under `rules/` when the workspace conventions apply. These conventions cover Objects, client extensions, site initializers, and headless APIs. Read the Jira ticket through the Jira REST API when the change names one. The ticket gives the intended behavior and the motivation.

## Required Sections

Write the explanation as one long page with these four sections, in this order:

- **Background** — Explain the part of the system that this change applies to. You do not know what the reader knows. Give a *deep background for beginners* first, and mark it as optional for a reader who knows the system. Then give a *narrow background* for the change itself.

- **Intuition** — Explain the core idea of the change. Give the idea, not every detail. Use examples with simple data. Use figures and diagrams often.

- **Code** — Describe the changes at a high level. Group the changes. Order the groups so that one group prepares the next group. Do not use the file order.

- **Quiz** — Write five interactive multiple-choice questions of medium difficulty. A reader answers each question correctly only with an understanding of the change. Do not write a trick question. Each option shows whether it is correct and gives feedback on a click. The quiz lets the reader confirm what the reader understands.

## Writing Style

- Write with the clarity of Martin Kleppmann. Use the classic style. Explain *why* before *how*. Connect each section to the next section, so that the page reads as one narrative.

- Use callouts, which are styled boxes, for the main concepts, the definitions, and the important edge cases.

## Diagrams

- Use these two diagram *families* through the page, for different cases:
  - A simple mockup of the UI that the user sees. Use it to explain a UI change.
  - A system diagram of the data flow between the components. **Put example data in the diagram**, not only labels.

- **Never use an ASCII diagram.** Build every diagram from simple HTML and CSS: boxes, arrows, and flex or grid layouts. Use an HTML list for a list.

## HTML Output Format

- Write a **single HTML file** that holds all of its CSS and JavaScript. Do not link an external asset. Do not link a CDN.

- Write one long page that scrolls, with a header for each section. Put a table of contents at the top. Do **not** use tabs for the top level structure.

- Add responsive styling, so that the page reads well on a phone.

- **Code blocks:** Put every code block in a `<pre>` tag. When you use a styled `<div>` in place of it, the CSS for that `<div>` **must** set `white-space: pre-wrap`. Without that value, the browser joins every line into one line. Read every code block in the HTML source before you save the file. Confirm that the CSS sets `white-space: pre` or `white-space: pre-wrap`.

## File Location and Naming

Write the file to a directory **outside** the code repository, for example `/tmp`. Never write the file inside the workspace. Never write the file inside the `liferay-portal` checkout. The file must stay out of version control.

Start the file name with the date of today, in the `YYYY-MM-DD-` format. The files then sort by date:

```
/tmp/YYYY-MM-DD-explanation-<slug>.html
```

Use the current date from the session context. Write a short kebab-case `<slug>` for the change, for example the ticket key or a summary. Print the absolute path after you write the file, so that the user can open it.