/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

// Standalone dev support: when the app runs under `yarn dev:standalone`
// (VITE_MOCK_LIFERAY=true) there is no Liferay providing the `window.Liferay`
// runtime or hosting the headless APIs. This module supplies a stub that points
// data calls at the mock Liferay server and OAuth2 calls at the local Spring
// Boot service. Everything here is gated by IS_MOCK, so a production build
// (import.meta.env.DEV === false) tree-shakes it away and behaves unchanged.

export const IS_MOCK =
	import.meta.env.DEV && Boolean(import.meta.env.VITE_MOCK_LIFERAY);

export const MOCK_LIFERAY_URL =
	import.meta.env.VITE_MOCK_LIFERAY_URL ?? 'http://localhost:8080';

// Spring Boot is reached through the mock's reverse proxy (same origin as the
// mock, so its CORS handling applies and no Spring Boot CORS config is needed).

export const MOCK_SPRING_BOOT_URL =
	import.meta.env.VITE_MOCK_SPRING_BOOT_URL ??
	`${MOCK_LIFERAY_URL}/spring-boot`;

// Must match liferay-one-etc-spring-boot-oaua.oauth2.user.agent.client.id in
// mock-liferay/routes/dxp, which the Spring Boot resource server validates.

const OAUA_CLIENT_ID = 'liferay-one-mock-oaua-client';

let _tokenPromise: Promise<string> | undefined;

function getMockToken(): Promise<string> {
	if (!_tokenPromise) {
		_tokenPromise = fetch(`${MOCK_LIFERAY_URL}/o/oauth2/token`, {
			body: new URLSearchParams({
				client_id: OAUA_CLIENT_ID,
				grant_type: 'client_credentials',
			}),
			headers: {'Content-Type': 'application/x-www-form-urlencoded'},
			method: 'POST',
		})
			.then((response) => response.json())
			.then((data) => data.access_token as string)
			.catch(() => '');
	}

	return _tokenPromise;
}

// Mirrors Liferay.OAuth2Client: the returned agent's fetch prepends the Spring
// Boot service origin and attaches a mock-minted bearer token.

function fromUserAgentApplication(_agentName: string) {
	return {
		authorizeURL: '',
		clientId: OAUA_CLIENT_ID,
		encodedRedirectURL: '',
		fetch: (async (resource: RequestInfo, options?: RequestInit) => {
			const token = await getMockToken();

			const path = String(resource);

			const url = path.startsWith('http')
				? path
				: `${MOCK_SPRING_BOOT_URL}${path}`;

			const headers = new Headers(options?.headers);

			if (token) {
				headers.set('Authorization', `Bearer ${token}`);
			}

			return fetch(url, {...options, headers});
		}) as typeof fetch,
		homePageURL: MOCK_SPRING_BOOT_URL,
		redirectURIs: [],
		tokenURL: `${MOCK_LIFERAY_URL}/o/oauth2/token`,
	};
}

export function createMockLiferay(): Window['Liferay'] {
	return {
		CommerceContext: {
			account: {accountId: 1, accountName: 'Mock Account'},
			commerceChannelId: '1',
			currency: {currencyCode: 'USD', currencyId: '1'},
		},
		MarketplaceCustomerFlow: {appId: 0},
		OAuth2Client: {FromUserAgentApplication: fromUserAgentApplication},
		Service: () => null,
		ThemeDisplay: {
			getBCP47LanguageId: () => 'en-US',
			getCanonicalURL: () => window.location.href,
			getCompanyGroupId: () => '20119',
			getCompanyId: () => '20099',
			getDefaultLanguageId: () => 'en_US',
			getLanguageId: () => 'en_US',
			getLayoutRelativeURL: () => '',
			getLayoutURL: () => window.location.href,
			getPathContext: () => '',
			getPathThemeImages: () => '/o/classic-theme/images',
			getPortalURL: () => MOCK_LIFERAY_URL,
			getScopeGroupId: () => 20119,
			getURLHome: () => MOCK_LIFERAY_URL,
			getUserEmailAddress: () => 'test@liferay.com',
			getUserId: () => '20124',
			getUserName: () => 'Test Test',
			isSignedIn: () => true,
		},
		Util: {
			LocalStorage:
				localStorage as Window['Liferay']['Util']['LocalStorage'],
			SessionStorage:
				sessionStorage as Window['Liferay']['Util']['SessionStorage'],
			fetch: window.fetch.bind(window),
			navigate: (path: string) => window.location.assign(path),
			openModal: () => undefined,
			openToast: (options) =>
				console.log('[mock-liferay] openToast', options),
		},
		authToken: 'mock-csrf-token',
		detach: (
			type: keyof WindowEventMap,
			callback: EventListenerOrEventListenerObject
		) => window.removeEventListener(type, callback),
		fire: () => null,
		on: (
			type: keyof WindowEventMap,
			callback: EventListenerOrEventListenerObject
		) => window.addEventListener(type, callback),
	};
}
