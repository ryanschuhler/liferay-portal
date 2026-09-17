/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import * as fs from 'fs';
import * as path from 'path';

import {WORKSPACE_ROOT} from './surface.ts';

export const PLAN_DIR = path.join(WORKSPACE_ROOT, 'tests/plan');

export const VALID_TYPES = ['unit', 'integration', 'e2e'];
export const VALID_PRIORITIES = ['P0', 'P1', 'P2'];

export const VALID_STATUSES = ['planned', 'deferred', 'n/a'];

export interface PlanItem {
	file: string;
	id: string;
	line: number;
	priority: string;
	requirement: string;
	source: string;
	status: string;
	type: string;
}

const HEADER_CELLS = [
	'ID',
	'Requirement',
	'Type',
	'Priority',
	'Status',
	'Source',
];

function splitRow(line: string): string[] {
	const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');

	return trimmed.split('|').map((cell) => cell.trim());
}

function isSeparator(cells: string[]): boolean {
	return cells.every((cell) => /^:?-+:?$/.test(cell));
}

function planFiles(): string[] {
	if (!fs.existsSync(PLAN_DIR)) {
		return [];
	}

	return fs
		.readdirSync(PLAN_DIR)
		.filter((file) => file.endsWith('.md') && file !== 'README.md')
		.sort();
}

export function parsePlan(): PlanItem[] {
	const files = planFiles();

	const items: PlanItem[] = [];

	for (const file of files) {
		const full = path.join(PLAN_DIR, file);
		const lines = fs.readFileSync(full, 'utf8').split('\n');

		let inTable = false;

		for (let index = 0; index < lines.length; index++) {
			const line = lines[index];

			if (!line.trim().startsWith('|')) {
				inTable = false;

				continue;
			}

			const cells = splitRow(line);

			if (cells.length !== HEADER_CELLS.length) {
				continue;
			}

			if (cells[0] === 'ID' && cells[1] === 'Requirement') {
				inTable = true;

				continue;
			}

			if (!inTable || isSeparator(cells)) {
				continue;
			}

			items.push({
				file,
				id: cells[0],
				line: index + 1,
				priority: cells[3],
				requirement: cells[1],
				source: cells[5],
				status: cells[4],
				type: cells[2],
			});
		}
	}

	return items;
}

export interface PlanValidation {
	errors: string[];
}

export function validatePlan(items: PlanItem[]): PlanValidation {
	const errors: string[] = [];
	const seen = new Map<string, PlanItem>();

	for (const item of items) {
		const where = `${item.file}:${item.line}`;

		if (!/^[A-Z][A-Z0-9-]+$/.test(item.id)) {
			errors.push(`${where}: invalid ID "${item.id}"`);
		}

		const previous = seen.get(item.id);

		if (previous) {
			errors.push(
				`${where}: duplicate ID "${item.id}" (also ${previous.file}:${previous.line})`
			);
		}
		else {
			seen.set(item.id, item);
		}

		if (!VALID_TYPES.includes(item.type)) {
			errors.push(`${where}: invalid Type "${item.type}" for ${item.id}`);
		}

		if (!VALID_PRIORITIES.includes(item.priority)) {
			errors.push(
				`${where}: invalid Priority "${item.priority}" for ${item.id}`
			);
		}

		if (!VALID_STATUSES.includes(item.status)) {
			errors.push(
				`${where}: invalid Status "${item.status}" for ${item.id}`
			);
		}

		if (!item.source) {
			errors.push(`${where}: missing Source for ${item.id}`);
		}
	}

	return {errors};
}

export interface PlanReference {
	file: string;
	id: string;
	line: number;
}

const QUOTED_PATTERN = /`([^`]+)`/g;

const WHOLE_ID_PATTERN = /^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+$/;

/**
 * Finds backtick-quoted plan IDs in the plan's own prose that resolve to no
 * row. A renamed ID leaves every description citing it pointing at nothing, and
 * nothing else catches that, because the prose is not a test tag.
 *
 * The match is deliberately narrow, so the report stays worth reading: a token
 * only counts when it is spelled like a complete ID and carries a prefix a real
 * ID uses. That leaves a wildcard (`ROUTE-ADMIN-*`), an elided abbreviation
 * (`…-COMPLETE-UPLOAD`), a path, and a prose fragment alone, and a token that
 * is the leading part of a real ID is read as an abbreviation of it rather than
 * as rot.
 */
export function findDanglingReferences(items: PlanItem[]): PlanReference[] {
	const idList = items.map((item) => item.id);

	const ids = new Set(idList);
	const prefixes = new Set(idList.map((id) => id.split('-')[0]));

	const references: PlanReference[] = [];
	const seen = new Set<string>();

	for (const file of planFiles()) {
		const lines = fs
			.readFileSync(path.join(PLAN_DIR, file), 'utf8')
			.split('\n');

		for (let index = 0; index < lines.length; index++) {
			for (const match of lines[index].matchAll(QUOTED_PATTERN)) {
				const id = match[1];

				if (
					!WHOLE_ID_PATTERN.test(id) ||
					!prefixes.has(id.split('-')[0]) ||
					ids.has(id) ||
					idList.some((known) => known.startsWith(`${id}-`))
				) {
					continue;
				}

				const key = `${file}::${id}`;

				if (seen.has(key)) {
					continue;
				}

				seen.add(key);

				references.push({file, id, line: index + 1});
			}
		}
	}

	return references;
}
