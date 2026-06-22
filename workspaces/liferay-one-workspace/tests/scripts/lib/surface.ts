/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

/**
 * Enumerates the *actual code surface* of the liferay-one-workspace so that
 * `check-plan` can verify the testing plan covers everything that ships.
 *
 * Scope is intentionally limited to the two client extensions under test — the
 * custom-element SPA and the Spring Boot service. For Spring Boot that means its
 * full testable surface: REST endpoints, scheduled crons, and async Pub/Sub
 * subscribers. Other surfaces (site pages, Objects, roles, external integration
 * contracts) are out of scope for now and are not enumerated.
 *
 * Each enumerator returns a list of canonical "anchors". An anchor is a stable
 * string that identifies one testable surface element. Plan rows reference the
 * same anchors in their `Source` column, so the two can be diffed.
 *
 * Anchor grammar (prefix : detail):
 *   route:<group>:<path>      one custom-element route
 *   rest:<METHOD>:<path>      one Spring Boot REST endpoint
 *   cron:<methodName>         one @Scheduled task
 *   subscriber:<ClassName>    one async Pub/Sub subscriber
 *   service:<ClassName>       one Spring service holding branching logic
 *   converter:<ClassName>     one DTO/model converter
 *
 * Services and converters are enumerated because the branching logic worth
 * unit-testing (dedupe guards, validation, null/error fallbacks) concentrates
 * there, not in the controllers that delegate to them. Thin HTTP CRUD wrappers
 * with no branch worth proving are still enumerated, but their plan rows carry
 * status `n/a` so they stay visible without dragging down the denominator.
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

// service:<ClassName> — every Spring service except the abstract base.

export function enumerateServices(): string[] {
	const files = walk(
		SPRING_BOOT_JAVA,
		(file) =>
			file.endsWith('Service.java') &&
			!path.basename(file).includes('Base')
	);

	return unique(
		files.map((file) => `service:${path.basename(file, '.java')}`)
	);
}

// converter:<ClassName> — every DTO/model converter except the abstract base.

export function enumerateConverters(): string[] {
	const files = walk(
		SPRING_BOOT_JAVA,
		(file) =>
			file.endsWith('Converter.java') &&
			!path.basename(file).includes('Base')
	);

	return unique(
		files.map((file) => `converter:${path.basename(file, '.java')}`)
	);
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
			title: 'Routes',
		},
		{
			anchors: enumerateRestEndpoints(),
			description: 'liferay-one-etc-spring-boot REST endpoints',
			prefix: 'rest',
			title: 'REST',
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
			anchors: enumerateServices(),
			description: 'Spring services holding branching logic',
			prefix: 'service',
			title: 'Services',
		},
		{
			anchors: enumerateConverters(),
			description: 'DTO/model converters',
			prefix: 'converter',
			title: 'Converters',
		},
	];
}

export const ENUMERABLE_PREFIXES = enumerateSurface().map(
	(group) => group.prefix
);
