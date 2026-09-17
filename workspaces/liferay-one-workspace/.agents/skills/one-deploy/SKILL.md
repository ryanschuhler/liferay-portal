---

allowed-tools: [Bash, Glob, Grep, Read]
description: Deploy `liferay-one-*` client extensions to the devcontainer Liferay. Use when the user asks to deploy, run /deploy, or wants to push client extension changes.
name: one-deploy

---

# Deploy One Workspace Client Extensions

Deploy the `liferay-one-*` client extensions to the Liferay Docker Compose setup. This workspace is SaaS only. Do not run `ant deploy`. Do not change the portal core.

## 1. Pre-flight

```bash
./gradlew formatSource build
```

Stop when either step fails. Report the failure. Do not deploy a build that fails.

## 2. Resolve Target

Valid targets: `liferay-one-custom-element`, `liferay-one-etc-spring-boot`, `liferay-one-global-css`, `liferay-one-instance-settings`, `liferay-one-site-initializer`, `all`.

Run `git diff --name-only`. Pick every changed `client-extensions/liferay-one-*` directory. Ask the user to confirm the targets when the diff changes more than one directory.

## 3. Deploy

```bash
# Single
./gradlew :client-extensions:<name>:clean :client-extensions:<name>:deploy \
    -Ddeploy.docker.container.id=$(docker ps --filter "name=^liferay$" --quiet)

# All
./gradlew clean deploy \
    -Ddeploy.docker.container.id=$(docker ps --filter "name=^liferay$" --quiet)
```

The `deploy` task builds the zip file for each client extension. The task copies each zip file into the running `liferay` container. The other client extensions deploy from that directory while the portal runs. The `liferay-one-etc-spring-boot` client extension runs as its own Compose service from the `liferay-one-etc-spring-boot:latest` image. The `deploy` task does not build that image again. The `deploy` task does not restart that container. The running application continues to serve the old code. Rebuild the image when `liferay-one-etc-spring-boot` is one of the deploy targets. Then create the container again. The running application then serves the new code:

```bash
./gradlew :client-extensions:liferay-one-etc-spring-boot:buildDockerImage
docker compose up --detach --force-recreate liferay-one-etc-spring-boot
```

The `buildDockerImage` task also writes `build/local.env` again. Each `${...}` placeholder in `application-default.properties` becomes `VAR=unused`. The same task therefore restores a `build/local.env` file that an earlier `gradlew clean` deleted.

Set the real integration values in the root `.env.local` file. Set a feature switch, such as the switch for the Salesforce object subscriber, in the same file. Git ignores `.env.local`, and the container reads it after `build/local.env`, so the values in `.env.local` replace the values in `build/local.env`. The values then survive each rebuild. Do not edit `build/local.env` directly. Create the container again after each change.

Report the client extensions that you deployed. Report the Gradle result. Report the log lines that show that Liferay loaded each client extension.