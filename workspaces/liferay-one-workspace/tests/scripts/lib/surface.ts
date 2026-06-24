/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
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

export function enumerateRoutes(): string[] {
	const files = walk(
		CUSTOM_ELEMENT_SRC,
		(file) =>
			(file.endsWith('Routes.tsx') || file.endsWith('Router.tsx')) &&
			!file.includes('.test.')
	);

	const anchors: string[] = [];

	for (const file of files) {
		const group = kebab(
			path.basename(file).replace(/Router?(s)?\.tsx$/, '')
		);
		const source = fs.readFileSync(file, 'utf8');

		const matches = source.matchAll(/path:\s*['"]([^'"]+)['"]/g);

		for (const match of matches) {
			const routePath = match[1];

			if (
				routePath === '*' ||
				routePath === '/' ||
				routePath.endsWith('/*')
			) {
				continue;
			}

			anchors.push(`route:${group}:${routePath}`);
		}
	}

	return unique(anchors);
}

export function enumerateRestEndpoints(): string[] {
	const files = walk(SPRING_BOOT_JAVA, (file) =>
		file.endsWith('RestController.java')
	);

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
