---

allowed-tools: [Bash, Glob, Grep, Read]
description: Start the local Liferay Docker environment. On first run, bootstraps from scratch (builds image, starts containers, deploys client extensions). On subsequent runs, starts existing containers.
name: one-env-up

---

# Start Liferay One Environment

Run the commands from `workspaces/liferay-one-workspace/`.

## 1. Detect First Run

Check for the `liferay:local` Docker image:

```bash
docker image inspect liferay:local &>/dev/null
```

- **Not found** → this is the first run. Go to step 2.
- **Found** → this is a day-to-day start. Go to step 3.

## 2. First Run (Bootstrap)

Run `scripts/bootstrap.sh`. The script builds the Docker images for the portal and for every client extension, `liferay-one-etc-spring-boot` included. The script tags the portal image as `liferay:local`. The script starts the containers. The script waits until Liferay is healthy. The script then deploys the client extensions.

```bash
scripts/bootstrap.sh
```

Liferay is ready when it prints `Done. Liferay is running at http://localhost:8080.`

## 3. Day-to-Day Start

The `liferay-one-etc-spring-boot` service reads its environment from `client-extensions/liferay-one-etc-spring-boot/build/local.env`. The `buildDockerImage` task writes that file. A manual `gradlew clean` deletes the file. Write the file again when it is absent, before you start the containers:

```bash
[ -f client-extensions/liferay-one-etc-spring-boot/build/local.env ] || ./gradlew :client-extensions:liferay-one-etc-spring-boot:buildDockerImage --rerun-tasks
```

Start the existing containers in the background. The command starts the portal, the database, and the `liferay-one-etc-spring-boot` client extension together:

```bash
docker compose up --detach
```

Wait until `http://localhost:8080/c/portal/status` returns HTTP 200. Then confirm that the client extension answers on port 58081:

```bash
curl --fail --silent http://localhost:58081/ready
```

Report success when both URLs answer.