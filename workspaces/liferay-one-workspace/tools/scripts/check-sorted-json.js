/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

/**
 * code-style.md requires JSON array items to be sorted. ESLint's jsonc rules
 * sort object keys, which is a different thing and already passes here.
 *
 * An unsorted array is not a style problem on its own. These files are read as
 * diffs during review, and an entry appended to the end rather than placed in
 * order hides whether it is new or moved, which is how a duplicate or a
 * dropped entry gets through.
 */

const fs = require('fs');
const path = require('path');

/**
 * Batch definitions only. Almost everything under site-initializer is
 * order-bearing — a navigation menu's array order is the order the menu
 * renders in, a fragment's fieldSets order is the order the configuration
 * panel shows, and list type entries render in the order they are defined.
 * Sorting those alphabetically would change the product, not tidy it.
 *
 * A batch file is a set of upserts keyed by externalReferenceCode. Order
 * carries nothing, so it can carry the reader instead.
 */

const TARGETS = ['client-extensions/liferay-one-batch/batch'];

const SORT_KEYS = ['externalReferenceCode', 'key'];

/**
 * Only arrays whose order carries nothing. This is an allowlist rather than a
 * blocklist on purpose: most nested arrays in these files are sequences, and
 * alphabetizing one changes the product. objectStates is a state machine whose
 * first entry is the initial state, optionValues is the order a dropdown
 * renders, and a navigation menu is the menu. The two here are sets — a batch
 * file's upserts, and the actions hung off one object.
 */

const SORTABLE = [/^items$/, /(^|\.)objectActions$/];

const WORKSPACE_DIR = path.join(__dirname, '..', '..');

function walk(directory, files = []) {
	if (!fs.existsSync(directory)) {
		return files;
	}

	for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
		const entryPath = path.join(directory, entry.name);

		if (entry.isDirectory()) {
			walk(entryPath, files);
		}
		else if (entry.name.endsWith('.json')) {
			files.push(entryPath);
		}
	}

	return files;
}

/**
 * The key every element of an array carries, if there is one. Without a shared
 * key the order is the author's, not something to enforce.
 */

function getSortKey(items) {
	if (items.length < 2 || items.some((item) => typeof item !== 'object')) {
		return null;
	}

	return (
		SORT_KEYS.find((key) =>
			items.every((item) => item && typeof item[key] === 'string')
		) ?? null
	);
}

function check(value, trail, findings) {
	if (Array.isArray(value)) {
		const key = SORTABLE.some((pattern) => pattern.test(trail))
			? getSortKey(value)
			: null;

		if (key) {
			const actual = value.map((item) => item[key]);

			// Plain codepoint order, which is what jsonc/sort-keys and the
			// source formatter use. localeCompare ignores punctuation and
			// would disagree with both on keys carrying underscores.

			const sorted = [...actual].sort();

			const at = actual.findIndex(
				(entry, index) => entry !== sorted[index]
			);

			if (at !== -1) {
				findings.push({
					at,
					expected: sorted[at],
					found: actual[at],
					key,
					trail: trail || '(root)',
				});
			}
		}

		value.forEach((item, index) =>
			check(item, `${trail}[${index}]`, findings)
		);

		return;
	}

	if (value && typeof value === 'object') {
		for (const [name, child] of Object.entries(value)) {
			check(child, trail ? `${trail}.${name}` : name, findings);
		}
	}
}

function main() {
	let total = 0;

	for (const target of TARGETS) {
		for (const file of walk(path.join(WORKSPACE_DIR, target))) {
			let parsed;

			try {
				parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
			}
			catch {
				continue;
			}

			const findings = [];

			check(parsed, '', findings);

			for (const finding of findings) {
				console.log(
					`${path.relative(WORKSPACE_DIR, file)}: ${finding.trail} is not sorted by ${finding.key} — position ${finding.at} is "${finding.found}", expected "${finding.expected}".`
				);
			}

			total += findings.length;
		}
	}

	console.log(
		total
			? `\n${total} unsorted array(s).`
			: 'Every keyed JSON array is sorted.'
	);

	process.exitCode = total ? 1 : 0;
}

main();
