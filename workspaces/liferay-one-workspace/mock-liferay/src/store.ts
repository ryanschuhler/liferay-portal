/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

// An in-memory model of Liferay's headless and Objects data. Each distinct
// resource collection (e.g. "/o/c/businessevents",
// "/o/headless-admin-user/v1.0/accounts") is stored as an ordered list of
// entries. Writes mutate the list so create/update/delete round-trip during a
// dev session; restarting the mock reseeds from fixtures.

export type Entry = Record<string, any>;

export interface LiferayPage {
	actions: Record<string, unknown>;
	facets: unknown[];
	items: Entry[];
	lastPage: number;
	page: number;
	pageSize: number;
	totalCount: number;
}

export class Store {
	private readonly _collections = new Map<string, Entry[]>();

	private readonly _raw = new Map<string, unknown>();

	private _sequence = 1000;

	// Raw responses are returned verbatim for an exact "METHOD path" match,
	// before any generic collection handling. Use them for singleton resources
	// (e.g. /o/headless-admin-user/v1.0/my-user-account) and any endpoint whose
	// response is not a Liferay Page.

	rawResponse(method: string, path: string): unknown | undefined {
		return (
			this._raw.get(`${method} ${path}`) ?? this._raw.get(`GET ${path}`)
		);
	}

	seedRaw(method: string, path: string, response: unknown): void {
		this._raw.set(`${method.toUpperCase()} ${path}`, response);
	}

	collection(path: string): Entry[] {
		let entries = this._collections.get(path);

		if (!entries) {
			entries = [];

			this._collections.set(path, entries);
		}

		return entries;
	}

	create(path: string, entry: Entry): Entry {
		const id = entry.id ?? this.nextId();

		const stored: Entry = {
			id,
			...entry,
			externalReferenceCode: entry.externalReferenceCode ?? `mock-${id}`,
		};

		this.collection(path).push(stored);

		return stored;
	}

	find(path: string, key: string): Entry | undefined {
		return this.collection(path).find((entry) => matchesKey(entry, key));
	}

	has(path: string): boolean {
		return this._collections.has(path);
	}

	nextId(): number {
		return ++this._sequence;
	}

	page(path: string, query: Record<string, unknown>): LiferayPage {
		return toPage(this.collection(path), query);
	}

	remove(path: string, key: string): boolean {
		const entries = this.collection(path);

		const index = entries.findIndex((entry) => matchesKey(entry, key));

		if (index === -1) {
			return false;
		}

		entries.splice(index, 1);

		return true;
	}

	seed(path: string, entries: Entry[]): void {
		this._collections.set(path, entries.slice());

		for (const entry of entries) {
			const numericId = Number(entry.id);

			if (Number.isFinite(numericId) && numericId > this._sequence) {
				this._sequence = numericId;
			}
		}
	}

	update(path: string, key: string, patch: Entry): Entry | undefined {
		const entry = this.find(path, key);

		if (!entry) {
			return undefined;
		}

		Object.assign(entry, patch);

		return entry;
	}
}

function matchesKey(entry: Entry, key: string): boolean {
	return (
		String(entry.id) === key || String(entry.externalReferenceCode) === key
	);
}

function toPage(entries: Entry[], query: Record<string, unknown>): LiferayPage {
	const page = Math.max(1, Number(query.page ?? 1) || 1);
	const pageSize = Math.max(0, Number(query.pageSize ?? 20) || 20);

	const start = (page - 1) * pageSize;

	const items =
		pageSize > 0 ? entries.slice(start, start + pageSize) : entries;

	return {
		actions: {},
		facets: [],
		items,
		lastPage:
			pageSize > 0
				? Math.max(1, Math.ceil(entries.length / pageSize))
				: 1,
		page,
		pageSize,
		totalCount: entries.length,
	};
}
