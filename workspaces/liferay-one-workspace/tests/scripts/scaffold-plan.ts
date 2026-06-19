/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

/* eslint-disable no-console -- CLI script; console output is its user interface */

/**
 * Generates / refreshes the by-surface plan files under tests/plan from the
 * enumerated code surface.
 *
 * Merge-aware: existing rows (matched by ID) keep their curated Requirement,
 * Type, Priority, and Status. New code anchors are appended with defaults.
 * Anchors that no longer exist in code are dropped. Human curation is safe to
 * re-run against.
 *
 *   node scripts/scaffold-plan.ts
 */

import * as fs from 'fs';
import * as path from 'path';

import {parsePlan} from './lib/plan.ts';
import {type SurfaceGroup, enumerateSurface} from './lib/surface.ts';

const PLAN_DIR = path.join(import.meta.dirname, '..', 'plan');

interface FileSpec {
	description: string;
	file: string;
	prefixes: string[];
	title: string;
}

// One markdown file per surface family. Crons and subscribers share a file.

const FILES: FileSpec[] = [
	{
		description:
			'Every custom-element SPA route, across all seven page groups. A route is "covered" by an e2e test that loads it and asserts it renders for the right persona.',
		file: 'ui-routes.md',
		prefixes: ['route'],
		title: 'UI Routes',
	},
	{
		description:
			'Every published site-initializer layout page. Covered by an e2e test that loads the page and asserts the expected chrome and fragments render.',
		file: 'site-pages.md',
		prefixes: ['page'],
		title: 'Site Pages',
	},
	{
		description:
			'Every liferay-one-etc-spring-boot REST endpoint. Covered by a controller test (JUnit) and/or a Playwright integration test asserting the contract, auth, and error handling.',
		file: 'custom-rest.md',
		prefixes: ['rest'],
		title: 'Custom REST Endpoints',
	},
	{
		description:
			'Scheduled background tasks and async Pub/Sub subscribers. Covered by a JUnit/integration test exercising the task or message handler, including idempotency.',
		file: 'crons-async.md',
		prefixes: ['cron', 'subscriber'],
		title: 'Crons & Async Subscribers',
	},
	{
		description:
			'Every batch-imported Object definition. Covered by an integration test asserting CRUD, required-field validation, and account-restriction scoping where applicable.',
		file: 'headless-objects.md',
		prefixes: ['object'],
		title: 'Headless Objects',
	},
	{
		description:
			'Every batch-imported role. Covered by an integration test asserting the role grants and denies the right actions (permission scoping).',
		file: 'roles-permissions.md',
		prefixes: ['role'],
		title: 'Roles & Permissions',
	},
	{
		description:
			'Every external-system integration contract. Covered by an integration test (live or mocked) asserting the inbound/outbound contract and failure handling.',
		file: 'integrations.md',
		prefixes: ['integration'],
		title: 'Integrations',
	},
];

const ID_PREFIX: Record<string, string> = {
	cron: 'CRON',
	integration: 'INT',
	object: 'OBJ',
	page: 'PAGE',
	rest: 'REST',
	role: 'ROLE',
	route: 'UI',
	subscriber: 'SUB',
};

const DEFAULT_TYPE: Record<string, string> = {
	cron: 'integration',
	integration: 'integration',
	object: 'integration',
	page: 'e2e',
	rest: 'integration',
	role: 'integration',
	route: 'e2e',
	subscriber: 'integration',
};

// Anchors that gate go-live and should draw attention first.

const P0_ANCHORS = new Set([
	'page:/home',
	'page:/marketplace',
	'page:/my-account',
	'page:/support',
	'page:/admin',
	'route:product-purchase:summary',
	'route:my-account:orders',
	'rest:POST:/entitlements/generate',
	'rest:POST:/ticket-attachments/initiate-upload',
	'object:Contract',
	'object:Entitlement',
	'object:LicenseKey',
	'object:Project',
	'object:SubscriptionEntry',
	'subscriber:SalesforceObjectPubsubSubscriber',
	'integration:salesforce',
	'integration:liferay-cloud',
	'role:Account Administrator',
]);

function anchorToId(anchor: string): string {
	const [prefix, ...rest] = anchor.split(':');
	const detail = rest
		.join(':')
		.toUpperCase()
		.replace(/[^A-Z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

	return `${ID_PREFIX[prefix]}-${detail}`;
}

function defaultRequirement(anchor: string): string {
	const [prefix, ...rest] = anchor.split(':');
	const detail = rest.join(':');

	switch (prefix) {
		case 'route':
			return `SPA route renders for the right persona: ${detail}`;
		case 'page':
			return `Site page loads with expected chrome and fragments: ${detail}`;
		case 'rest': {
			const [method, ...pathParts] = detail.split(':');

			return `${method} ${pathParts.join(':')} honors its contract, auth, and error cases`;
		}
		case 'cron':
			return `Scheduled task runs correctly and is idempotent: ${detail}`;
		case 'subscriber':
			return `Async subscriber processes and dedupes messages: ${detail}`;
		case 'object':
			return `Headless CRUD, required-field validation, and scoping: ${detail}`;
		case 'role':
			return `Role grants and denies the correct actions: ${detail}`;
		case 'integration':
			return `Integration contract and failure handling honored: ${detail}`;
		default:
			return detail;
	}
}

interface Curated {
	priority: string;
	requirement: string;
	status: string;
	type: string;
}

function buildTable(
	group: SurfaceGroup,
	curated: Map<string, Curated>
): string {
	const rows = group.anchors.map((anchor) => {
		const id = anchorToId(anchor);
		const existing = curated.get(id);

		const requirement = existing?.requirement ?? defaultRequirement(anchor);
		const type = existing?.type ?? DEFAULT_TYPE[group.prefix];
		const priority =
			existing?.priority ?? (P0_ANCHORS.has(anchor) ? 'P0' : 'P1');
		const status = existing?.status ?? 'planned';

		return `| ${id} | ${requirement} | ${type} | ${priority} | ${status} | ${anchor} |`;
	});

	return [
		'| ID | Requirement | Type | Priority | Status | Source |',
		'| --- | --- | --- | --- | --- | --- |',
		...rows,
	].join('\n');
}

function main() {
	fs.mkdirSync(PLAN_DIR, {recursive: true});

	// Index already-curated rows by ID so a re-run preserves human edits.

	const curated = new Map<string, Curated>();

	for (const item of parsePlan()) {
		curated.set(item.id, {
			priority: item.priority,
			requirement: item.requirement,
			status: item.status,
			type: item.type,
		});
	}

	const surface = enumerateSurface();
	const byPrefix = new Map<string, SurfaceGroup>();

	for (const group of surface) {
		byPrefix.set(group.prefix, group);
	}

	for (const spec of FILES) {
		const groups = spec.prefixes
			.map((prefix) => byPrefix.get(prefix))
			.filter((group): group is SurfaceGroup => Boolean(group));

		const total = groups.reduce(
			(sum, group) => sum + group.anchors.length,
			0
		);

		const sections = groups.map((group) => {
			const heading =
				spec.prefixes.length > 1 ? `\n### ${group.title}\n\n` : '\n';

			return heading + buildTable(group, curated);
		});

		const body = [
			`# ${spec.title}`,
			'',
			spec.description,
			'',
			`> Auto-scaffolded from the code surface (${total} items). Edit the Requirement, Type, Priority, and Status columns freely — \`scaffold-plan\` preserves them on re-run. Do not hand-edit the ID or Source columns.`,
			...sections,
			'',
		].join('\n');

		fs.writeFileSync(path.join(PLAN_DIR, spec.file), body);

		console.log(`wrote plan/${spec.file} (${total} items)`);
	}
}

main();
