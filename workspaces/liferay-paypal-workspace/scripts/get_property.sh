#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

WORKSPACE_DIR="${SCRIPT_DIR}/.."

function read_property {
    local key="${1}"
    local file="${2}"

    if [ -f "${file}" ]
    then
        grep "^${key}=" "${file}" | cut --delimiter== --fields=2- | tr --delete '[:space:]'
    fi
}

function main {
    local key="${1:?Usage: get_property.sh <key>}"

    local value
    value="$(read_property "${key}" "${WORKSPACE_DIR}/gradle-local.properties")"

    if [ -z "${value}" ]
    then
        value="$(read_property "${key}" "${WORKSPACE_DIR}/gradle.properties")"
    fi

    if [ -z "${value}" ]
    then
        echo "Property '${key}' not found." >&2
        exit 1
    fi

    echo "${value}"
}

main "${@}"
