/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {Page, expect} from '@playwright/test';

import {gotoStable} from './navigation';

const HEADING_SELECTOR = 'h1, h2, h3, h4, h5, h6, [role="heading"]';

/**
 * Asserts that the `liferay-one-custom-element` SPA has booted and rendered at
 * the current location: the web component is attached and it has put a first
 * header or other visible content on the page. This is a deliberately loose
 * health check — it proves React mounted and rendered *something*, not that any
 * particular page loaded its data.
 *
 * A route can legitimately resolve to several rendered states on a fresh local:
 * the page's own view (a semantic heading), the restricted view for an
 * entitlement-gated page group, or an empty state when seeded data or a query
 * parameter is missing. All three count as "the React app is working", so the
 * check accepts a visible heading inside the custom element, any non-empty
 * visible text it rendered, or a page-level restricted message.
 */
export async function expectCustomElementRenders(
	page: Page,
	path: string,
	{timeout = 30000}: {timeout?: number} = {}
): Promise<void> {
	const customElements = page.locator('liferay-one-custom-element');

	await expect(
		customElements.first(),
		`expected the custom element to mount at ${path}`
	).toBeAttached({timeout});

	await expect
		.poll(
			async () => {
				const count = await customElements.count();

				for (let index = 0; index < count; index++) {
					const element = customElements.nth(index);

					const heading = element.locator(HEADING_SELECTOR).first();

					if (await heading.isVisible().catch(() => false)) {
						return true;
					}

					const text = (
						await element.innerText().catch(() => '')
					).trim();

					if (text.length > 0) {
						return true;
					}
				}

				// Gated page groups can render a portal-level restricted view
				// outside the custom element; that still proves the page mounted
				// and the gate held.

				return page
					.getByText(/restricted/i)
					.first()
					.isVisible()
					.catch(() => false);
			},
			{
				message: `expected the SPA to render a first header or visible content at ${path}`,
				timeout,
			}
		)
		.toBe(true);
}

/**
 * Navigates to a custom-element route and asserts the SPA rendered there.
 */
export async function gotoAndExpectRender(
	page: Page,
	path: string,
	options?: {timeout?: number}
): Promise<void> {
	await gotoStable(page, path);

	await expectCustomElementRenders(page, path, options);
}
