#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

function main {
	local project_name

	project_name="$(basename "$(cd "${SCRIPT_DIR}/../.." && pwd)")"

	local container="${project_name}-liferay"
	local routes_base="/opt/liferay/routes/default"

	local site_initializer

	site_initializer="$(docker exec "${container}" ls "${routes_base}" | head --lines=1)"

	local routes="${routes_base}/${site_initializer}"

	local client_id

	client_id="$(docker exec "${container}" cat "${routes}/${site_initializer}-oahs.oauth2.headless.server.client.id")"

	local client_secret

	client_secret="$(docker exec "${container}" cat "${routes}/${site_initializer}-oahs.oauth2.headless.server.client.secret")"

	local env_file="${SCRIPT_DIR}/../.env"

	sed --in-place "s|^OAUTH_CLIENT_ID=.*|OAUTH_CLIENT_ID=${client_id}|" "${env_file}"
	sed --in-place "s|^OAUTH_CLIENT_SECRET=.*|OAUTH_CLIENT_SECRET=${client_secret}|" "${env_file}"

	echo "OAuth credentials written to .env"
}

main "${@}"