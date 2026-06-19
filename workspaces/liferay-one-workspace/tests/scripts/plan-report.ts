/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

/* eslint-disable no-console -- CLI script; console output is its user interface */

/**
 * plan-report — the true go-live picture, beyond the pass/fail of check-coverage.
 *
 * check-coverage counts an item as covered when any test references its ID, so a
 * hard-failing pending stub counts the same as a real test. This report tells
 * the two apart by looking at WHICH file covers each item, classifying every
 * plan item as:
 *
 *   ✓ real      — a non-stub test covers it
 *   ⏳ pending   — only a pending.spec.ts / pendingFlows.spec.ts stub covers it
 *   ✗ uncovered — no test references it
 *   ⊘ deferred  — status is deferred / n/a (excluded from go-live)
 *
 * It prints a per-surface summary and writes a full per-item traceability report
 * to tests/test-results/plan-report.md (gitignored) for sharing / PRs.
 *
 *   node scripts/plan-report.ts
 */

import * as fs from 'fs';
import * as path from 'path';

import {type PlanItem, parsePlan} from './lib/plan.ts';
import {WORKSPACE_ROOT} from './lib/surface.ts';
import {indexTaggedTests} from './lib/tests-index.ts';

const OUTPUT = path.join(WORKSPACE_ROOT, 'tests/test-results/plan-report.md');

type Klass = 'deferred' | 'pending' | 'real' | 'uncovered';

const MARK: Record<Klass, string> = {
	deferred: '⊘ deferred',
	pending: '⏳ pending',
	real: '✓ real',
	uncovered: '✗ uncovered',
};

function isPendingFile(file: string): boolean {
	const base = path.basename(file);

	return base === 'pending.spec.ts' || base === 'pendingFlows.spec.ts';
}

function classify(
	item: PlanItem,
	coverage: Map<string, string[]>
): {files: string[]; klass: Klass} {
	if (item.status !== 'planned') {
		return {files: [], klass: 'deferred'};
	}

	const files = coverage.get(item.id) ?? [];

	if (!files.length) {
		return {files: [], klass: 'uncovered'};
	}

	const realFiles = files.filter((file) => !isPendingFile(file));

	if (!realFiles.length) {
		return {files, klass: 'pending'};
	}

	return {files: realFiles, klass: 'real'};
}

function pct(part: number, whole: number): string {
	if (whole === 0) {
		return '100.0%';
	}

	return `${((part / whole) * 100).toFixed(1)}%`;
}

function bar(part: number, whole: number, width = 24): string {
	const filled = whole === 0 ? width : Math.round((part / whole) * width);

	return `[${'#'.repeat(filled)}${'-'.repeat(width - filled)}]`;
}

function main(): void {
	const items = parsePlan();
	const coverage = indexTaggedTests(new Set(items.map((item) => item.id)));

	const classified = items.map((item) => ({
		...classify(item, coverage),
		item,
	}));

	const count = (klass: Klass, list = classified) =>
		list.filter((entry) => entry.klass === klass).length;

	// Go-live denominator excludes deferred / n/a items.

	const planned = classified.filter((entry) => entry.klass !== 'deferred');
	const real = count('real', planned);

	// Console: per-surface real coverage + an overall summary.

	const files = [...new Set(items.map((item) => item.file))].sort();

	console.log('plan-report — real test coverage vs pending stubs\n');

	for (const file of files) {
		const inFile = planned.filter((entry) => entry.item.file === file);

		if (!inFile.length) {
			continue;
		}

		const realInFile = inFile.filter(
			(entry) => entry.klass === 'real'
		).length;

		console.log(
			`  ${bar(realInFile, inFile.length)} ${pct(realInFile, inFile.length).padStart(6)}  ` +
				`${file.replace(/\.md$/, '').padEnd(20)} ${realInFile}/${inFile.length} real`
		);
	}

	console.log('');
	console.log(
		`  ${bar(real, planned.length)} ${pct(real, planned.length).padStart(6)}  ` +
			`GO-LIVE (real)       ${real}/${planned.length}`
	);
	console.log(
		`           real ${count('real')} · pending ${count('pending')} · ` +
			`uncovered ${count('uncovered')} · deferred ${count('deferred')}`
	);

	// Markdown artifact: full per-item traceability.

	const lines: string[] = [
		'# Liferay One — Testing Plan Report',
		'',
		'Per-requirement status. **Real** = a non-stub test covers it. **Pending** ' +
			'= only a hard-failing stub covers it. **Uncovered** = no test. ' +
			'**Deferred** = excluded from go-live. Regenerate with `yarn plan:report`.',
		'',
		'## Summary',
		'',
		'| Status | Count |',
		'| --- | --- |',
		`| ✓ Real | ${count('real')} |`,
		`| ⏳ Pending | ${count('pending')} |`,
		`| ✗ Uncovered | ${count('uncovered')} |`,
		`| ⊘ Deferred / n/a | ${count('deferred')} |`,
		'',
		`**Go-live (real / planned): ${real}/${planned.length} = ${pct(real, planned.length)}**`,
		'',
	];

	for (const file of files) {
		const inFile = classified.filter((entry) => entry.item.file === file);

		if (!inFile.length) {
			continue;
		}

		lines.push(`## ${file.replace(/\.md$/, '')}`, '');
		lines.push('| ID | Priority | Status | Covered by |');
		lines.push('| --- | --- | --- | --- |');

		for (const {files: coveringFiles, item, klass} of inFile) {
			const covered = coveringFiles.length
				? coveringFiles.join('<br>')
				: '—';

			lines.push(
				`| ${item.id} | ${item.priority} | ${MARK[klass]} | ${covered} |`
			);
		}

		lines.push('');
	}

	fs.mkdirSync(path.dirname(OUTPUT), {recursive: true});
	fs.writeFileSync(OUTPUT, lines.join('\n') + '\n');

	console.log(`\nFull report: ${path.relative(WORKSPACE_ROOT, OUTPUT)}`);
}

main();
