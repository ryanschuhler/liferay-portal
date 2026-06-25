/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {execa} from 'execa';
import fs from 'node:fs';
import path from 'node:path';
import PQueue from 'p-queue';

import {config, lcpConfigPath, workspaceDir} from './config.js';
import {logger} from './logger.js';

const queue = new PQueue({concurrency: 1});

type EnqueueResult = {position: number; status: 'coalesced' | 'queued'};

export function enqueueDeploy(reason: string): EnqueueResult {
	if (queue.size >= 1) {
		logger.log(`Coalescing deploy (${reason}); one is already queued`);

		return {position: queue.size + queue.pending, status: 'coalesced'};
	}

	const position = queue.size + queue.pending;

	logger.log(`Queued deploy (${reason}); ${position} ahead in queue`);

	queue
		.add(() => runPipeline(reason))
		.catch((error) => {
			logger.error(`Pipeline failed: ${messageOf(error)}`);
		});

	return {position, status: 'queued'};
}

async function runPipeline(reason: string): Promise<void> {
	logger.log(`=== Pipeline start (${reason}) ===`);

	configureLcpAuth();

	await ensureRepo();

	for (const name of config.clientExtensionDeployOrder) {
		await buildExtension(name);
		await deployExtension(name);
	}

	logger.log(`=== Pipeline done (${reason}) ===`);
}

function messageOf(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(
	label: string,
	fn: () => Promise<void>
): Promise<void> {
	for (let attempt = 1; ; attempt++) {
		try {
			await fn();

			return;
		}
		catch (error) {
			if (attempt >= config.attempts) {
				throw error;
			}

			logger.error(
				`${label} failed (attempt ${attempt}/${config.attempts}): ` +
					`${messageOf(error)}; retrying in ${config.retryDelayMs}ms`
			);

			await sleep(config.retryDelayMs);
		}
	}
}

async function run(
	label: string,
	file: string,
	args: string[],
	options: {cwd?: string; env?: Record<string, string>} = {}
): Promise<void> {
	logger.log(`> ${label}: ${file} ${args.join(' ')}`);

	await execa(file, args, {
		cwd: options.cwd,
		env: options.env,
		stdio: 'inherit',
	});
}

function configureLcpAuth(): void {
	if (!config.lcpProjectMasterToken) {
		logger.error(
			'LCP_PROJECT_MASTER_TOKEN is not set; cannot authenticate lcp. ' +
				'It is normally auto-injected into project services.'
		);

		return;
	}

	const contents =
		`default_remote = ${config.lcpRemote}\n\n` +
		`[remote "${config.lcpRemote}"]\n` +
		`    infrastructure = ${config.lcpInfrastructure}\n` +
		`    token          = ${config.lcpProjectMasterToken}\n`;

	fs.writeFileSync(lcpConfigPath, contents, {mode: 0o600});

	logger.log(`Wrote lcp credentials to ${lcpConfigPath}`);
}

async function ensureRepo(): Promise<void> {
	const gitDir = path.join(config.workDir, '.git');

	if (fs.existsSync(gitDir)) {
		logger.log(`Updating existing checkout at ${config.workDir}`);

		await run('git fetch', 'git', [
			'-C',
			config.workDir,
			'fetch',
			'--depth',
			'1',
			'origin',
			config.deployBranch,
		]);
		await run('git checkout', 'git', [
			'-C',
			config.workDir,
			'checkout',
			'-B',
			config.deployBranch,
			`origin/${config.deployBranch}`,
		]);
		await run('git reset', 'git', [
			'-C',
			config.workDir,
			'reset',
			'--hard',
			`origin/${config.deployBranch}`,
		]);

		return;
	}

	logger.log(`Cloning ${config.repoUrl} (${config.deployBranch})`);

	await run('git clone', 'git', [
		'clone',
		'--branch',
		config.deployBranch,
		'--depth',
		'1',
		config.repoUrl,
		config.workDir,
	]);
}

function extensionDirOf(name: string): string {
	return path.join(workspaceDir, 'client-extensions', name);
}

async function buildExtension(name: string): Promise<void> {
	const hasProfile = fs.existsSync(
		path.join(
			extensionDirOf(name),
			`client-extension.${config.buildProfile}.yaml`
		)
	);

	const profileArgs = hasProfile
		? [`-PprofileName=${config.buildProfile}`]
		: [];

	await run(
		`gradlew build ${name}`,
		'./gradlew',
		[
			`:client-extensions:${name}:clean`,
			`:client-extensions:${name}:build`,
			...profileArgs,
		],
		{cwd: workspaceDir}
	);
}

async function deployExtension(name: string): Promise<void> {
	const extensionDir = extensionDirOf(name);
	const zipPath = path.join(extensionDir, 'dist', `${name}.zip`);

	if (!fs.existsSync(zipPath)) {
		throw new Error(`Built artifact not found: ${zipPath}`);
	}

	await withRetry(`lcp deploy ${name}`, () =>
		run(
			`lcp deploy ${name}`,
			'lcp',
			[
				'deploy',
				'--extension',
				zipPath,
				'--project',
				config.lcpProject,
				'--environment',
				config.lcpEnvironment,
			],
			{cwd: extensionDir}
		)
	);
}
