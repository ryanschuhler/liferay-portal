/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

/**
 * Enumerates the *actual code surface* of the liferay-one-workspace so that
 * `check-plan` can verify the testing plan covers everything that ships.
 *
 * Each enumerator returns a list of canonical "anchors". An anchor is a stable
 * string that identifies one testable surface element. Plan rows reference the
 * same anchors in their `Source` column, so the two can be diffed.
 *
 * Anchor grammar (prefix : detail):
 *   route:<group>:<path>      one custom-element route
 *   page:<friendlyURL>        one published site-initializer layout
 *   rest:<METHOD>:<path>      one Spring Boot REST endpoint
 *   cron:<methodName>         one @Scheduled task
 *   subscriber:<ClassName>    one async Pub/Sub subscriber
 *   object:<Name>             one batch-imported Object definition
 *   role:<Name>               one batch-imported role
 *   integration:<system>      one external-system integration contract
 *
 * `spec:*` anchors are intentionally NOT enumerable here. They mark
 * requirements derived from the specs (OAuth2 scopes, error contracts,
 * end-to-end flows) that have no single code symbol. check-plan ignores them.
 */

import * as fs from 'fs';
import * as path from 'path';

export const WORKSPACE_ROOT = path.resolve(
	import.meta.dirname,
	'..',
	'..',
	'..'
);

const CUSTOM_ELEMENT_SRC = path.join(
	WORKSPACE_ROOT,
	'client-extensions/liferay-one-custom-element/src'
);
const SPRING_BOOT_JAVA = path.join(
	WORKSPACE_ROOT,
	'client-extensions/liferay-one-etc-spring-boot/src/main/java'
);
const SITE_LAYOUTS = path.join(
	WORKSPACE_ROOT,
	'client-extensions/liferay-one-site-initializer/site-initializer/layouts'
);
const BATCH = path.join(
	WORKSPACE_ROOT,
	'client-extensions/liferay-one-batch/batch'
);
const SPEC_INTEGRATIONS = path.join(
	WORKSPACE_ROOT,
	'.agents/specs/integrations'
);

export interface SurfaceGroup {
	anchors: string[];
	description: string;
	prefix: string;
	title: string;
}

function walk(dir: string, filter: (file: string) => boolean): string[] {
	if (!fs.existsSync(dir)) {
		return [];
	}

	const out: string[] = [];

	for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
		const full = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			if (entry.name === 'node_modules' || entry.name === 'build') {
				continue;
			}

			out.push(...walk(full, filter));
		}
		else if (filter(full)) {
			out.push(full);
		}
	}

	return out;
}

function kebab(value: string): string {
	return value
		.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
		.replace(/_/g, '-')
		.toLowerCase();
}

function readJSON(file: string): any {
	return JSON.parse(fs.readFileSync(file, 'utf8'));
}

// route:<group>:<path> — one route per `path:` entry in every *Routes.tsx file.

export function enumerateRoutes(): string[] {
	const files = walk(
		CUSTOM_ELEMENT_SRC,
		(file) => file.endsWith('Routes.tsx') && !file.includes('.test.')
	);

	const anchors: string[] = [];

	for (const file of files) {
		const group = kebab(path.basename(file).replace(/Routes\.tsx$/, ''));
		const source = fs.readFileSync(file, 'utf8');

		const matches = source.matchAll(/path:\s*['"]([^'"]+)['"]/g);

		for (const match of matches) {
			const routePath = match[1];

			if (routePath === '*') {
				continue;
			}

			anchors.push(`route:${group}:${routePath}`);
		}
	}

	return unique(anchors);
}

// page:<friendlyURL> — one per published layout page.json.

export function enumeratePages(): string[] {
	const files = walk(
		SITE_LAYOUTS,
		(file) => path.basename(file) === 'page.json'
	);

	const anchors: string[] = [];

	for (const file of files) {
		const page = readJSON(file);

		if (page.friendlyURL) {
			anchors.push(`page:${page.friendlyURL}`);
		}
	}

	return unique(anchors);
}

// rest:<METHOD>:<path> — class @RequestMapping base + method mapping path.

export function enumerateRestEndpoints(): string[] {
	const files = walk(SPRING_BOOT_JAVA, (file) =>
		file.endsWith('RestController.java')
	);

	// Matches both `@GetMapping("/x")` and the bare `@GetMapping` form, where
	// the whole path lives on the class-level @RequestMapping. Also tolerates
	// `value =` / `path =` attribute syntax.

	const methodRegex =
		/@(Get|Post|Put|Delete|Patch)Mapping\b(?:\(\s*(?:(?:value|path)\s*=\s*)?"([^"]*)")?/g;

	const anchors: string[] = [];

	for (const file of files) {
		const source = fs.readFileSync(file, 'utf8');

		const baseMatch = source.match(
			/@RequestMapping\(\s*(?:(?:value|path)\s*=\s*)?"([^"]*)"/
		);
		const base = baseMatch ? baseMatch[1] : '';

		for (const match of source.matchAll(methodRegex)) {
			const method = match[1].toUpperCase();
			const full = `${base}${match[2] ?? ''}`.replace(/\/{2,}/g, '/');

			anchors.push(`rest:${method}:${full || '/'}`);
		}
	}

	return unique(anchors);
}

// cron:<methodName> — every @Scheduled task.

export function enumerateCrons(): string[] {
	const files = walk(SPRING_BOOT_JAVA, (file) => file.endsWith('.java'));

	const anchors: string[] = [];

	for (const file of files) {
		const source = fs.readFileSync(file, 'utf8');

		const matches = source.matchAll(
			/@Scheduled\([^)]*\)\s*(?:public|protected|private)\s+[\w<>,\s[\]]+?\s+(\w+)\s*\(/g
		);

		for (const match of matches) {
			anchors.push(`cron:${match[1]}`);
		}
	}

	return unique(anchors);
}

// subscriber:<ClassName> — concrete async Pub/Sub subscribers.

export function enumerateSubscribers(): string[] {
	const files = walk(
		SPRING_BOOT_JAVA,
		(file) =>
			file.endsWith('Subscriber.java') &&
			!path.basename(file).startsWith('Base')
	);

	return unique(
		files.map((file) => `subscriber:${path.basename(file, '.java')}`)
	);
}

// object:<Name> — every batch-imported Object definition.

export function enumerateObjects(): string[] {
	const file = path.join(
		BATCH,
		'03-object-definition.batch-engine-data.json'
	);

	if (!fs.existsSync(file)) {
		return [];
	}

	const items = toItems(readJSON(file));

	return unique(
		items
			.filter((item) => item && item.name)
			.map((item) => `object:${item.name}`)
	);
}

// role:<Name> — every batch-imported role.

export function enumerateRoles(): string[] {
	const file = path.join(BATCH, '11-role.batch-engine-data.json');

	if (!fs.existsSync(file)) {
		return [];
	}

	const items = toItems(readJSON(file));

	return unique(
		items
			.filter((item) => item && item.name)
			.map((item) => `role:${item.name}`)
	);
}

// integration:<system> — one per integration spec contract.

export function enumerateIntegrations(): string[] {
	if (!fs.existsSync(SPEC_INTEGRATIONS)) {
		return [];
	}

	return unique(
		fs
			.readdirSync(SPEC_INTEGRATIONS)
			.filter((file) => file.endsWith('.md') && file !== 'README.md')
			.map((file) => `integration:${path.basename(file, '.md')}`)
	);
}

function toItems(data: any): any[] {
	if (Array.isArray(data)) {
		return data;
	}

	if (data && Array.isArray(data.items)) {
		return data.items;
	}

	return [];
}

function unique(values: string[]): string[] {
	return Array.from(new Set(values)).sort();
}

export function enumerateSurface(): SurfaceGroup[] {
	return [
		{
			anchors: enumerateRoutes(),
			description: 'Custom-element SPA routes across all page groups',
			prefix: 'route',
			title: 'UI Routes',
		},
		{
			anchors: enumeratePages(),
			description: 'Published site-initializer layout pages',
			prefix: 'page',
			title: 'Site Pages',
		},
		{
			anchors: enumerateRestEndpoints(),
			description: 'liferay-one-etc-spring-boot REST endpoints',
			prefix: 'rest',
			title: 'Custom REST',
		},
		{
			anchors: enumerateCrons(),
			description: 'Scheduled background tasks',
			prefix: 'cron',
			title: 'Crons',
		},
		{
			anchors: enumerateSubscribers(),
			description: 'Async Pub/Sub subscribers',
			prefix: 'subscriber',
			title: 'Subscribers',
		},
		{
			anchors: enumerateObjects(),
			description: 'Batch-imported Object definitions',
			prefix: 'object',
			title: 'Headless Objects',
		},
		{
			anchors: enumerateRoles(),
			description: 'Batch-imported roles',
			prefix: 'role',
			title: 'Roles',
		},
		{
			anchors: enumerateIntegrations(),
			description: 'External-system integration contracts',
			prefix: 'integration',
			title: 'Integrations',
		},
	];
}

export const ENUMERABLE_PREFIXES = enumerateSurface().map(
	(group) => group.prefix
);
