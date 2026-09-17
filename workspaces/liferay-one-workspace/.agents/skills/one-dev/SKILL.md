---

allowed-tools: [Bash, Glob, Grep, Read]
description: Start a live Vite dev server for a `liferay-one-*` custom element and point the running Liferay at it for hot-module reload. Use when the user asks to run dev mode, start Vite, get HMR, or invokes /one-dev.
name: one-dev

---

# Live Vite Dev for One Workspace Custom Elements

Run a custom element from the Vite dev server in place of the built static assets. The browser then reloads each source edit, and you do not deploy the client extension again. This procedure is the same as `gradlew deployDev` in `liferay-customer-workspace`.

The workspace Gradle plugin reads each `client-extension.<profile>.yaml` file. The plugin matches the file name against the regular expression `^client-extension\.([a-z]+)\.yaml$`. For each match, the plugin generates a `deploy<Profile>` task. The file `client-extension.dev.yaml` therefore gives a `deployDev` task. That task sets the `urls` values to the Vite dev server (`http://localhost:5173/...`) in place of the bundled `*.js` files. The browser then loads the modules and the HMR client from Vite.

Run every command from `workspaces/liferay-one-workspace/`.

## 1. Resolve Target

A valid target is a `liferay-one-*` client extension with a `client-extension.dev.yaml` file. One client extension meets this condition today: `liferay-one-custom-element`. Confirm that the file exists:

```bash
ls client-extensions/liferay-one-custom-element/client-extension.dev.yaml
```

Read the port in the `urls` host of the dev yaml file, for example `http://localhost:5173`. Bind Vite to that exact port. The deployed client extension holds that port value.

## 2. Pre-flight

Liferay must run before this step. Confirm the container and the HTTP port:

```bash
docker ps --filter "name=^liferay$" --quiet
curl --fail --silent --output /dev/null http://localhost:8080/c/portal/status && echo ready
```

Start the environment with `/one-env-up` when either command fails.

Install the dependencies. The workspace is one yarn workspace, and yarn holds `node_modules` at the workspace root:

```bash
[ -x client-extensions/liferay-one-custom-element/node_modules/.bin/vite ] || yarn install
```

## 3. Start the Vite Dev Server

Start Vite in the background, on the port that the dev yaml file names. The `--strictPort` flag makes Vite stop with an error. Without that flag, Vite moves to port 5174, and the deployed client extension then points at a port with no server:

```bash
(cd client-extensions/liferay-one-custom-element && yarn dev --port 5173 --strictPort)
```

Run this command with `run_in_background`. Then wait until Vite answers:

```bash
curl --fail --silent --output /dev/null http://localhost:5173/@vite/client && echo "vite up"
```

Vite serves the Liferay page from another origin. Vite 4 enables CORS by default. The file `vite.config.ts` sets `server.origin`, so the HMR websocket connects.

## 4. Deploy the Dev Profile

Deploy the client extension with the dev yaml overlay into the running container:

```bash
./gradlew :client-extensions:liferay-one-custom-element:deployDev \
    -Ddeploy.docker.container.id=$(docker ps --filter "name=^liferay$" --quiet)
```

## 5. Verify

Confirm that Liferay registered the client extension again. Read the container log for the LPKG line and for the client extension line:

```bash
docker logs --tail 50 $(docker ps --filter "name=^liferay$" --quiet) 2>&1 | grep -i "liferay-one-custom-element\|client extension"
```

Then open a page with the custom element in the browser. Confirm in the Network panel of DevTools that the module requests go to `http://localhost:5173/src/main.tsx`. The browser now reloads each file that you edit under `client-extensions/liferay-one-custom-element/src`.

## 6. Return to Production Assets

The client extension continues to point at `localhost:5173` until you deploy it again in the standard way. Stop the background Vite process at the end of the session. Then restore the bundled static assets with a standard deploy (`/one-deploy`):

```bash
./gradlew :client-extensions:liferay-one-custom-element:clean :client-extensions:liferay-one-custom-element:deploy \
    -Ddeploy.docker.container.id=$(docker ps --filter "name=^liferay$" --quiet)
```

Report the client extension in dev mode. Report the Vite URL. Report the deploy result. Report the log lines that show that Liferay loaded the client extension.