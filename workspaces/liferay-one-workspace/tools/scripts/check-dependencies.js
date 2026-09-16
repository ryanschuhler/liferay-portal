/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

/**
 * Reconciles the custom element's package.json against what its source
 * actually imports. ESLint sees one file at a time and cannot do this.
 *
 * Reports a dependency nothing imports, and an import nothing declares. The
 * second is the dangerous one: it resolves today only because a transitive
 * dependency happens to hoist it, and breaks whenever that package moves.
 */

const fs = require('fs');
const path = require('path');

const PACKAGE_DIR = path.join(
	__dirname,
	'..',
	'..',
	'client-extensions',
	'liferay-one-custom-element'
);

const SOURCE_DIRECTORIES = ['src', '@vite'];

const ROOT_FILES = ['vite.config.ts', 'vitest.config.ts', 'vitest.setup.ts'];

const NODE_BUILTINS = new Set([
	'assert',
	'buffer',
	'child_process',
	'crypto',
	'events',
	'fs',
	'http',
	'https',
	'os',
	'path',
	'process',
	'stream',
	'url',
	'util',
	'zlib',
]);

const IMPORT_PATTERN =
	/(?:^|[^.\w])(?:import|export)\s[^;]*?from\s*['"]([^'"]+)['"]|(?:^|[^.\w])import\s*\(\s*['"]([^'"]+)['"]\s*\)|(?:^|[^.\w])require\s*\(\s*['"]([^'"]+)['"]\s*\)|(?:^|[^.\w])import\s+['"]([^'"]+)['"]/gm;

// Declared for their side effects, their types, or to satisfy a peer range,
// so no import names them. Add to this list only with the reason.

const IMPLICITLY_USED = new Set([

	// Peer dependency of the other @clayui packages.

	'@clayui/css',

	// Peer of @testing-library/jest-dom.

	'@testing-library/dom',

	'@types/dompurify',
	'@types/react',
	'@types/react-dom',
	'@types/spark-md5',

	// Named in vitest.config.ts as the test environment, never imported.

	'jsdom',

	// Invoked by the build, not imported by the app.

	'typescript',
	'vite',
	'vitest',
]);

/**
 * Packages the build marks external are supplied by the portal at runtime, so
 * they are imported without being declared on purpose.
 */

function getExternals(packageDir) {
	const externals = new Set();

	const config = fs.readFileSync(
		path.join(packageDir, 'vite.config.ts'),
		'utf8'
	);

	const match = config.match(/external:\s*\[([^\]]*)\]/);

	if (!match) {
		return externals;
	}

	for (const specifier of match[1].matchAll(/['"]([^'"]+)['"]/g)) {
		const name = getPackageName(specifier[1]);

		if (name) {
			externals.add(name);
		}
	}

	return externals;
}

function walk(directory, files = []) {
	if (!fs.existsSync(directory)) {
		return files;
	}

	for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
		const entryPath = path.join(directory, entry.name);

		if (entry.isDirectory()) {
			walk(entryPath, files);
		}
		else if (/\.(c|m)?(j|t)sx?$/.test(entry.name)) {
			files.push(entryPath);
		}
	}

	return files;
}

function getPackageName(specifier) {
	if (
		specifier.startsWith('.') ||
		specifier.startsWith('~') ||
		specifier.startsWith('/') ||
		specifier.startsWith('node:')
	) {
		return null;
	}

	const segments = specifier.split('/');

	const name = specifier.startsWith('@')
		? segments.slice(0, 2).join('/')
		: segments[0];

	return NODE_BUILTINS.has(name) ? null : name;
}

function main() {
	const manifest = JSON.parse(
		fs.readFileSync(path.join(PACKAGE_DIR, 'package.json'), 'utf8')
	);

	const declared = new Set([
		...Object.keys(manifest.dependencies ?? {}),
		...Object.keys(manifest.devDependencies ?? {}),
	]);

	const externals = getExternals(PACKAGE_DIR);

	const imported = new Map();

	const files = [
		...SOURCE_DIRECTORIES.flatMap((directory) =>
			walk(path.join(PACKAGE_DIR, directory))
		),
		...ROOT_FILES.map((name) => path.join(PACKAGE_DIR, name)),
	];

	for (const file of files) {
		const source = fs.readFileSync(file, 'utf8');

		let match;

		while ((match = IMPORT_PATTERN.exec(source)) !== null) {
			const name = getPackageName(
				match[1] ?? match[2] ?? match[3] ?? match[4]
			);

			if (!name) {
				continue;
			}

			if (!imported.has(name)) {
				imported.set(name, []);
			}

			imported.get(name).push(path.relative(PACKAGE_DIR, file));
		}
	}

	const unused = [...declared]
		.filter((name) => !imported.has(name) && !IMPLICITLY_USED.has(name))
		.sort();

	const undeclared = [...imported.keys()]
		.filter((name) => !declared.has(name) && !externals.has(name))
		.sort();

	for (const name of unused) {
		console.log(
			`Unused: "${name}" is declared in package.json but nothing imports it. Remove it, or add it to IMPLICITLY_USED with the reason.`
		);
	}

	for (const name of undeclared) {
		const [first, ...rest] = imported.get(name);

		console.log(
			`Undeclared: "${name}" is imported by ${first}${rest.length ? ` and ${rest.length} other file(s)` : ''} but is not in package.json. It resolves only through hoisting today. Declare it.`
		);
	}

	const total = unused.length + undeclared.length;

	console.log(
		total
			? `\n${total} dependency problem(s).`
			: 'Every dependency is declared and used.'
	);

	process.exitCode = total ? 1 : 0;
}

main();
