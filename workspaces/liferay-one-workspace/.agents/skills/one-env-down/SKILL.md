---

allowed-tools: [Bash]
description: Stop the local Liferay Docker containers while keeping volumes intact.
name: one-env-down

---

# Stop Liferay One Environment

Run the command from `workspaces/liferay-one-workspace/`.

The command stops the three containers: the portal, the database, and the `liferay-one-etc-spring-boot` client extension. The command keeps the volumes, so the next `/one-env-up` starts from the same data.

```bash
docker compose stop
```