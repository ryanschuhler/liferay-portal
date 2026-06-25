/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import os from 'node:os';
import path from 'node:path';

import {logger} from './logger.js';

function optional(name: string, fallback: string): string {
	const value = process.env[name];

	return value === undefined || value === '' ? fallback : value;
}

function required(name: string): string {
	const value = process.env[name];

	if (value === undefined || value === '') {
		throw new Error(`Missing required environment variable ${name}`);
	}

	return value;
}

const clientExtensionDeployOrder = [
	'liferay-one-global-css',
	'liferay-one-instance-settings',
	'liferay-one-custom-element',
	'liferay-one-batch',
	'liferay-one-etc-spring-boot',
	'liferay-one-site-initializer',
	'liferay-one-ci',
];

export const config = {

	// Per-deploy retry for transient Liferay Cloud API spikes (deploying many
	// extensions at once can fail even when they are valid).

	attempts: Number(optional('DEPLOY_ATTEMPTS', '3')),

	// The client-extension.<profile>.yaml profile to build (e.g. "uat" applies
	// client-extension.uat.yaml over the base via `-PprofileName=uat`).

	buildProfile: optional('BUILD_PROFILE', 'uat'),

	clientExtensionDeployOrder,

	// The branch the deployer watches. Pushes to any other branch are ignored.

	deployBranch: optional('DEPLOY_BRANCH', 'uat'),

	// The shared secret used to verify the GitHub webhook HMAC signature.

	githubWebhookSecret: required('GITHUB_WEBHOOK_SECRET'),

	// The Liferay Cloud environment and project the built extensions deploy to.

	lcpEnvironment: optional('LCP_ENVIRONMENT', 'uat'),

	// The infrastructure host for the remote in ~/.lcp.

	lcpInfrastructure: optional('LCP_INFRASTRUCTURE', 'liferay.cloud'),

	// The project master token, auto-injected by the platform. This is the same
	// project-scoped service identity the Liferay Jenkins CI service uses to
	// deploy — not a personal login, and it does not expire on logout.

	lcpProject: required('LCP_PROJECT'),

	lcpProjectMasterToken: optional('LCP_PROJECT_MASTER_TOKEN', ''),

	// The remote name in ~/.lcp (the CLI's default_remote).

	lcpRemote: optional('LCP_REMOTE', 'lcp'),

	port: Number(optional('PORT', '3001')),
	readyPath: '/ready',

	retryDelayMs: Number(optional('DEPLOY_RETRY_DELAY_MS', '5000')),

	// The Git URL of the source repository the deployer builds.

	repoUrl: required('REPO_URL'),

	// Where the repository is cloned inside the container.

	workDir: optional('WORK_DIR', path.join(os.tmpdir(), 'liferay-one-ci-src')),

	// Path to the workspace within the repository. "." for a standalone repo,
	// or e.g. "workspaces/liferay-one-workspace" for the monorepo layout.

	workspaceSubdir: optional('WORKSPACE_SUBDIR', '.'),
};

export const workspaceDir = path.join(config.workDir, config.workspaceSubdir);

export function warnIncompleteConfig(): void {
	if (!config.lcpProjectMasterToken) {
		logger.log(
			'LCP_PROJECT_MASTER_TOKEN is unset; lcp deploy will not ' +
				'authenticate (it is normally auto-injected by the platform)'
		);
	}
}

export const lcpConfigPath = path.join(os.homedir(), '.lcp');
