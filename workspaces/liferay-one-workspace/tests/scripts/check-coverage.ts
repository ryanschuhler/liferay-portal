/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

/* eslint-disable no-console -- CLI script; console output is its user interface */

/**
 * check-coverage — measures how much of the plan has tests, i.e. how close the
 * project is to go-live.
 *
 * A plan item is "covered" when at least one test file references its ID in
 * square brackets (see lib/tests-index.ts). Items with status `deferred` or
 * `n/a` are excluded from the denominator.
 *
 *   node scripts/check-coverage.ts            # report
 *   node scripts/check-coverage.ts --min 80   # also fail if below 80%
 *   node scripts/check-coverage.ts --list     # list every uncovered item
 *
 * Always reconcile the plan first with check-plan; coverage is only meaningful
 * against a complete plan.
 */

import {parsePlan, validatePlan} from './lib/plan.ts';
import {indexTaggedTests} from './lib/tests-index.ts';

function pct(covered: number, total: number): string {
	if (total === 0) {
		return '100.0%';
	}

	return `${((covered / total) * 100).toFixed(1)}%`;
}

function bar(covered: number, total: number, width = 24): string {
	const filled = total === 0 ? width : Math.round((covered / total) * width);

	return `[${'#'.repeat(filled)}${'-'.repeat(width - filled)}]`;
}

function main(): number {
	const args = process.argv.slice(2);
	const list = args.includes('--list');
	const minIndex = args.indexOf('--min');
	const min = minIndex >= 0 ? Number(args[minIndex + 1]) : null;

	const items = parsePlan();
	const {errors} = validatePlan(items);

	if (errors.length) {
		console.error('Plan validation errors (run check-plan):\n');

		for (const error of errors) {
			console.error(`  ✗ ${error}`);
		}

		return 1;
	}

	const knownIds = new Set(items.map((item) => item.id));
	const coverage = indexTaggedTests(knownIds);

	const planned = items.filter((item) => item.status === 'planned');
	const excluded = items.filter((item) => item.status !== 'planned');

	const isCovered = (id: string) => (coverage.get(id)?.length ?? 0) > 0;

	const coveredItems = planned.filter((item) => isCovered(item.id));

	// Per-file breakdown.

	const files = [...new Set(planned.map((item) => item.file))].sort();

	console.log('check-coverage — how close is the plan to go-live?\n');

	for (const file of files) {
		const inFile = planned.filter((item) => item.file === file);
		const done = inFile.filter((item) => isCovered(item.id)).length;

		console.log(
			`  ${bar(done, inFile.length)} ${pct(done, inFile.length).padStart(6)}  ` +
				`${file.replace(/\.md$/, '').padEnd(20)} ${done}/${inFile.length}`
		);
	}

	// Per-priority breakdown.

	console.log('');

	for (const priority of ['P0', 'P1', 'P2']) {
		const inPriority = planned.filter((item) => item.priority === priority);

		if (!inPriority.length) {
			continue;
		}

		const done = inPriority.filter((item) => isCovered(item.id)).length;

		console.log(
			`  ${bar(done, inPriority.length)} ${pct(done, inPriority.length).padStart(6)}  ` +
				`${priority.padEnd(20)} ${done}/${inPriority.length}`
		);
	}

	const overall = pct(coveredItems.length, planned.length);

	console.log('');
	console.log(
		`  ${bar(coveredItems.length, planned.length)} ${overall.padStart(6)}  ` +
			`OVERALL              ${coveredItems.length}/${planned.length}` +
			(excluded.length ? `  (+${excluded.length} deferred/n/a)` : '')
	);
	console.log('');

	if (list) {
		const uncovered = planned
			.filter((item) => !isCovered(item.id))
			.sort((left, right) => left.priority.localeCompare(right.priority));

		if (uncovered.length) {
			console.log(`Uncovered (${uncovered.length}):\n`);

			for (const item of uncovered) {
				console.log(
					`  ${item.priority}  ${item.id}  — ${item.requirement}`
				);
			}

			console.log('');
		}
	}
	else {
		const uncoveredP0 = planned.filter(
			(item) => item.priority === 'P0' && !isCovered(item.id)
		);

		if (uncoveredP0.length) {
			console.log(`Uncovered P0 (${uncoveredP0.length}):`);

			for (const item of uncoveredP0) {
				console.log(`  ${item.id} — ${item.requirement}`);
			}

			console.log('');
		}

		console.log('Run with --list to see every uncovered item.\n');
	}

	if (min !== null && !Number.isNaN(min)) {
		const value = planned.length
			? (coveredItems.length / planned.length) * 100
			: 100;

		if (value < min) {
			console.log(
				`FAIL — coverage ${overall} is below the ${min}% threshold.`
			);

			return 1;
		}

		console.log(`OK — coverage ${overall} meets the ${min}% threshold.`);
	}

	return 0;
}

process.exit(main());
