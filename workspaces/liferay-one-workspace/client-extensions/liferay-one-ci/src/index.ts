/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {serve} from '@hono/node-server';
import {Hono} from 'hono';
import crypto from 'node:crypto';

import {config, warnIncompleteConfig} from './config.js';
import {logger} from './logger.js';
import {enqueueDeploy} from './pipeline.js';

const app = new Hono();

app.get(config.readyPath, (c) => c.text('READY'));

function verifySignature(
	body: string,
	signatureHeader: string | null
): boolean {
	if (!signatureHeader) {
		return false;
	}

	const expected =
		'sha256=' +
		crypto
			.createHmac('sha256', config.githubWebhookSecret)
			.update(body)
			.digest('hex');

	const a = Buffer.from(expected);
	const b = Buffer.from(signatureHeader);

	return a.length === b.length && crypto.timingSafeEqual(a, b);
}

app.post('/webhook', async (c) => {
	const body = await c.req.text();

	if (!verifySignature(body, c.req.header('x-hub-signature-256') ?? null)) {
		logger.error('Rejected webhook with invalid signature');

		return c.text('Invalid signature', 401);
	}

	const event = c.req.header('x-github-event');

	if (event === 'ping') {
		return c.text('pong');
	}

	if (event !== 'push') {
		return c.text(`Ignored event: ${event}`, 202);
	}

	let payload: {ref?: string};

	try {
		payload = JSON.parse(body) as {ref?: string};
	}
	catch {
		return c.text('Invalid JSON payload', 400);
	}

	const expectedRef = `refs/heads/${config.deployBranch}`;

	if (payload.ref !== expectedRef) {
		logger.log(`Ignored push to ${payload.ref} (watching ${expectedRef})`);

		return c.text(`Ignored ref: ${payload.ref}`, 202);
	}

	const result = enqueueDeploy(`push to ${config.deployBranch}`);

	return c.json(result, 202);
});

warnIncompleteConfig();

const server = serve({fetch: app.fetch, port: config.port}, (info) => {
	logger.log(`liferay-one-ci listening on ${info.port}`);
	logger.log(`Watching branch "${config.deployBranch}" of ${config.repoUrl}`);
	logger.log(
		`Deploy target: project ${config.lcpProject}, ` +
			`environment ${config.lcpEnvironment}`
	);
});

// The platform sends SIGTERM when rolling this container (including when the
// deployer redeploys itself). Close cleanly so in-flight HTTP requests finish.

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
	process.on(signal, () => {
		logger.log(`${signal} received; shutting down`);

		server.close(() => process.exit(0));
	});
}

export default app;
