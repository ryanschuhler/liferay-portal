---

allowed-tools: [Bash, Glob, Grep, Read]
description: Reset just the "One" site in the running local Liferay — tear down seeded records, delete the site, redeploy the site initializer, and reseed. Use when only the site content or seeded data is stale.
name: one-site-reset

---

# Reset the One Site

Run the commands from `workspaces/liferay-one-workspace/`.

This reset is the smallest of the three resets. It changes no Docker container,
no database, and no other client extension, so it is faster than
`/one-instance-reset` and faster than `/one-env-reset`. It keeps the local-dev
OAuth2 application. Use this reset when only the pages of the site, the content
of the site, or the seeded records are wrong. Do not use it when the object
definitions, the roles, or the taxonomies need a change. The batch client
extension owns those three.

## Prerequisite

The Liferay containers must run before this reset. The `docker ps` command shows
a healthy `liferay` container. Start the containers with `/one-env-up` when they
do not run.

## Run

Data loss. This reset deletes the `One` site and the seeded records. Run it only
when you want to build the site and the records again.

```bash
scripts/seed/site_reset.sh
```

The script sets basic authentication against localhost. The script then does
these five steps:

1. It deletes the seeded records with `scripts/seed/teardown_records.sh`.

1. It deletes the `One` site group through the JSONWS bridge.

1. It deploys only the `liferay-one-site-initializer` client extension again.
   That client extension creates the site again and initializes it. The script
   waits for the `Initialized One for group` log message.

1. It seeds the data again with `scripts/seed.sh`.

1. It binds the `one.localhost` virtual host again with
   `scripts/bootstrap/set_virtual_hosts.sh`.

The script ends with the message `Done. The One site has been reset.`

## When To Reach For A Heavier Reset

- The object definitions, the relationships, the roles, or the taxonomies
  changed → the batch client extension owns these, so use
  `/one-instance-reset`.
- The database is corrupt, the image or the bundle changed, or the instance is
  broken → use `/one-env-reset`.