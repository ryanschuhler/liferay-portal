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

// One markdown file per surface family. Scope is limited to the two client
// extensions under test — the custom-element SPA and the Spring Boot service.

const FILES: FileSpec[] = [
	{
		description:
			'Every custom-element SPA route, across all seven page groups. Most route groups are static route tables, covered by Vitest route-wiring unit tests that assert the declared paths, elements, and titles. Route groups with conditional wiring (e.g. ProductPurchase\'s free/paid steps) additionally warrant an e2e test that loads the route and asserts it renders for the right persona.',
		file: 'routes.md',
		prefixes: ['route'],
		title: 'Routes',
	},
	{
		description:
			'Every liferay-one-etc-spring-boot REST endpoint. Each is unit-tested at the controller level (JUnit MockMvc) for its contract, status codes, validation, and error handling. The real in-action integration coverage — through the OAuth2 proxy, against external systems — is tracked as journeys in flows.md.',
		file: 'rest.md',
		prefixes: ['rest'],
		title: 'REST Endpoints',
	},
	{
		description:
			'Every scheduled background task in liferay-one-etc-spring-boot. Each is unit-tested at the handler level (JUnit + Mockito), including idempotency. The real in-action integration coverage is tracked as journeys in flows.md.',
		file: 'crons.md',
		prefixes: ['cron'],
		title: 'Crons',
	},
	{
		description:
			'Every async Pub/Sub subscriber in liferay-one-etc-spring-boot. Each is unit-tested at the message-handler level (JUnit + Mockito), including dedupe and idempotency. The real in-action integration coverage is tracked as a journey in flows.md.',
		file: 'subscribers.md',
		prefixes: ['subscriber'],
		title: 'Subscribers',
	},
	{
		description:
			'Every Spring service in liferay-one-etc-spring-boot. Services holding branching logic (dedupe guards, validation, null/error fallbacks) are `planned` and unit-tested with JUnit + Mockito — this is where the logic the controllers delegate to actually lives. Thin HTTP CRUD wrappers with no branch worth proving are kept `n/a`: enumerated so the surface stays honest, but excluded from the go-live denominator.',
		file: 'services.md',
		prefixes: ['service'],
		title: 'Services',
	},
	{
		description:
			'Every DTO/model converter in liferay-one-etc-spring-boot. Converters are pure input → output transforms — the cheapest, highest-value unit tests in the suite — so each is `planned` and exercised directly with JUnit.',
		file: 'converters.md',
		prefixes: ['converter'],
		title: 'Converters',
	},
];

const ID_PREFIX: Record<string, string> = {
	converter: 'CONV',
	cron: 'CRON',
	rest: 'REST',
	route: 'ROUTE',
	service: 'SVC',
	subscriber: 'SUB',
};

// Every enumerable surface is unit-tested in isolation (JUnit MockMvc/Mockito
// for Spring, Vitest for routes). The real in-action integration/e2e coverage
// is curated as cross-cutting journeys in flows.md, not auto-scaffolded here.

const DEFAULT_TYPE: Record<string, string> = {
	converter: 'unit',
	cron: 'unit',
	rest: 'unit',
	route: 'unit',
	service: 'unit',
	subscriber: 'unit',
};

// Anchors that gate go-live and should draw attention first.

const P0_ANCHORS = new Set([
	'route:product-purchase:summary',
	'route:my-account:orders',
	'rest:POST:/entitlements/generate',
	'rest:POST:/ticket-attachments/initiate-upload',
	'service:EntitlementService',
	'subscriber:SalesforceObjectPubsubSubscriber',
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
			return `Route table declares the expected path, element, and title: ${detail}`;
		case 'rest': {
			const [method, ...pathParts] = detail.split(':');

			return `${method} ${pathParts.join(':')} honors its contract, auth, and error cases`;
		}
		case 'cron':
			return `Scheduled task runs correctly and is idempotent: ${detail}`;
		case 'subscriber':
			return `Async subscriber processes and dedupes messages: ${detail}`;
		case 'service':
			return `Service logic (validation, dedupe, null/error fallbacks) is proven in isolation: ${detail}`;
		case 'converter':
			return `Converter maps input to output across its branches: ${detail}`;
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
