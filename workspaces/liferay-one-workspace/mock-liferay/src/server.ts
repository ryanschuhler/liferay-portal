/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import cors from 'cors';
import express from 'express';

import {createAuth} from './auth.js';
import {PORT} from './config.js';
import {loadFixtures} from './fixtures.js';
import {createGraphQLRouter} from './graphql.js';
import {createResourceRouter} from './headless.js';
import {createSpringBootProxyRouter} from './proxy.js';
import {Store} from './store.js';

async function main() {
	const store = new Store();

	const loaded = loadFixtures(store);

	const auth = await createAuth();

	const app = express();

	app.use(cors());

	// Mount the Spring Boot proxy before the body parsers so it can forward the
	// raw request stream (including multipart uploads) untouched.

	app.use(createSpringBootProxyRouter());

	app.use(express.json({limit: '25mb'}));
	app.use(express.urlencoded({extended: true}));

	// Liferay's health probe. docker-compose.standalone.yaml waits on this.

	app.get('/c/portal/status', (_request, response) => {
		response.type('text/plain').send('OK');
	});

	// Order matters: specific handlers (auth, GraphQL) win over the generic
	// resource handler, which claims everything else under /o.

	app.use(auth.router);
	app.use(createGraphQLRouter());
	app.use(createResourceRouter(store));

	app.use((_request, response) => {
		response.status(404).json({status: 'NOT_FOUND'});
	});

	app.listen(PORT, () => {
		console.log(`[mock-liferay] listening on http://localhost:${PORT}`);
		console.log(
			`[mock-liferay] seeded ${loaded.length} collection(s):` +
				(loaded.length ? `\n  - ${loaded.join('\n  - ')}` : ' none')
		);
	});
}

main().catch((error) => {
	console.error('[mock-liferay] failed to start', error);

	process.exit(1);
});
