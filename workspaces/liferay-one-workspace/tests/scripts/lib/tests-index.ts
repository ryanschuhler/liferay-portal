/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

/**
 * Indexes the test suites and finds which plan IDs each test references.
 *
 * Tests declare the plan items they cover by referencing the plan ID anywhere
 * in the test file — typically in the test title:
 *
 *   Playwright / Vitest: test('[ROUTE-ADMIN-MP-ORDERS] loads the orders page', ...)
 *   JUnit:               @DisplayName("[REST-POST-ENTITLEMENTS-GENERATE] ...")
 *
 * An ID counts whether it is bracketed (`[ROUTE-ADMIN-MP-ORDERS]`) or appears as a
 * bare ID-shaped token (`planId: 'OBJ-LICENSEKEY'`), so data-driven tests that
 * build titles dynamically are picked up without extra annotations. Only tokens
 * that exactly match a known plan ID are recorded, so stray text is ignored. A
 * single token scan keeps this framework-agnostic.
 */

import * as fs from 'fs';
import * as path from 'path';

import {WORKSPACE_ROOT} from './surface.ts';

interface TestRoot {
	dir: string;
	match: (file: string) => boolean;
}

const TEST_ROOTS: TestRoot[] = [
	{
		dir: path.join(WORKSPACE_ROOT, 'tests'),
		match: (file) => file.endsWith('.spec.ts'),
	},
	{
		dir: path.join(
			WORKSPACE_ROOT,
			'client-extensions/liferay-one-custom-element/src'
		),
		match: (file) => /\.(test|spec)\.tsx?$/.test(file),
	},
	{
		dir: path.join(
			WORKSPACE_ROOT,
			'client-extensions/liferay-one-etc-spring-boot/src/test'
		),
		match: (file) => file.endsWith('.java'),
	},
];

function walk(dir: string, match: (file: string) => boolean): string[] {
	if (!fs.existsSync(dir)) {
		return [];
	}

	const out: string[] = [];

	for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
		if (entry.name === 'node_modules' || entry.name === 'build') {
			continue;
		}

		const full = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			out.push(...walk(full, match));
		}
		else if (match(full)) {
			out.push(full);
		}
	}

	return out;
}

export interface TestReference {
	file: string;
	id: string;
}

// An ID-shaped token: an uppercase prefix and at least one hyphenated segment
// (ROUTE-..., OBJ-..., REST-..., FLOW-..., etc.). Plain words never match.

const ID_PATTERN = /[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+/g;

/**
 * Returns a map of plan ID -> relative test file paths referencing it.
 * Only tokens that exactly match a known plan ID are recorded, so stray text is
 * ignored.
 */
export function indexTaggedTests(knownIds: Set<string>): Map<string, string[]> {
	const coverage = new Map<string, string[]>();

	for (const root of TEST_ROOTS) {
		for (const file of walk(root.dir, root.match)) {
			const source = fs.readFileSync(file, 'utf8');
			const relative = path.relative(WORKSPACE_ROOT, file);

			for (const match of source.matchAll(ID_PATTERN)) {
				const id = match[0];

				if (!knownIds.has(id)) {
					continue;
				}

				const files = coverage.get(id) ?? [];

				if (!files.includes(relative)) {
					files.push(relative);
				}

				coverage.set(id, files);
			}
		}
	}

	return coverage;
}

export interface OrphanTag {
	file: string;
	id: string;
}

/**
 * Finds plan-ID-shaped tags in tests that do NOT resolve to a real plan item.
 *
 * A token only counts as a tag — and therefore as a possible orphan — when its
 * prefix (the part before the first hyphen) matches a prefix used by a real plan
 * ID. That keeps incidental hyphenated tokens out while catching typos
 * (`OBJ-LICENSEKY`) and tags left behind when a plan ID is renamed. Such tags
 * silently contribute nothing to coverage, so this surfaces them instead.
 */
export function findOrphanTags(knownIds: Set<string>): OrphanTag[] {
	const knownPrefixes = new Set<string>();

	for (const id of knownIds) {
		knownPrefixes.add(id.split('-')[0]);
	}

	const orphans: OrphanTag[] = [];
	const seen = new Set<string>();

	for (const root of TEST_ROOTS) {
		for (const file of walk(root.dir, root.match)) {
			const source = fs.readFileSync(file, 'utf8');
			const relative = path.relative(WORKSPACE_ROOT, file);

			for (const match of source.matchAll(ID_PATTERN)) {
				const id = match[0];

				if (knownIds.has(id) || !knownPrefixes.has(id.split('-')[0])) {
					continue;
				}

				const key = `${relative}::${id}`;

				if (seen.has(key)) {
					continue;
				}

				seen.add(key);

				orphans.push({file: relative, id});
			}
		}
	}

	return orphans;
}
