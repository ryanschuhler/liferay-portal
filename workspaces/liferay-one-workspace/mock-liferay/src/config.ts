/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

export const PORT = Number(process.env.MOCK_LIFERAY_PORT ?? 8080);

// The issuer/host the mock advertises. Spring Boot reaches the mock at this
// host (shared network namespace in docker-compose.standalone.yaml), and the
// browser reaches it at the same published port. The Spring Boot resource
// server does not validate the issuer claim, so this value is cosmetic.

export const ISSUER =
	process.env.MOCK_LIFERAY_ISSUER ?? `http://localhost:${PORT}`;

// OAuth client IDs the mock issues and the Spring Boot resource server
// validates. OAUA_CLIENT_ID MUST match
// "liferay-one-etc-spring-boot-oaua.oauth2.user.agent.client.id" in the
// committed routes configtree (mock-liferay/routes/dxp): the resource server
// rejects any JWT whose "client_id" claim is not a registered user agent
// client id.

export const OAUA_CLIENT_ID = 'liferay-one-mock-oaua-client';
export const OAHS_CLIENT_ID = 'liferay-one-mock-oahs-client';
export const OAHS_CLIENT_SECRET = 'myfancypassword';

// The JSON Web Key id published in the JWKS and stamped on every minted token.

export const KID = 'liferay-one-mock-key';

// The Spring Boot service the mock reverse-proxies under /spring-boot/*. The
// browser calls the mock (same origin, CORS-enabled) instead of the Spring
// Boot port directly, so the app's OAuth2-backed calls work without adding
// CORS to Spring Boot. Reachable at localhost:58081 both from the mock
// container (shared network namespace) and when the mock runs on the host.

export const SPRING_BOOT_TARGET =
	process.env.MOCK_SPRING_BOOT_TARGET ?? 'http://localhost:58081';
