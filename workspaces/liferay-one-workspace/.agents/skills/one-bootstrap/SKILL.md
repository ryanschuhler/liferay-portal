---

allowed-tools: [Bash, Glob, Grep, Read]
description: Bootstrap or rebuild the local Liferay Docker environment for the liferay-one-workspace. Use when the user asks to bootstrap, start, rebuild, or reset the local Liferay container.
name: one-bootstrap

---

# Bootstrap Liferay One Workspace

Manage the local Liferay Docker environment with `scripts/bootstrap.sh`. Run the script from `workspaces/liferay-one-workspace/`.

The `up` command also builds the `liferay-one-etc-spring-boot:local` image. The `liferay-one-etc-spring-boot` client extension then starts as a Docker Compose service with the portal and the database. You do not start it separately.

## Commands

| Command | What it does |
|---------|-------------|
| `up` (default) | Extract hotfix/license → build image → tag → build `liferay-one-etc-spring-boot:local` image → `docker compose up` → wait for health → deploy client extensions |
| `start` | `docker compose start` |
| `stop` | `docker compose stop` |
| `down` | `docker compose down` |
| `clean` | `docker compose down --volumes` |

## Usage

Data loss. The `clean` command deletes every volume, and the database records go with them. Run `clean` only when you want an empty database.

```bash
# Full bootstrap (first run or after image/config changes)
scripts/bootstrap.sh up

# Day-to-day start/stop
scripts/bootstrap.sh start
scripts/bootstrap.sh stop

# Tear down (keep volumes)
scripts/bootstrap.sh down

# Full reset — wipes all volumes
scripts/bootstrap.sh clean
```

Liferay is ready when `up` prints `Done. Liferay is running at http://localhost:8080.`