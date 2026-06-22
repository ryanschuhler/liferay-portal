/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {
	type Request,
	type Response,
	type Router as ExpressRouter,
	Router,
} from 'express';

import {Store} from './store.js';

// A single generic handler that gives every Liferay headless and Objects route
// CRUD semantics over the in-memory store, so the apps' many endpoints work
// without one handler per endpoint:
//
//   GET    /<collection>                       -> Liferay Page of entries
//   GET    /<collection>/<id|erc>              -> one entry (404 if absent)
//   GET    /<collection>/by-external-reference-code/<erc> -> one entry
//   POST   /<collection>                       -> create, returns the entry
//   PATCH  /<collection>/<id|erc>              -> merge, returns the entry
//   PUT    /<collection>/<id|erc>              -> merge, returns the entry
//   DELETE /<collection>/<id|erc>              -> 204
//
// An unknown collection degrades to an empty Page (GET) or an echo (writes)
// and logs a one-time WARN naming the route, so a newly added app route never
// hard-crashes — the log is the to-do list for which fixture to add next.

export function createResourceRouter(store: Store): ExpressRouter {
	const warned = new Set<string>();

	const warn = (method: string, path: string) => {
		const key = `${method} ${path}`;

		if (!warned.has(key)) {
			warned.add(key);

			console.warn(
				`[mock-liferay] UNMATCHED ${key} — returned an empty/echo response. ` +
					`Add a fixture (collectionPath "${collectionPathHint(path)}") if this route needs data.`
			);
		}
	};

	const router = Router();

	router.all(/^\/o\//, (request, response) => {
		handle(store, request, response, warn);
	});

	return router;
}

function collectionPathHint(path: string): string {
	const byExternalReferenceCode = path.match(
		/^(.*)\/by-external-reference-code\/[^/]+$/
	);

	if (byExternalReferenceCode) {
		return byExternalReferenceCode[1];
	}

	const lastSlash = path.lastIndexOf('/');

	const last = path.slice(lastSlash + 1);

	// A trailing numeric segment is almost certainly an id, so hint the parent.

	return /^\d+$/.test(last) ? path.slice(0, lastSlash) : path;
}

function handle(
	store: Store,
	request: Request,
	response: Response,
	warn: (method: string, path: string) => void
): void {
	const method = request.method.toUpperCase();
	const path = request.path;
	const query = request.query as Record<string, unknown>;

	const raw = store.rawResponse(method, path);

	if (raw !== undefined) {
		response.json(raw);

		return;
	}

	const byExternalReferenceCode = path.match(
		/^(.*)\/by-external-reference-code\/([^/]+)$/
	);

	if (byExternalReferenceCode) {
		handleItem(
			store,
			method,
			byExternalReferenceCode[1],
			decodeURIComponent(byExternalReferenceCode[2]),
			request,
			response
		);

		return;
	}

	const lastSlash = path.lastIndexOf('/');
	const parent = path.slice(0, lastSlash);
	const last = decodeURIComponent(path.slice(lastSlash + 1));

	if (method === 'GET') {
		if (store.has(path)) {
			response.json(store.page(path, query));

			return;
		}

		if (store.has(parent)) {
			handleItem(store, method, parent, last, request, response);

			return;
		}

		warn(method, path);

		response.json(store.page(path, query));

		return;
	}

	if (method === 'POST') {
		const known = store.has(path);

		const body =
			request.body &&
			typeof request.body === 'object' &&
			!Array.isArray(request.body)
				? request.body
				: {};

		if (!known) {
			warn(method, path);
		}

		response.status(200).json(store.create(path, body));

		return;
	}

	if (method === 'PATCH' || method === 'PUT' || method === 'DELETE') {
		if (store.has(parent)) {
			handleItem(store, method, parent, last, request, response);

			return;
		}

		warn(method, path);

		if (method === 'DELETE') {
			response.status(204).end();
		}
		else {
			response
				.status(200)
				.json({externalReferenceCode: last, ...request.body});
		}

		return;
	}

	response.status(405).end();
}

function handleItem(
	store: Store,
	method: string,
	collectionPath: string,
	key: string,
	request: Request,
	response: Response
): void {
	if (method === 'GET') {
		const entry = store.find(collectionPath, key);

		if (entry) {
			response.json(entry);
		}
		else {
			notFound(response, `${collectionPath}/${key}`);
		}

		return;
	}

	if (method === 'PATCH' || method === 'PUT') {
		const updated = store.update(collectionPath, key, request.body ?? {});

		if (updated) {
			response.json(updated);
		}
		else {
			notFound(response, `${collectionPath}/${key}`);
		}

		return;
	}

	if (method === 'DELETE') {
		store.remove(collectionPath, key);

		response.status(204).end();

		return;
	}

	response.status(405).end();
}

function notFound(response: Response, path: string): void {
	response.status(404).json({
		status: 'NOT_FOUND',
		title: `No mock entry found for ${path}`,
	});
}
