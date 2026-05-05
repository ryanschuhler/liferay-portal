#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

WORKSPACE_DIR="${SCRIPT_DIR}/.."

function main {
	local product

	product="$("${SCRIPT_DIR}/get_property.sh" liferay.workspace.product)"

	local image_name="liferay-sample-workspace-liferay"
	local version_tag="${product#dxp-}"

	echo "==> Extracting license..."
	bash "${SCRIPT_DIR}/extract_license.sh"

	echo "==> Extracting hotfix..."
	bash "${SCRIPT_DIR}/extract_hotfix.sh"

	echo "==> Building Docker image..."
	"${WORKSPACE_DIR}/gradlew" --project-dir "${WORKSPACE_DIR}" buildDockerImage

	echo "==> Tagging image as :local (${image_name}:${version_tag} -> ${image_name}:local)..."
	docker tag "${image_name}:${version_tag}" "${image_name}:local"

	echo "==> Starting containers..."
	docker compose --file "${WORKSPACE_DIR}/docker-compose.yaml" up --detach

	echo "==> Waiting for Liferay to be healthy..."
	until curl --fail --max-time 5 --output /dev/null --silent "http://localhost:8080/c/portal/status"
	do
		printf '.'
		sleep 10
	done

	echo "==> Deploying artifacts to Liferay container..."
	bash "${SCRIPT_DIR}/deploy_client_extensions.sh"

	echo "==> Done. Liferay is running at http://localhost:8080"
}

main "${@}"