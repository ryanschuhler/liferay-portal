/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

/**
 * Parses the definitive testing plan under tests/plan/*.md into structured
 * rows. The plan is the source of truth: each row is one testable requirement
 * with a stable ID (referenced by tests) and a Source anchor (matched against
 * the enumerated code surface).
 *
 * Every plan file holds one or more Markdown tables with this exact header:
 *
 *   | ID | Requirement | Type | Priority | Status | Source |
 */

import * as fs from 'fs';
import * as path from 'path';

import {WORKSPACE_ROOT} from './surface.ts';

export const PLAN_DIR = path.join(WORKSPACE_ROOT, 'tests/plan');

export const VALID_TYPES = ['unit', 'integration', 'e2e'];
export const VALID_PRIORITIES = ['P0', 'P1', 'P2'];

// "planned" items count toward the go-live denominator and need a test.
// "deferred" / "n/a" items are excluded from the denominator.

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

export function parsePlan(): PlanItem[] {
	if (!fs.existsSync(PLAN_DIR)) {
		return [];
	}

	const files = fs
		.readdirSync(PLAN_DIR)
		.filter((file) => file.endsWith('.md') && file !== 'README.md')
		.sort();

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
