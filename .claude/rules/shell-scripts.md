---

paths:
  - "**/*.sh"

---

# Shell Script Style

All shell scripts follow the conventions established in the `liferay-docker` repository.

## File Names

Use underscores, not hyphens:

```diff
-extract-hotfix.sh
+extract_hotfix.sh
```

## Structure

- First line is always `#!/bin/bash` with no trailing comment.
- Source dependencies immediately after the shebang with no blank line between them.
- Every script must have a `main` function.
- Define all helper functions before `main`.
- Define `main` last.
- Invoke `main` with `main "${@}"` as the final line of the script.

## Naming

- Global and script-level variables: `SCREAMING_SNAKE_CASE`.
- Local (function-scoped) variables: `lowercase_snake_case`, always declared with `local`.
- Functions: `lowercase_snake_case`.
- Internal/private functions: prefixed with `_` (e.g., `_init`).
- Module-namespaced functions use a short prefix (e.g., `lc_log` for liferay-common).

## Indentation

Use 4 spaces per level. No tabs.

## Variables

Always declare function-scoped variables with `local`:

```bash
function download {
    local file_name="${1}"
    local file_url="${2}"
```

Always use `${braces}` around variable names:

```diff
-curl --output $dest_file "$url"
+curl --output "${dest_file}" "${url}"
```

Always double-quote variable expansions and command substitutions:

```diff
-VALUE=$(get_value)
+VALUE="$(get_value)"

-ROUTES_BASE=/opt/liferay/routes/default
+ROUTES_BASE="/opt/liferay/routes/default"
```

## Functions

Use the `function` keyword, not the `name()` form:

```diff
-read_property() {
+function read_property {
```

## Conditionals

Place `then` on its own line, never inline:

```diff
-if [ -f "${file}" ]; then
+if [ -f "${file}" ]
+then
```

Prefer `[ ]` (single bracket) for simple tests. Use `[[ ]]` for regex matching (`=~`) and glob pattern matching (`==` with `*`).

Always space around operators inside brackets: `[ "${?}" -ne 0 ]`.

Multi-line conditions: place `&&` / `||` operators at the end of each line and align continuation lines under the first condition:

```bash
if [ -e "${file_name}" ] &&
   [[ "${file_url}" != */apache-tomcat/* ]] &&
   [[ "${file_url}" != */nightly/* ]]
then
    return
fi
```

## Loops

Place `do` on its own line, never inline:

```diff
-for item in "${list[@]}"; do
+for item in "${list[@]}"
+do

-while [ "${count}" -gt 0 ]; do
+while [ "${count}" -gt 0 ]
+do
```

Example of a complete loop:

```bash
for util in "${@}"
do
    if (! command -v "${util}" &>/dev/null)
    then
        echo "The utility ${util} is not installed."

        exit 1
    fi
done
```

## Redirections

Use a space before `>` and `>>` in simple redirections. No space in combined forms (`&>`, `2>&1`):

```bash
docker buildx inspect > /dev/null 2>&1
command &>/dev/null
output >> "${log_file}"
```

## CLI Flags

Always use long-form flags:

```diff
-mkdir -p "${dir}"
+mkdir --parents "${dir}"

-cp -R "${src}"/* "${dest}"
+cp --recursive "${src}"/* "${dest}"

-rm -rf "${dir}"
+rm --force --recursive "${dir}"

-sed -i "s|foo|bar|" "${file}"
+sed --in-place "s|foo|bar|" "${file}"

-curl -f -L -o "${dest}" "${url}"
+curl --fail --location --output "${dest}" "${url}"

-curl -s -X POST
+curl --silent --request POST

-grep -o -P "${pattern}"
+grep --only-matching --perl-regexp "${pattern}"

-grep -c -w "${word}"
+grep --count --word-regexp "${word}"

-cut -d'.' -f1,2
+cut --delimiter='.' --fields=1,2

-sort -V
+sort --version-sort

-tail -n 1
+tail --lines=1

-tee -a "${log}"
+tee --append "${log}"

-tr -d '\n'
+tr --delete '\n'

-wc -l
+wc --lines
```

## Multi-Line Commands

When a command has more than two flags or its arguments make it long, break each flag onto its own line with 8-space (two-level) indentation. Use a backslash continuation. Closing `)` or end of command returns to 4-space:

```bash
local curl_response=$(
    curl \
        "https://api.example.com/${endpoint}" \
        --data "${payload}" \
        --fail \
        --header "Accept: application/json" \
        --max-time 10 \
        --request POST \
        --retry 3 \
        --silent)
```

Pipelines that span multiple lines break after `|` with a backslash:

```bash
echo "${product_version_list_html}" | \
    grep \
        --only-matching \
        --perl-regexp \
        "${product_version_regex}" | \
    sort --version-sort | \
    tail --lines=1
```

## Error Handling

Check the exit status of commands explicitly where needed:

```bash
if [ "${?}" -ne 0 ]
then
    echo "Command failed."
    exit 1
fi
```

Use `PIPESTATUS[0]` to check the exit status of the first command in a pipeline:

```bash
some_command | tee log.txt

if [ "${PIPESTATUS[0]}" -gt 0 ]
then
    exit 1
fi
```

Use `trap` for cleanup on exit:

```bash
trap 'rm --force "${TEMP_FILE}"' EXIT ERR SIGINT SIGTERM
```

## Arrays

Declare arrays explicitly before use and append with `+=`:

```bash
TAGS=()
TAGS+=("${repo}/${name}:${version}")
TAGS+=("${repo}/${name}:latest")
```

Declare associative arrays with `declare -A`:

```bash
declare -A BACKGROUND_PIDS
```

Iterate over associative array keys with `"${!array[@]}"`:

```bash
for pid in "${!BACKGROUND_PIDS[@]}"
do
    wait "${pid}"
done
```

## Arithmetic

Use `$(( ))` for arithmetic expansion:

```bash
counter=$((counter + 1))

if [ $((index % 2)) -ne 0 ]
then
    ...
fi
```

## Sourcing

Use `source` (not `.`) to load other scripts. Use `./` for files in the same directory:

```bash
source ./_common.sh
source ./_liferay_common.sh
```

When a script may be sourced from a different working directory, use `BASH_SOURCE` to resolve the path:

```bash
source "$(dirname "${BASH_SOURCE[0]}")/_liferay_common.sh"
```

## Comments

Use the block style for section headers:

```bash
#
# Description of what follows.
#
```

Inline comments are for non-obvious constraints only — not restatements of the code.

## Blank Lines

- One blank line between statements in a function to separate logical sub-steps.
- One blank line between function definitions.
- Use `echo ""` to print a blank line in output — never `echo` with no arguments.
- Separate dependent variable declarations with a blank line to make the dependency visible:

```diff
-SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
-WORKSPACE_DIR="${SCRIPT_DIR}/.."
+SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
+
+WORKSPACE_DIR="${SCRIPT_DIR}/.."
```

Independent variables that do not reference each other can be grouped without blank lines.