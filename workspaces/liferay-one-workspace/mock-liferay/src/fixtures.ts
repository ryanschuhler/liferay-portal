/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {readFileSync, readdirSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

import {type Entry, Store} from './store.js';

// Seed data lives in mock-liferay/fixtures as JSON files. Each file is one
// fixture object (or an array of them) in one of two shapes:
//
//   Collection (gets full CRUD + Liferay Page list semantics):
//     {"collectionPath": "/o/c/businessevents", "items": [ {...}, {...} ]}
//
//   Raw (returned verbatim for an exact path; for singletons and non-Page
//   responses):
//     {"path": "/o/headless-admin-user/v1.0/my-user-account",
//      "method": "GET", "response": { ... }}
//
// The path is the exact request path the apps call (no query string). To add
// coverage for a new route, drop a JSON file here — no code change required.

interface CollectionFixture {
	collectionPath: string;
	items: Entry[];
}

interface RawFixture {
	method?: string;
	path: string;
	response: unknown;
}

type Fixture = CollectionFixture | RawFixture;

const FIXTURES_DIR = join(
	dirname(fileURLToPath(import.meta.url)),
	'..',
	'fixtures'
);

export function loadFixtures(store: Store): string[] {
	const loaded: string[] = [];

	let files: string[];

	try {
		files = readdirSync(FIXTURES_DIR).filter((file) =>
			file.endsWith('.json')
		);
	}
	catch {
		return loaded;
	}

	for (const file of files.sort()) {
		const raw = JSON.parse(readFileSync(join(FIXTURES_DIR, file), 'utf8'));

		const fixtures: Fixture[] = Array.isArray(raw) ? raw : [raw];

		for (const fixture of fixtures) {
			if ('collectionPath' in fixture && Array.isArray(fixture.items)) {
				store.seed(fixture.collectionPath, fixture.items);

				loaded.push(
					`${fixture.collectionPath} (${fixture.items.length})`
				);
			}
			else if ('path' in fixture && 'response' in fixture) {
				const method = fixture.method ?? 'GET';

				store.seedRaw(method, fixture.path, fixture.response);

				loaded.push(`${method} ${fixture.path} (raw)`);
			}
		}
	}

	return loaded;
}
