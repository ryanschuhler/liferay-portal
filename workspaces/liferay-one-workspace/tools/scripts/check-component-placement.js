/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

/**
 * Decides where a component belongs by who imports it, which no single file
 * can tell you.
 *
 * A component in src/components is shared, so more than one page must use it.
 * One that only ever serves a single page belongs under that page, where a
 * reader looking at the page can see it. The reverse holds too: a component
 * nested under a page that a second page has started importing is shared now,
 * and belongs in src/components before a third page copies it.
 */

const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(
	__dirname,
	'..',
	'..',
	'client-extensions',
	'liferay-one-custom-element',
	'src'
);

const APP_SHELL = 'the app shell';

const IMPORT_PATTERN = /from\s*['"]([^'"]+)['"]/g;

function walk(directory, files = []) {
	for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
		const entryPath = path.join(directory, entry.name);

		if (entry.isDirectory()) {
			walk(entryPath, files);
		}
		else if (/\.tsx?$/.test(entry.name)) {
			files.push(entryPath);
		}
	}

	return files;
}

function toPosix(filePath) {
	return path.relative(SOURCE_DIR, filePath).replace(/\\/g, '/');
}

/**
 * The page a file belongs to, or null when it is shared. Only the top level
 * page counts — a nested route is still the same page.
 */

function getPage(relativePath) {
	const match = relativePath.match(/^pages\/([^/]+)\//);

	return match ? match[1] : null;
}

function getSharedComponent(relativePath) {
	const match = relativePath.match(/^components\/([^/]+)\//);

	return match ? match[1] : null;
}

function resolveImport(specifier, fromFile) {
	if (specifier.startsWith('~/')) {
		return specifier.slice(2);
	}

	if (specifier.startsWith('.')) {
		return path
			.normalize(path.join(path.dirname(toPosix(fromFile)), specifier))
			.replace(/\\/g, '/');
	}

	return null;
}

function main() {
	const files = walk(SOURCE_DIR);

	// moduleKey -> Set(moduleKey) of the modules it imports.

	const imports = new Map();

	for (const file of files) {
		const relativePath = toPosix(file);
		const source = fs.readFileSync(file, 'utf8');
		const targets = new Set();

		let match;

		while ((match = IMPORT_PATTERN.exec(source)) !== null) {
			const target = resolveImport(match[1], file);

			if (target) {
				targets.add(target);
			}
		}

		imports.set(relativePath, targets);
	}

	/**
	 * Every top level page that reaches a module, directly or through other
	 * shared components. A component pulled in only by another component that
	 * one page uses is still that one page's component.
	 */

	const reachedBy = new Map();

	function visit(moduleKey, page, seen) {
		if (seen.has(moduleKey)) {
			return;
		}

		seen.add(moduleKey);

		if (!reachedBy.has(moduleKey)) {
			reachedBy.set(moduleKey, new Set());
		}

		reachedBy.get(moduleKey).add(page);

		for (const [candidate, targets] of imports) {
			if (candidate !== moduleKey) {
				continue;
			}

			for (const target of targets) {
				visit(target, page, seen);
			}
		}
	}

	for (const [relativePath, targets] of imports) {

		// Anything outside src/pages is the app shell — main.tsx, a provider,
		// the error boundary it mounts. It counts as a consumer so a component
		// the shell uses is not mistaken for one page's private component.

		const page = getPage(relativePath) ?? APP_SHELL;

		if (getSharedComponent(relativePath)) {
			continue;
		}

		for (const target of targets) {
			visit(target, page, new Set());
		}
	}

	const findings = [];

	const sharedComponentPages = new Map();

	for (const [moduleKey, pages] of reachedBy) {
		const component = getSharedComponent(moduleKey);

		if (!component) {
			continue;
		}

		if (!sharedComponentPages.has(component)) {
			sharedComponentPages.set(component, new Set());
		}

		for (const page of pages) {
			sharedComponentPages.get(component).add(page);
		}
	}

	for (const [component, pages] of [...sharedComponentPages].sort()) {
		if (pages.size === 1 && !pages.has(APP_SHELL)) {
			const [page] = pages;

			findings.push(
				`src/components/${component} is reached only from the ${page} page. Move it to src/pages/${page}/components/${component}. src/components is for what more than one page shares.`
			);
		}
	}

	for (const [moduleKey, pages] of [...reachedBy].sort()) {
		const owner = getPage(moduleKey);

		const strangers = [...pages].filter(
			(page) => page !== owner && page !== APP_SHELL
		);

		if (!owner || !strangers.length) {
			continue;
		}

		findings.push(
			`src/${moduleKey} lives under the ${owner} page but ${strangers.sort().join(', ')} reach(es) it too. It is shared now, so lift it out of the page — src/components for a component, src/hooks or src/services otherwise.`
		);
	}

	for (const finding of findings) {
		console.log(finding);
	}

	console.log(
		findings.length
			? `\n${findings.length} component placement problem(s).`
			: 'Every component sits where its consumers say it belongs.'
	);

	process.exitCode = findings.length ? 1 : 0;
}

main();
