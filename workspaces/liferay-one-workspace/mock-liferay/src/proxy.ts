/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {type Router as ExpressRouter, Router} from 'express';

import {SPRING_BOOT_TARGET} from './config.js';

// Reverse-proxies /spring-boot/* to the Spring Boot client extension. Mounted
// before the body parser so the raw request stream is forwarded unchanged
// (preserving JSON, form, and multipart uploads). The browser only ever talks
// to the mock origin, so the mock's CORS handling covers these calls too.

export function createSpringBootProxyRouter(): ExpressRouter {
	const router = Router();

	router.all(/^\/spring-boot\//, async (request, response) => {
		const target = `${SPRING_BOOT_TARGET}${request.originalUrl.replace(
			/^\/spring-boot/,
			''
		)}`;

		const headers = new Headers();

		for (const [name, value] of Object.entries(request.headers)) {
			if (['connection', 'content-length', 'host'].includes(name)) {
				continue;
			}

			if (typeof value === 'string') {
				headers.set(name, value);
			}
			else if (Array.isArray(value)) {
				headers.set(name, value.join(','));
			}
		}

		const hasBody = !['GET', 'HEAD'].includes(request.method);

		// duplex is required by Node when streaming a request body but is not in
		// the DOM RequestInit type, so the init object is assembled loosely.

		const init: Record<string, unknown> = {
			headers,
			method: request.method,
		};

		if (hasBody) {
			init.body = request;
			init.duplex = 'half';
		}

		try {
			const upstream = await fetch(target, init as RequestInit);

			response.status(upstream.status);

			upstream.headers.forEach((value, name) => {
				if (!['content-encoding', 'transfer-encoding'].includes(name)) {
					response.setHeader(name, value);
				}
			});

			response.send(Buffer.from(await upstream.arrayBuffer()));
		}
		catch (error) {
			console.error(
				`[mock-liferay] Unable to reach Spring Boot at ${target}`,
				error
			);

			response.status(502).json({
				status: 'BAD_GATEWAY',
				title: `Unable to reach Spring Boot at ${SPRING_BOOT_TARGET}`,
			});
		}
	});

	return router;
}
