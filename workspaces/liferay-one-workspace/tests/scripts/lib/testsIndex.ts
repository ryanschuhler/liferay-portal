/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import * as fs from 'fs';
import * as path from 'path';

import {type PlanItem} from './plan.ts';
import {
	WORKSPACE_ROOT,
	enumerateConverters,
	enumerateRestEndpointDetails,
	enumerateRouteDeclarations,
	enumerateServices,
	enumerateSubscribers,
} from './surface.ts';

interface TestRoot {
	dir: string;
	match: (file: string) => boolean;
}

const CUSTOM_ELEMENT_SRC = path.join(
	WORKSPACE_ROOT,
	'client-extensions/liferay-one-custom-element/src'
);

const SPRING_BOOT_TEST_JAVA = path.join(
	WORKSPACE_ROOT,
	'client-extensions/liferay-one-etc-spring-boot/src/test'
);

const TEST_ROOTS: TestRoot[] = [
	{
		dir: path.join(WORKSPACE_ROOT, 'tests'),
		match: (file) => file.endsWith('.spec.ts'),
	},
	{
		dir: CUSTOM_ELEMENT_SRC,
		match: (file) => /\.(test|spec)\.tsx?$/.test(file),
	},
	{
		dir: SPRING_BOOT_TEST_JAVA,
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

export interface CoverageEntry {
	file: string;
	inferred: boolean;
}

const ID_PATTERN = /[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+/g;

function addCoverage(
	coverage: Map<string, CoverageEntry[]>,
	id: string,
	file: string,
	inferred: boolean
): void {
	const entries = coverage.get(id) ?? [];
	const existing = entries.find((entry) => entry.file === file);

	if (existing) {
		existing.inferred = existing.inferred && inferred;
	}
	else {
		entries.push({file, inferred});
	}

	coverage.set(id, entries);
}

/**
 * Scans every test suite for explicit plan-ID tags — the strongest signal a
 * test claims an item, because the author wrote the ID down.
 */
function indexExplicitTags(
	coverage: Map<string, CoverageEntry[]>,
	knownIds: Set<string>
): void {
	for (const root of TEST_ROOTS) {
		for (const file of walk(root.dir, root.match)) {
			const source = fs.readFileSync(file, 'utf8');
			const relative = path.relative(WORKSPACE_ROOT, file);

			for (const match of source.matchAll(ID_PATTERN)) {
				if (!knownIds.has(match[0])) {
					continue;
				}

				addCoverage(coverage, match[0], relative, false);
			}
		}
	}
}

interface JavaClassKind {
	anchorPrefix: string;
	names: string[];
	suffix: string;
}

function javaClassKinds(): JavaClassKind[] {
	const names = (anchors: string[]) =>
		anchors.map((anchor) => anchor.slice(anchor.indexOf(':') + 1));

	return [
		{
			anchorPrefix: 'converter',
			names: names(enumerateConverters()),
			suffix: 'Converter',
		},
		{
			anchorPrefix: 'service',
			names: names(enumerateServices()),
			suffix: 'Service',
		},
		{
			anchorPrefix: 'subscriber',
			names: names(enumerateSubscribers()),
			suffix: 'Subscriber',
		},
	];
}

/**
 * Resolves the surface class a `<Class>Test.java` file exercises. An exact name
 * match wins; otherwise the candidate may be the tail of exactly one surface
 * class name (`BusinessEventConverterTest` covers `JiraBusinessEventConverter`)
 * and only when the test source names that class outright. Anything ambiguous
 * resolves to null rather than crediting the wrong item.
 */
function resolveJavaClassAnchor(
	candidate: string,
	kind: JavaClassKind,
	source: string
): string | null {
	if (kind.names.includes(candidate)) {
		return `${kind.anchorPrefix}:${candidate}`;
	}

	const tailMatches = kind.names.filter((name) => name.endsWith(candidate));

	if (
		tailMatches.length === 1 &&
		new RegExp(`\\b${tailMatches[0]}\\b`).test(source)
	) {
		return `${kind.anchorPrefix}:${tailMatches[0]}`;
	}

	return null;
}

/**
 * Credits `<Class>Test.java` to the converter, service, or subscriber it is
 * named after.
 */
function inferJavaClassCoverage(
	coverage: Map<string, CoverageEntry[]>,
	idBySource: Map<string, string>
): void {
	const kinds = javaClassKinds();

	for (const file of walk(SPRING_BOOT_TEST_JAVA, (candidate) =>
		candidate.endsWith('Test.java')
	)) {
		const candidate = path.basename(file, '.java').replace(/Test$/, '');
		const kind = kinds.find((entry) => candidate.endsWith(entry.suffix));

		if (!kind) {
			continue;
		}

		const source = fs.readFileSync(file, 'utf8');
		const anchor = resolveJavaClassAnchor(candidate, kind, source);
		const id = anchor ? idBySource.get(anchor) : undefined;

		if (id) {
			addCoverage(coverage, id, path.relative(WORKSPACE_ROOT, file), true);
		}
	}
}

/**
 * Credits `<Controller>Test.java` to the endpoints of that controller it
 * actually calls. The controller tests drive the handler methods directly
 * through a `<controller>` local, so a call on that receiver is proof the
 * endpoint is exercised; endpoints sharing an overloaded handler name are
 * skipped because the call does not say which one ran.
 */
function inferRestControllerCoverage(
	coverage: Map<string, CoverageEntry[]>,
	idBySource: Map<string, string>
): void {
	const controllers = new Map<string, Map<string, string[]>>();

	for (const endpoint of enumerateRestEndpointDetails()) {
		if (!endpoint.methodName) {
			continue;
		}

		const controller = path.basename(endpoint.file, '.java');
		const byMethodName =
			controllers.get(controller) ?? new Map<string, string[]>();
		const anchors = byMethodName.get(endpoint.methodName) ?? [];

		anchors.push(endpoint.anchor);
		byMethodName.set(endpoint.methodName, anchors);
		controllers.set(controller, byMethodName);
	}

	for (const file of walk(SPRING_BOOT_TEST_JAVA, (candidate) =>
		candidate.endsWith('Test.java')
	)) {
		const candidate = path.basename(file, '.java').replace(/Test$/, '');
		const source = fs.readFileSync(file, 'utf8');

		for (const [controller, byMethodName] of controllers) {
			if (!candidate.startsWith(controller)) {
				continue;
			}

			const receiver =
				controller.charAt(0).toLowerCase() + controller.slice(1);
			const calls = new Set(
				[
					...source.matchAll(
						new RegExp(`(?:^|[^\\w.])_?${receiver}\\.(\\w+)\\s*\\(`, 'g')
					),
				].map((match) => match[1])
			);

			for (const [methodName, anchors] of byMethodName) {
				if (anchors.length !== 1 || !calls.has(methodName)) {
					continue;
				}

				const id = idBySource.get(anchors[0]);

				if (id) {
					addCoverage(
						coverage,
						id,
						path.relative(WORKSPACE_ROOT, file),
						true
					);
				}
			}
		}
	}
}

/**
 * Credits an SPA unit suite to the routes declared by the route tables it imports
 * — but only the paths the test spells out, so a suite that asserts one
 * conditional step table does not claim the rest of the group.
 */
function inferRouteCoverage(
	coverage: Map<string, CoverageEntry[]>,
	idBySource: Map<string, string>
): void {
	const declarationsByFile = new Map<string, Set<string>>();

	for (const declaration of enumerateRouteDeclarations()) {
		const anchors = declarationsByFile.get(declaration.file) ?? new Set();

		anchors.add(declaration.anchor);
		declarationsByFile.set(declaration.file, anchors);
	}

	for (const file of walk(CUSTOM_ELEMENT_SRC, (candidate) =>
		/\.(test|spec)\.tsx?$/.test(candidate)
	)) {
		const source = fs.readFileSync(file, 'utf8');

		for (const routesFile of importedRouteFiles(
			file,
			source,
			declarationsByFile
		)) {
			for (const anchor of declarationsByFile.get(routesFile) ?? []) {
				const routePath = anchor.slice(anchor.lastIndexOf(':') + 1);

				if (
					!source.includes(`'${routePath}'`) &&
					!source.includes(`"${routePath}"`)
				) {
					continue;
				}

				const id = idBySource.get(anchor);

				if (id) {
					addCoverage(
						coverage,
						id,
						path.relative(WORKSPACE_ROOT, file),
						true
					);
				}
			}
		}
	}
}

/**
 * Resolves the route-table modules a test file imports, through either a
 * relative specifier or the `~/` source alias. Only specifiers that land on a
 * file the surface scan already read routes out of are kept.
 */
function importedRouteFiles(
	file: string,
	source: string,
	declarationsByFile: Map<string, Set<string>>
): string[] {
	const files = new Set<string>();

	for (const match of source.matchAll(/from\s+'([^']+)'/g)) {
		const specifier = match[1];

		let resolved = null;

		if (specifier.startsWith('.')) {
			resolved = path.resolve(path.dirname(file), specifier);
		}
		else if (specifier.startsWith('~/')) {
			resolved = path.join(CUSTOM_ELEMENT_SRC, specifier.slice(2));
		}

		if (resolved && declarationsByFile.has(`${resolved}.tsx`)) {
			files.add(`${resolved}.tsx`);
		}
	}

	return [...files].sort();
}

/**
 * Maps every plan item to the test files covering it. An explicit plan-ID tag
 * is authoritative; on top of it, the naming conventions of the suites credit
 * the items a test class is named after, marked `inferred` so the report can
 * tell the weaker signal apart.
 */
export function indexTests(items: PlanItem[]): Map<string, CoverageEntry[]> {
	const coverage = new Map<string, CoverageEntry[]>();

	const idBySource = new Map(items.map((item) => [item.source, item.id]));

	inferJavaClassCoverage(coverage, idBySource);
	inferRestControllerCoverage(coverage, idBySource);
	inferRouteCoverage(coverage, idBySource);

	indexExplicitTags(
		coverage,
		new Set(items.map((item) => item.id))
	);

	return coverage;
}

export interface OrphanTag {
	file: string;
	id: string;
}

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
