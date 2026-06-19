/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

/* eslint-disable no-console -- CLI script; console output is its user interface */

/**
 * check-plan — verifies the testing plan covers the actual code surface.
 *
 * For every enumerable surface (routes, pages, REST endpoints, crons,
 * subscribers, objects, roles, integrations) it diffs the code against the
 * plan's Source anchors and reports:
 *
 *   - GAPS:  code that ships but has no plan row   (plan is incomplete)
 *   - STALE: plan rows pointing at code that is gone (plan is out of date)
 *
 * `spec:*` plan sources are ignored (they have no enumerable code symbol).
 * Exits non-zero on any gap, stale row, or plan validation error.
 *
 *   node scripts/check-plan.ts
 *
 * Fix gaps/stale automatically with: node scripts/scaffold-plan.ts
 */

import {parsePlan, validatePlan} from './lib/plan.ts';
import {ENUMERABLE_PREFIXES, enumerateSurface} from './lib/surface.ts';

function sourcePrefix(source: string): string {
	return source.split(':', 1)[0];
}

function main(): number {
	const items = parsePlan();
	const {errors} = validatePlan(items);

	if (errors.length) {
		console.error('Plan validation errors:\n');

		for (const error of errors) {
			console.error(`  ✗ ${error}`);
		}

		console.error('');

		return 1;
	}

	const plannedSources = new Set(items.map((item) => item.source));
	const surface = enumerateSurface();

	let gapCount = 0;
	let staleCount = 0;

	console.log('check-plan — does the plan cover the code surface?\n');

	for (const group of surface) {
		const enumerated = new Set(group.anchors);
		const planForPrefix = new Set(
			[...plannedSources].filter(
				(source) => sourcePrefix(source) === group.prefix
			)
		);

		const gaps = [...enumerated].filter(
			(anchor) => !planForPrefix.has(anchor)
		);
		const stale = [...planForPrefix].filter(
			(anchor) => !enumerated.has(anchor)
		);

		gapCount += gaps.length;
		staleCount += stale.length;

		const mark = !gaps.length && !stale.length ? '✓' : '✗';

		console.log(
			`  ${mark} ${group.title.padEnd(22)} ${enumerated.size} in code, ` +
				`${planForPrefix.size} in plan` +
				(gaps.length ? `, ${gaps.length} GAP` : '') +
				(stale.length ? `, ${stale.length} STALE` : '')
		);

		for (const anchor of gaps) {
			console.log(`        GAP   (not in plan): ${anchor}`);
		}

		for (const anchor of stale) {
			console.log(`        STALE (not in code): ${anchor}`);
		}
	}

	// Surface any plan sources whose prefix we do not enumerate, other than the
	// deliberate spec:* requirements.

	const unknown = [...plannedSources].filter(
		(source) =>
			!ENUMERABLE_PREFIXES.includes(sourcePrefix(source)) &&
			sourcePrefix(source) !== 'spec'
	);

	if (unknown.length) {
		console.log('');

		for (const source of unknown) {
			console.log(`  ? unknown Source prefix: ${source}`);
		}
	}

	console.log('');

	if (gapCount || staleCount) {
		console.log(
			`FAIL — ${gapCount} gap(s), ${staleCount} stale row(s). ` +
				`Run \`node scripts/scaffold-plan.ts\` to reconcile.`
		);

		return 1;
	}

	const enumerableInPlan = [...plannedSources].filter((source) =>
		ENUMERABLE_PREFIXES.includes(sourcePrefix(source))
	).length;
	const specInPlan = items.length - enumerableInPlan;

	console.log(
		`OK — plan covers all ${enumerableInPlan} enumerable surface items` +
			` (+${specInPlan} spec-derived flow/cross-cutting items tracked).`
	);

	return 0;
}

process.exit(main());
