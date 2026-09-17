/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

/**
 * Two questions about the import graph that ESLint cannot answer one file at
 * a time: which modules import each other in a cycle, and which exports
 * nothing imports.
 *
 * A cycle is not a style problem. Whichever module in the ring is evaluated
 * first sees the others half-initialized, so a constant read at module scope
 * is undefined in a way that depends on which entry point loaded first.
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

const ENTRY_POINTS = ['main', 'preloadAppData'];

const EXPORT_PATTERN =
	/^export\s+(?:default\s+)?(?:async\s+)?(?:abstract\s+)?(?:const|class|function|type|interface|enum|let)\s+([A-Za-z0-9_$]+)/gm;

const EXPORT_LIST_PATTERN = /^export\s*\{([^}]*)\}/gm;

// A static import decides initialization order, so a ring of them is a real
// defect. A dynamic import('...') is deferred and orders nothing, so it counts
// for reachability but never for cycles — and every lazy loaded page and route
// is reached that way, which is why both forms have to be read.

const DYNAMIC_IMPORT_PATTERN = /\bimport\s*\(\s*['"]([^'"]+)['"]/g;

const STATIC_IMPORT_PATTERN = /from\s*['"]([^'"]+)['"]/g;

// `import type` is erased before the code runs, so it cannot put two modules
// in a ring at initialization time. It still counts for reachability.

const TYPE_ONLY_IMPORT_PATTERN =
	/\bimport\s+type\s+[^;]*?from\s*['"]([^'"]+)['"]/g;

// Captures the clause between `import` and `from` so default, namespace, and
// named bindings can all be attributed to the module they came from.

const IMPORT_CLAUSE_PATTERN =
	/import\s+(?:type\s+)?([^;]*?)\s*from\s*['"]([^'"]+)['"]/g;

const REEXPORT_ALL_PATTERN = /^export\s+\*\s+from\s*['"]([^'"]+)['"]/gm;

const REEXPORT_NAMED_PATTERN =
	/^export\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/gm;

function walk(directory, files = []) {
	for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
		const entryPath = path.join(directory, entry.name);

		if (entry.isDirectory()) {
			walk(entryPath, files);
		}
		else if (/\.tsx?$/.test(entry.name) && !/\.d\.ts$/.test(entry.name)) {
			files.push(entryPath);
		}
	}

	return files;
}

function toModule(filePath) {
	return path
		.relative(SOURCE_DIR, filePath)
		.replace(/\\/g, '/')
		.replace(/\.tsx?$/, '');
}

function resolve(specifier, fromModule, modules) {
	let target;

	if (specifier.startsWith('~/')) {
		target = specifier.slice(2);
	}
	else if (specifier.startsWith('.')) {
		target = path
			.normalize(path.join(path.dirname(fromModule), specifier))
			.replace(/\\/g, '/');
	}
	else {
		return null;
	}

	if (modules.has(target)) {
		return target;
	}

	return modules.has(`${target}/index`) ? `${target}/index` : null;
}

/**
 * The exported names a single import clause pulls in. A namespace import takes
 * everything, so it is recorded as a wildcard. A default export is never
 * reported as dead — util-filename requires one on every single-export file in
 * utils, so an unused default is a rule the workspace already made.
 */

function readBindings(clause) {
	const names = [];
	const braces = clause.match(/\{([^}]*)\}/);

	if (/\*\s+as\s+/.test(clause)) {
		names.push('*');
	}

	const beforeBraces = clause.split('{')[0].replace(/\*\s+as\s+\S+/, '');

	for (const part of beforeBraces.split(',')) {
		if (part.trim()) {
			names.push('default');
		}
	}

	if (braces) {
		for (const name of braces[1].split(',')) {
			const imported = name.split(/\s+as\s+/)[0].trim();

			if (imported) {
				names.push(imported.replace(/^type\s+/, ''));
			}
		}
	}

	return names;
}

function findCycles(graph) {
	const state = new Map();
	const cycles = [];
	const seen = new Set();

	function visit(node, stack) {
		state.set(node, 1);
		stack.push(node);

		for (const next of graph.get(node) ?? []) {
			if (state.get(next) === 1) {
				const ring = stack.slice(stack.indexOf(next));
				const signature = [...ring].sort().join('|');

				if (!seen.has(signature)) {
					seen.add(signature);
					cycles.push([...ring, next]);
				}
			}
			else if (!state.has(next)) {
				visit(next, stack);
			}
		}

		stack.pop();
		state.set(node, 2);
	}

	for (const node of graph.keys()) {
		if (!state.has(node)) {
			visit(node, []);
		}
	}

	return cycles;
}

function main() {
	const files = walk(SOURCE_DIR);
	const modules = new Set(files.map(toModule));

	const graph = new Map();
	const exported = new Map();
	const imported = new Set();

	for (const file of files) {
		const moduleName = toModule(file);
		const source = fs.readFileSync(file, 'utf8');
		const typeOnly = new Set();

		for (const match of source.matchAll(TYPE_ONLY_IMPORT_PATTERN)) {
			const target = resolve(match[1], moduleName, modules);

			if (target) {
				typeOnly.add(target);
			}
		}

		const targets = new Set();

		for (const match of source.matchAll(STATIC_IMPORT_PATTERN)) {
			const target = resolve(match[1], moduleName, modules);

			if (target && !typeOnly.has(target)) {
				targets.add(target);
			}
		}

		graph.set(moduleName, targets);

		for (const match of source.matchAll(DYNAMIC_IMPORT_PATTERN)) {
			const target = resolve(match[1], moduleName, modules);

			if (target) {
				imported.add(`${target}:default`);
			}
		}

		for (const match of source.matchAll(IMPORT_CLAUSE_PATTERN)) {
			const target = resolve(match[2], moduleName, modules);

			if (!target) {
				continue;
			}

			for (const name of readBindings(match[1])) {
				imported.add(`${target}:${name}`);
			}
		}

		for (const match of source.matchAll(REEXPORT_ALL_PATTERN)) {
			const target = resolve(match[1], moduleName, modules);

			if (target) {
				imported.add(`${target}:*`);
			}
		}

		for (const match of source.matchAll(REEXPORT_NAMED_PATTERN)) {
			const target = resolve(match[2], moduleName, modules);

			if (!target) {
				continue;
			}

			for (const name of match[1].split(',')) {
				const source_ = name.split(/\s+as\s+/)[0].trim();

				if (source_) {
					imported.add(
						`${target}:${source_.replace(/^type\s+/, '')}`
					);
				}
			}
		}

		const names = new Set();

		for (const match of source.matchAll(EXPORT_PATTERN)) {
			names.add(match[1]);
		}

		for (const match of source.matchAll(EXPORT_LIST_PATTERN)) {
			for (const name of match[1].split(',')) {
				const exportedName = name
					.split(/\s+as\s+/)
					.pop()
					.trim();

				if (exportedName) {
					names.add(exportedName.replace(/^type\s+/, ''));
				}
			}
		}

		if (names.size) {
			exported.set(moduleName, names);
		}
	}

	const cycles = findCycles(graph);

	for (const cycle of cycles) {
		console.log(`Cycle: ${cycle.join(' -> ')}`);
	}

	const dead = [];

	for (const [moduleName, names] of exported) {
		if (ENTRY_POINTS.includes(moduleName)) {
			continue;
		}

		if (imported.has(`${moduleName}:*`)) {
			continue;
		}

		for (const name of names) {
			if (!imported.has(`${moduleName}:${name}`)) {
				dead.push(`${moduleName}: ${name}`);
			}
		}
	}

	for (const entry of dead.sort()) {
		console.log(`Unimported export: ${entry}`);
	}

	const total = cycles.length + dead.length;

	console.log(
		total
			? `\n${cycles.length} cycle(s), ${dead.length} unimported export(s).`
			: 'No cycles, and every export is imported somewhere.'
	);

	process.exitCode = total ? 1 : 0;
}

main();
