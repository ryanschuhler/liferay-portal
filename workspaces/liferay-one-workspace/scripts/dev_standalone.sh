#!/bin/bash

# Runs the custom element against the mock Liferay server and the Spring Boot
# client extension, with no real Liferay. See mock-liferay/README.md.

set -o errexit
set -o nounset
set -o pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

readonly COMPOSE_FILE="docker-compose.standalone.yaml"

function main {
	if docker ps --format '{{.Names}}' | grep --quiet '^liferay$'
	then
		echo "The full Liferay stack is running and holds ports 8080/58081."
		echo "Stop it first (for example: docker compose down), then rerun."

		exit 1
	fi

	if ! docker image inspect liferay-one-etc-spring-boot:latest >/dev/null 2>&1
	then
		echo "Building the Spring Boot image (one time)."

		./gradlew :client-extensions:liferay-one-etc-spring-boot:buildDockerImage
	fi

	echo "Starting the mock Liferay server and Spring Boot client extension."

	docker compose -f "${COMPOSE_FILE}" up --build --detach

	_wait_for "mock Liferay" "http://localhost:8080/c/portal/status"
	_wait_for "Spring Boot" "http://localhost:58081/ready"

	echo "Starting Vite (custom element) at http://localhost:5173"

	cd client-extensions/liferay-one-custom-element

	VITE_MOCK_LIFERAY=true yarn dev
}

function _wait_for {
	local label="${1}"
	local url="${2}"

	echo "Waiting for ${label} (${url})"

	for _ in $(seq 1 60)
	do
		if curl --fail --silent --output /dev/null "${url}"
		then
			echo "${label} is ready."

			return 0
		fi

		sleep 2
	done

	echo "Timed out waiting for ${label}."

	exit 1
}

main "${@}"
