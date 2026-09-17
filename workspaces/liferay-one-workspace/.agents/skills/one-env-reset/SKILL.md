---

allowed-tools: [Bash, Glob, Grep, Read]
description: Fully reset the local Liferay Docker environment — tears down all containers and volumes, then bootstraps a fresh environment from scratch.
name: one-env-reset

---

# Reset Liferay One Environment

Run the commands from `workspaces/liferay-one-workspace/`.

Data loss. This reset deletes every container and every volume, and the database records go with them. Use this reset to repair a broken environment. Use it also after a schema change that needs an empty database.

## 1. Bootstrap with Reset

Run `scripts/bootstrap.sh --reset`. The `--reset` flag first deletes every container and every volume. The script then builds the Docker image. The script tags the image. The script starts the containers. The script waits until Liferay is healthy. The script then deploys the client extensions.

```bash
scripts/bootstrap.sh --reset
```

Liferay is ready when it prints `Done. Liferay is running at http://localhost:8080.`

## 2. Recreate Auth App

The deletion of the volumes in step 1 destroys every OAuth2 application. Run `/one-oauth-app` after the bootstrap ends. That skill creates the local-dev OAuth2 application again.