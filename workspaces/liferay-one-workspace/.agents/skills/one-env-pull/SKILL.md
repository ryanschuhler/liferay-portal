---

allowed-tools: [Bash, Read]
description: Pull the workspace secrets from the 1Password secure note ".env [Liferay One Workspace]" and write them to the local .env file, backing up the previous copy first.
name: one-env-pull

---

# Pull Liferay One Workspace .env from 1Password

Run the commands from `workspaces/liferay-one-workspace/`.

A 1Password **secure note** named `.env [Liferay One Workspace]` holds the workspace secrets. The body of the note is an exact `.env` file, and it holds the `LIFERAY_ONE_*` keys. The `liferay-one-etc-spring-boot` client extension reads these keys through `docker-compose.yaml`. This skill copies the note into the local `.env` file, and the copy replaces the current content of that file.

Git ignores the local `.env` file, so the file never reaches version control.

## 1. Confirm 1Password Access

Install the 1Password CLI. Sign in to the `liferayinc.1password.com` account.

```bash
op account list
```

Sign in again when the command lists no account. Sign in again also when a later step reports an authentication error. Then run that step again:

```bash
eval "$(op signin)"
```

## 2. Fetch the Note and Update `.env`

Data loss. A write of an empty value to `.env` deletes the local secrets. Fetch the body of the note into a variable. Confirm that the variable is not empty. Copy the current `.env` file to `.env.bak`. Then write the new `.env` file.

```bash
note="$(
	op item get ".env [Liferay One Workspace]" --format json |
		jq -r '.fields[] | select(.purpose == "NOTES" or .id == "notesPlain") | .value'
)"

if [ -z "${note}" ]; then
	echo "Unable to read the secure note '.env [Liferay One Workspace]'. Confirm the note exists and op is signed in."
	exit 1
fi

[ -f .env ] && cp .env .env.bak

printf '%s\n' "${note}" > .env

echo "Wrote $(grep -c '=' .env) entries to .env (previous copy saved to .env.bak)."
```

More than one vault holds a note with this title when `op item get` reports more than one match. Add `--vault "<Vault Name>"` to the command.

## 3. Apply the Changes

The Spring Boot container reads `.env` only when Docker creates the container. Create the container again, so that it reads the new values:

```bash
docker compose up -d liferay-one-etc-spring-boot
```

## Notes

- This skill **only reads**. Edit the secure note in the 1Password app to publish a local change. Keep the body of the note in exact `.env` syntax. Write one `KEY=VALUE` pair per line. Write a JSON value, such as the key for the GCS service account, on one line and without quotation marks.
- A key that the note does not hold takes the `=unused` default value. The `buildDockerImage` task writes these default values to `build/local.env`. The file `docker-compose.yaml` loads `build/local.env` before `.env`.