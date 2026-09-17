# One Team — Jira Recipes

This file is the Phase 0 reference for the coordinator. Read it once, at kickoff. Then work from the digests on disk.

Jira access is read-only here. Never transition a ticket from this workflow. Never post a comment from this workflow.

## The Ticket

```bash
curl --silent --user "${JIRA_API_USER}:${JIRA_API_TOKEN}" \
	"https://liferay.atlassian.net/rest/api/3/issue/<TICKET>" > ticket.json
```

Validate the response before you digest it or brief a teammate. The file `ticket.json` must contain the requested issue key. When the key is absent, stop. Then tell the user which of the two causes applies: the credentials (`JIRA_API_USER`/`JIRA_API_TOKEN` unset or rejected), or an unknown ticket. A planner that reads an error body writes an incorrect plan.

## The Initiative

The initiative is every ticket under the One Liferay initiative. It gives the surrounding context. Fetch the full list. The planner looks for other active work that this ticket must not collide with, and nobody can search for a collision before they know it exists. The digest below makes the list 13 times smaller, so the full list is small enough to keep.

```bash
curl --silent --get --user "${JIRA_API_USER}:${JIRA_API_TOKEN}" \
	--data-urlencode 'jql=issue in portfolioChildIssuesOf("LPD-87600") ORDER BY key' \
	--data-urlencode 'fields=issuetype,status,summary' \
	"https://liferay.atlassian.net/rest/api/3/search/jql"
```

The endpoint returns the issues in pages. Pass `maxResults`. Then follow `nextPageToken` until the endpoint returns the last page. Build the token flag with an explicit branch. Do not build it with `${TOKEN:+--data-urlencode "nextPageToken=${TOKEN}"}`, because zsh does not word-split that expansion and curl then receives one malformed argument:

```bash
TOKEN=""
while :; do
	if [ -n "${TOKEN}" ]; then RESP=$(curl <flags as above> --data-urlencode "nextPageToken=${TOKEN}" "<url>"); else RESP=$(curl <flags as above> "<url>"); fi
	echo "${RESP}" >> pages.jsonl
	TOKEN=$(echo "${RESP}" | jq -r '.nextPageToken // empty')
	[ -z "${TOKEN}" ] && break
done

jq -s '{issues: [.[].issues[]]}' pages.jsonl > initiative.json
```

When Jira does not offer `portfolioChildIssuesOf`, use `parent = LPD-87600` instead. Then walk one level down.

Also pull the ticket's own graph — parent, subtasks, and issue links. The file `ticket.json` already holds the graph, so it costs no extra call. Append the graph to the digest, so that the planner reads the direct relationships without a search:

```bash
jq -r '[.fields.parent, .fields.subtasks[]?, (.fields.issuelinks[]? | .inwardIssue, .outwardIssue)]
	| map(select(. != null))
	| .[] | "\(.key) | \(.fields.status.name) | \(.fields.summary)"' ticket.json
```

## The Digests

The raw responses are far too large to read. One initiative of 584 issues measured about 180,000 tokens, and one detailed ticket about 13,000 tokens. A run of these recipes against exactly that data produced about 14,000 tokens and 400 tokens. That is a reduction by a factor of 13 and a factor of 30. The acceptance criteria, the dev notes, and the dependencies all survive the reduction:

```bash
jq -r '.issues[] | "\(.key) | \(.fields.issuetype.name) | \(.fields.status.name) | \(.fields.summary)"' \
	initiative.json > initiative-digest.md

{
	jq -r '"# \(.key) — \(.fields.summary)\n\nType: \(.fields.issuetype.name)\nStatus: \(.fields.status.name)\n"' ticket.json
	jq -r '.fields.description | [.. | objects | select(.type == "text") | .text] | join(" ")' ticket.json
} > ticket-digest.md
```

The description uses the Atlassian Document Format, which is why the recipe flattens the text nodes. Verify that the acceptance criteria survive the flatten. Read `.fields.description` alone instead when the ticket uses tables or panels that the flatten damages.

Brief the teammates on the digests. The raw JSON stays on disk for a targeted `jq` call, for the case where somebody needs a field that a digest dropped. Never read the raw JSON whole.