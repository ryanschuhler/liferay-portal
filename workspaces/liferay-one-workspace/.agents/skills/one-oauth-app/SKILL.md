---

allowed-tools: [Bash, Glob, Grep, Read, mcp__chrome-devtools__click, mcp__chrome-devtools__evaluate_script, mcp__chrome-devtools__fill, mcp__chrome-devtools__fill_form, mcp__chrome-devtools__list_pages, mcp__chrome-devtools__navigate_page, mcp__chrome-devtools__new_page, mcp__chrome-devtools__select_page, mcp__chrome-devtools__take_snapshot, mcp__chrome-devtools__wait_for]
description: Create or recreate a local-dev OAuth2 application with all available scopes. Use when the user asks to set up a local OAuth2 app, or after a one-env-reset wipes the application.
name: one-oauth-app

---

# Create Local Dev OAuth2 Application

This skill creates one OAuth2 client credentials application for local development. The application receives every available scope. Use the application for manual API tests, for scripts, and for tools against the local Liferay instance.

| Field | Value |
|-------|-------|
| App Name | `Local Dev` |
| Client ID | `local-dev` |
| Client Secret | `local-dev-secret` |

This DXP version has no headless REST API for OAuth2 application administration. This step therefore calls the `OAuth2AdminPortlet` ActionURLs with `curl`. Do not open a browser. Do not use the `chrome-devtools` MCP server. Do not take a snapshot.

## Create the Application

Run this script:

```bash
#!/bin/bash
set -euo pipefail

ADMIN_EMAIL="test@liferay.com"
ADMIN_PASSWORD="test"
PORTAL_BASE="http://localhost:8080"

APP_NAME="Local Dev"
APP_CLIENT_ID="local-dev"
APP_CLIENT_SECRET="local-dev-secret"

LOGIN_PORTLET="com_liferay_login_web_portlet_LoginPortlet"
OAUTH_PORTLET="com_liferay_oauth2_provider_web_internal_portlet_OAuth2AdminPortlet"

JAR=$(mktemp)
trap 'rm -f "$JAR"' EXIT

extract_auth_token() {
	# The CSRF token for portlet ACTION URLs is the page's global Liferay.authToken.
	# Do NOT grep for "p_auth=" — that also matches the per-portlet "p_p_auth="
	# render tokens on the control-panel nav links, and submitting one of those as
	# p_auth on the action POST fails CSRF validation with HTTP 403.
	grep -oE "authToken: '[A-Za-z0-9]+'" | head -n1 | cut -d"'" -f2
}

find_app_id_by_client_id() {
	python3 -c '
import sys, re
needle = sys.argv[1]
html = sys.stdin.read()
for match in re.finditer(r"<tr\b[^>]*>(.*?)</tr>", html, re.DOTALL):
	row = match.group(1)
	if needle in row:
		m = re.search(r"oAuth2ApplicationId=(\d+)", row)
		if m:
			print(m.group(1))
			sys.exit(0)
sys.exit(1)
' "$1"
}

extract_all_scope_aliases() {
	python3 -c '
import sys, re
html = sys.stdin.read()
# Each scope is rendered as one <li class="list-group-item ..."> block containing
# an <input name="..._scopeAliases" value="<alias>"> and a <label> with a
# human-readable description. Keep only the unified ".everything" aliases whose
# label combines BOTH phrases (e.g. "create/update/delete data on your behalf +
# read data on your behalf"). This selects the combined scope and skips the
# narrower ".write"-only and ".read"-only variants that would otherwise be
# redundant.
REQUIRED = ("create/update/delete data on your behalf", "read data on your behalf")
seen = set()
for entry in re.split(r"<li\s+class=\"list-group-item[^\"]*\"", html)[1:]:
	val = re.search(r"name=\"[^\"]*_scopeAliases\"[^>]*value=\"([^\"]+)\"", entry) or \
		re.search(r"value=\"([^\"]+)\"[^>]*name=\"[^\"]*_scopeAliases\"", entry)
	if not val:
		continue
	alias = val.group(1)
	label_m = re.search(r"<label\b[^>]*>(.*?)</label>", entry, re.DOTALL)
	if not label_m:
		continue
	label_text = " ".join(re.sub(r"<[^>]+>", " ", label_m.group(1)).split())
	if all(phrase in label_text for phrase in REQUIRED) and alias not in seen:
		seen.add(alias)
		print(alias)
'
}

# Seed cookie jar + harvest the pre-login CSRF token from the maximized login portlet.
LOGIN_HTML=$(curl --silent --cookie-jar "$JAR" --cookie "$JAR" \
	"${PORTAL_BASE}/web/guest/home?p_p_id=${LOGIN_PORTLET}&p_p_state=maximized")
P_AUTH=$(echo "$LOGIN_HTML" | extract_auth_token)

# POST login. The cookie jar now carries the authenticated session.
curl --silent --cookie-jar "$JAR" --cookie "$JAR" --location --output /dev/null \
	--request POST "${PORTAL_BASE}/web/guest/home?p_p_id=${LOGIN_PORTLET}&p_p_lifecycle=1&_${LOGIN_PORTLET}_jakarta.portlet.action=%2Flogin%2Flogin&p_auth=${P_AUTH}" \
	--data-urlencode "_${LOGIN_PORTLET}_login=${ADMIN_EMAIL}" \
	--data-urlencode "_${LOGIN_PORTLET}_password=${ADMIN_PASSWORD}"

if ! grep -qE $'\tID\t' "$JAR"; then
	echo "Login failed — no ID cookie in jar" >&2
	exit 1
fi

# Resolve the admin user's id. Basic auth works against the headless API here.
USER_ID=$(curl --silent --user "${ADMIN_EMAIL}:${ADMIN_PASSWORD}" \
	--get "${PORTAL_BASE}/o/headless-admin-user/v1.0/user-accounts" \
	--data-urlencode "filter=alternateName eq 'test'" \
	--data-urlencode "fields=id" \
	| python3 -c 'import sys,json;print(json.load(sys.stdin)["items"][0]["id"])')

# Harvest a fresh CSRF token bound to the authenticated session. Reused for all
# subsequent ActionURL POSTs against the OAuth2 admin portlet.
OAUTH_LIST_URL="${PORTAL_BASE}/group/control_panel/manage?p_p_id=${OAUTH_PORTLET}&p_p_lifecycle=0&p_p_state=maximized"
P_AUTH=$(curl --silent --cookie-jar "$JAR" --cookie "$JAR" "$OAUTH_LIST_URL" | extract_auth_token)

UPDATE_ACTION="${PORTAL_BASE}/group/control_panel/manage?p_p_id=${OAUTH_PORTLET}&p_p_lifecycle=1&_${OAUTH_PORTLET}_jakarta.portlet.action=%2Foauth2_provider%2Fupdate_oauth2_application&p_auth=${P_AUTH}"

# Create the application. clientProfile=4 is Headless Server; the create code
# path regenerates clientSecret regardless of what we submit, so the
# predictable secret is installed by a second update POST below.
curl --silent --cookie-jar "$JAR" --cookie "$JAR" --location --output /dev/null \
	--request POST "$UPDATE_ACTION" \
	--data-urlencode "_${OAUTH_PORTLET}_oAuth2ApplicationId=0" \
	--data-urlencode "_${OAUTH_PORTLET}_name=${APP_NAME}" \
	--data-urlencode "_${OAUTH_PORTLET}_redirectURIs=${PORTAL_BASE}/" \
	--data-urlencode "_${OAUTH_PORTLET}_clientAuthenticationMethod=client_secret_post" \
	--data-urlencode "_${OAUTH_PORTLET}_clientProfile=4" \
	--data-urlencode "_${OAUTH_PORTLET}_grant-CLIENT_CREDENTIALS=true" \
	--data-urlencode "_${OAUTH_PORTLET}_clientCredentialUserId=${USER_ID}" \
	--data-urlencode "_${OAUTH_PORTLET}_clientCredentialUserName=test" \
	--data-urlencode "_${OAUTH_PORTLET}_clientId=${APP_CLIENT_ID}"

# Find the new app's internal id by scanning the list page for the row whose
# client_id column contains APP_CLIENT_ID.
LIST_HTML=$(curl --silent --cookie-jar "$JAR" --cookie "$JAR" "$OAUTH_LIST_URL")
APP_ID=$(echo "$LIST_HTML" | find_app_id_by_client_id "$APP_CLIENT_ID")

if [ -z "$APP_ID" ]; then
	echo "Could not locate application id for clientId=${APP_CLIENT_ID}" >&2
	exit 1
fi

# Second update: install the predictable client secret.
curl --silent --cookie-jar "$JAR" --cookie "$JAR" --location --output /dev/null \
	--request POST "$UPDATE_ACTION" \
	--data-urlencode "_${OAUTH_PORTLET}_oAuth2ApplicationId=${APP_ID}" \
	--data-urlencode "_${OAUTH_PORTLET}_name=${APP_NAME}" \
	--data-urlencode "_${OAUTH_PORTLET}_redirectURIs=${PORTAL_BASE}/" \
	--data-urlencode "_${OAUTH_PORTLET}_clientAuthenticationMethod=client_secret_post" \
	--data-urlencode "_${OAUTH_PORTLET}_clientProfile=4" \
	--data-urlencode "_${OAUTH_PORTLET}_grant-CLIENT_CREDENTIALS=true" \
	--data-urlencode "_${OAUTH_PORTLET}_clientCredentialUserId=${USER_ID}" \
	--data-urlencode "_${OAUTH_PORTLET}_clientCredentialUserName=test" \
	--data-urlencode "_${OAUTH_PORTLET}_clientId=${APP_CLIENT_ID}" \
	--data-urlencode "_${OAUTH_PORTLET}_clientSecret=${APP_CLIENT_SECRET}"

# Discover every scope alias available on this portal instance by scraping the
# assign-scopes page. Aliases are rendered as checkbox values — no hardcoding.
ASSIGN_PAGE_URL="${PORTAL_BASE}/group/control_panel/manage?p_p_id=${OAUTH_PORTLET}&p_p_lifecycle=0&p_p_state=maximized&_${OAUTH_PORTLET}_mvcRenderCommandName=%2Foauth2_provider%2Fassign_scopes&_${OAUTH_PORTLET}_navigation=assign_scopes&_${OAUTH_PORTLET}_oAuth2ApplicationId=${APP_ID}"
ASSIGN_PAGE=$(curl --silent --cookie-jar "$JAR" --cookie "$JAR" "$ASSIGN_PAGE_URL")

mapfile -t SCOPE_ALIASES < <(echo "$ASSIGN_PAGE" | extract_all_scope_aliases)

if [ "${#SCOPE_ALIASES[@]}" -eq 0 ]; then
	echo "No scope aliases found on assign-scopes page — check portlet URL or session." >&2
	exit 1
fi

echo "Found ${#SCOPE_ALIASES[@]} scope aliases. Assigning all..."

ASSIGN_ACTION="${PORTAL_BASE}/group/control_panel/manage?p_p_id=${OAUTH_PORTLET}&p_p_lifecycle=1&_${OAUTH_PORTLET}_jakarta.portlet.action=%2Foauth2_provider%2Fassign_scopes&p_auth=${P_AUTH}"

# Build the curl data args — one --data-urlencode per alias.
SCOPE_ARGS=()
for alias in "${SCOPE_ALIASES[@]}"; do
	SCOPE_ARGS+=(--data-urlencode "_${OAUTH_PORTLET}_scopeAliases=${alias}")
done

curl --silent --cookie-jar "$JAR" --cookie "$JAR" --location --output /dev/null \
	--request POST "$ASSIGN_ACTION" \
	--data-urlencode "_${OAUTH_PORTLET}_oAuth2ApplicationId=${APP_ID}" \
	"${SCOPE_ARGS[@]}"

echo "OAuth2 application '${APP_NAME}' (clientId=${APP_CLIENT_ID}, internal id=${APP_ID}) created with ${#SCOPE_ALIASES[@]} scopes."
```

## JWT Size Warning

The application holds every scope. A token request without a `scope` value therefore returns a JWT with every scope alias in it. That JWT is normally larger than the default `maxHttpHeaderSize` value of Tomcat, which is 8 KB. **Request only the scopes that you need:**

```bash
TOKEN=$(curl \
	--data "client_id=local-dev" \
	--data "client_secret=local-dev-secret" \
	--data "grant_type=client_credentials" \
	--data "scope=Liferay.Headless.Admin.User.everything" \
	--silent \
	--url "http://localhost:8080/o/oauth2/token" \
| jq -r .access_token)
```

A request without `scope=` puts every granted alias in the JWT. Tomcat then answers the first API call with HTTP 400.

## Gotchas

- **`clientAuthenticationMethod=client_secret_post`** — the "Client Secret Basic or Post" item in the UI list has this value.
- **`clientProfile=4`** = Headless Server. Other profile values from `ClientProfile.java`: 0=Web, 1=Native, 2=User Agent, 3=Other.
- **The script sends two POST requests** to install a known client secret. The first POST request carries `oAuth2ApplicationId=0` and creates the application. That request generates a new `clientSecret` value and ignores the submitted value. Headless Server is a confidential client profile, and `UpdateOAuth2ApplicationMVCActionCommand` always generates a new secret on the first save. The second POST request carries the new `oAuth2ApplicationId` and installs the known value.
- **The `scopeAliases` field repeats.** It is not a comma separated list. Send one `--data-urlencode` argument for each alias. The server splits each value on the space character, so a value with more than one alias in it also works. The checkbox values have this form.
- **The scope discovery needs `navigation=assign_scopes`** in the render URL. Without that parameter, `edit_application.jsp` shows the credentials view and renders no scope checkbox.
- **The script filters the scopes by the description text, not by the alias name.** The script splits the page into `<li class="list-group-item ...">` blocks. The script keeps an alias only when its `<label>` holds **both** "create/update/delete data on your behalf" and "read data on your behalf". This filter selects the `.everything` scope for each resource. It skips the `.write` scope and the `.read` scope, because the `.everything` scope covers them. It also skips the analytics reads, the personal profile reads, the document downloads, and the entries with no label, for example `COMMERCE_DEFAULT`.
- **The `p_auth` value of an action URL is the global `Liferay.authToken` value of the page. It is not a `p_auth=` query parameter.** The control panel renders one `p_p_auth=` *render* token for each portlet on its navigation links. A search for `p_auth=` matches those tokens. An action POST request with such a token fails the CSRF check, and the server answers HTTP 403. Read the `authToken: '<value>'` JavaScript variable instead. That value belongs to the authenticated session. Read it one time after the login. Use the same value for every later POST request.
- **The search for the id of the new application reads one table row.** The list page holds an `oAuth2ApplicationId=N` URL for every application. The Python function reads only the `<tr>` element that holds `APP_CLIENT_ID`.
- **The password reset page and the terms of service page** — a new portal does not show these two pages. A later Liferay version can show them again. The script then stops with the message "Login failed — no ID cookie in jar". Use `chrome-devtools` for that one login. Then run this script again.

Read these three source files to confirm a field name:

- `modules/apps/oauth2-provider/oauth2-provider-web/src/main/java/com/liferay/oauth2/provider/web/internal/portlet/action/UpdateOAuth2ApplicationMVCActionCommand.java`
- `modules/apps/oauth2-provider/oauth2-provider-web/src/main/java/com/liferay/oauth2/provider/web/internal/portlet/action/AssignScopesMVCActionCommand.java`
- `modules/apps/oauth2-provider/oauth2-provider-api/src/main/java/com/liferay/oauth2/provider/constants/ClientProfile.java`

## Verify

Test the complete flow with a scoped token request:

```bash
TOKEN=$(curl \
	--data "client_id=local-dev" \
	--data "client_secret=local-dev-secret" \
	--data "grant_type=client_credentials" \
	--data "scope=Liferay.Headless.Admin.User.everything" \
	--silent \
	--url "http://localhost:8080/o/oauth2/token" \
| jq -r .access_token)

echo "Token length: ${#TOKEN}"

curl \
	--header "Authorization: Bearer ${TOKEN}" \
	--silent \
	--write-out "\nHTTP: %{http_code}\n" \
	--url "http://localhost:8080/o/headless-admin-user/v1.0/user-accounts?pageSize=1" \
| head -c 400
```

A correct result has a token length below 2000 characters. It has `HTTP: 200`. It has a JSON body with an `items` field and a `totalCount` field. A result of `HTTP: 400` with an HTML body means that the JWT is larger than the `maxHttpHeaderSize` value of Tomcat. Add `scope=` to the token request.