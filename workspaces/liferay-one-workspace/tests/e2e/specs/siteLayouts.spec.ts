/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {Page, expect, test} from '@playwright/test';

import {liferayLogin} from '../utils/login';
import {gotoStable} from '../utils/navigation';

// Every layout published by the liferay-one-site-initializer, keyed by its
// friendlyURL. Hidden pages are omitted from navigation but still resolve by
// direct URL, so they belong here too. Keep this list in sync with
// client-extensions/liferay-one-site-initializer/site-initializer/layouts.

const SITE_PATH = process.env.SITE_PATH ?? '/web/one';

const SITE_LAYOUTS = [
	{friendlyURL: '/home', id: 'PAGE-HOME', name: 'Home'},
	{friendlyURL: '/my-account', id: 'PAGE-MY-ACCOUNT', name: 'My Account'},
	{
		friendlyURL: '/my-account/publisher-dashboard',
		id: 'PAGE-MY-ACCOUNT-PUBLISHER-DASHBOARD',
		name: 'Publisher Dashboard',
	},
	{friendlyURL: '/support', id: 'PAGE-SUPPORT', name: 'Support'},
	{
		friendlyURL: '/support/getting-started',
		id: 'PAGE-SUPPORT-GETTING-STARTED',
		name: 'Getting Started',
	},
	{
		friendlyURL: '/support/customer-portal-help',
		id: 'PAGE-SUPPORT-CUSTOMER-PORTAL-HELP',
		name: 'Customer Portal Help',
	},
	{
		friendlyURL: '/support/announcements',
		id: 'PAGE-SUPPORT-ANNOUNCEMENTS',
		name: 'Announcements',
	},
	{
		friendlyURL: '/support/business-events',
		id: 'PAGE-SUPPORT-BUSINESS-EVENTS',
		name: 'Business Events',
	},
	{
		friendlyURL: '/support/large-file-uploader',
		id: 'PAGE-SUPPORT-LARGE-FILE-UPLOADER',
		name: 'Large File Uploader',
	},
	{
		friendlyURL: '/support/ticket-attachments',
		id: 'PAGE-SUPPORT-TICKET-ATTACHMENTS',
		name: 'Ticket Attachments',
	},
	{friendlyURL: '/marketplace', id: 'PAGE-MARKETPLACE', name: 'Marketplace'},
	{
		friendlyURL: '/marketplace/applications',
		id: 'PAGE-MARKETPLACE-APPLICATIONS',
		name: 'Applications',
	},
	{
		friendlyURL: '/marketplace/products',
		id: 'PAGE-MARKETPLACE-PRODUCTS',
		name: 'Products',
	},
	{
		friendlyURL: '/marketplace/solutions',
		id: 'PAGE-MARKETPLACE-SOLUTIONS',
		name: 'Solutions',
	},
	{
		friendlyURL: '/marketplace/publishers',
		id: 'PAGE-MARKETPLACE-PUBLISHERS',
		name: 'Publishers',
	},
	{friendlyURL: '/admin', id: 'PAGE-ADMIN', name: 'Admin'},
	{
		friendlyURL: '/product-purchase',
		id: 'PAGE-PRODUCT-PURCHASE',
		name: 'Product Purchase',
	},
	{friendlyURL: '/search', id: 'PAGE-SEARCH', name: 'Search'},
];

// Share one authenticated session across every layout assertion.

test.describe.configure({mode: 'serial'});

let page: Page;

test.afterAll(async () => {
	await page.close();
});

test.beforeAll(async ({browser}) => {
	page = await browser.newPage();

	await liferayLogin(page);
});

// Plan coverage (page loads): [PAGE-HOME] [PAGE-MY-ACCOUNT]
// [PAGE-MY-ACCOUNT-PUBLISHER-DASHBOARD] [PAGE-SUPPORT]
// [PAGE-SUPPORT-GETTING-STARTED] [PAGE-SUPPORT-CUSTOMER-PORTAL-HELP]
// [PAGE-SUPPORT-ANNOUNCEMENTS] [PAGE-SUPPORT-BUSINESS-EVENTS]
// [PAGE-SUPPORT-LARGE-FILE-UPLOADER] [PAGE-SUPPORT-TICKET-ATTACHMENTS]
// [PAGE-MARKETPLACE] [PAGE-MARKETPLACE-APPLICATIONS]
// [PAGE-MARKETPLACE-PRODUCTS] [PAGE-MARKETPLACE-SOLUTIONS]
// [PAGE-MARKETPLACE-PUBLISHERS] [PAGE-ADMIN] [PAGE-PRODUCT-PURCHASE]
// [PAGE-SEARCH]

test.describe('Site initializer layouts', () => {
	for (const {friendlyURL, id, name} of SITE_LAYOUTS) {
		test(`[${id}] ${name} (${friendlyURL}) loads for an authenticated user`, async () => {
			const response = await gotoStable(
				page,
				`${SITE_PATH}${friendlyURL}`
			);

			expect(response?.status(), `HTTP status for ${friendlyURL}`).toBe(
				200
			);

			expect(page.url(), `landing URL for ${friendlyURL}`).toContain(
				friendlyURL
			);

			await expect(page.locator('body')).toBeVisible();
		});
	}
});
