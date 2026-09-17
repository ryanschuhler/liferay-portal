---

allowed-tools: [Bash, Glob, Grep, Read]
description: Reset the Liferay virtual instance's data in place — tear down records and structure, delete the One site, redeploy the batch and site-initializer client extensions, and reseed. No Docker, database, or server restart.
name: one-instance-reset

---

# Reset the Liferay One Instance Data

Run the commands from `workspaces/liferay-one-workspace/`.

This reset is the middle tier of the three resets. It builds the data of the
virtual instance again through the Liferay APIs and through client extension
deployments. It changes no Docker container, no database, and no server process.
Use this reset when the structure that `/one-site-reset` keeps in place needs a
rebuild. The image and the bundle must still be correct. That structure is the
object definitions, the relationships, the commerce configuration, the roles,
and the taxonomies. Use `/one-env-reset` in place of this reset when the image,
the hotfix, the license, or the Dockerfile changed.

## Why Not "Create A New Instance, Delete The Old One"

That procedure is not possible for the default virtual instance. Liferay defines
the default instance as the company with a `webId` value that matches the
`company.default.web.id` property. Liferay refuses to delete that company and
throws a `RequiredCompanyException`. Liferay gives no way to move the default to
another company while the server runs, because a move needs a property change
and a restart. This reset therefore clears the data of the default company in
place, and the server does not restart.

## Prerequisite

The Liferay containers must run before this reset. The `docker ps` command shows
a healthy `liferay` container. Start the containers with `/one-env-up` when they
do not run.

## Run

Data loss. This reset deletes the seeded records, the object definitions, the
relationships, the commerce configuration, the roles, the taxonomies, and the
`One` site. Run it only when you want to build all of this data again.

```bash
scripts/seed/instance_reset.sh
```

The script sets basic authentication against localhost. The script then does
these six steps:

1. It deletes the seeded records and the structure with
   `scripts/seed/teardown.sh --full`. This step deletes the records, the object
   definitions, the relationships, the commerce configuration, the roles, the
   taxonomies, and the list type definitions.

1. It deletes the `One` site group through the JSONWS bridge.

1. It deploys the `liferay-one-batch` client extension again. It waits for the
   end of the batch engine imports. These imports build the object definitions
   and the reference data again.

1. It deploys the `liferay-one-site-initializer` client extension again. It
   waits for the `Initialized One for group` log message. This step creates the
   site again.

1. It seeds the data again with `scripts/seed.sh`.

1. It binds the `one.localhost` virtual host again with
   `scripts/bootstrap/set_virtual_hosts.sh`.

The script ends with the message `Done. The Liferay instance data has been reset.`

The local-dev OAuth2 application belongs to the company, and this reset does not
change it. You do not create it again.

## Choosing A Reset Tier

- Only the site content or the seeded records are stale → `/one-site-reset`.
- The object definitions, the roles, or the taxonomies need a rebuild → this
  reset.
- The image, the bundle, or the database is broken → `/one-env-reset`.