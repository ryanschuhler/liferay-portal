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
	{friendlyURL: '/home', name: 'Home'},
	{friendlyURL: '/my-account', name: 'My Account'},
	{
		friendlyURL: '/my-account/publisher-dashboard',
		name: 'Publisher Dashboard',
	},
	{friendlyURL: '/support', name: 'Support'},
	{friendlyURL: '/support/getting-started', name: 'Getting Started'},
	{
		friendlyURL: '/support/customer-portal-help',
		name: 'Customer Portal Help',
	},
	{friendlyURL: '/support/announcements', name: 'Announcements'},
	{friendlyURL: '/support/business-events', name: 'Business Events'},
	{friendlyURL: '/support/large-file-uploader', name: 'Large File Uploader'},
	{friendlyURL: '/support/ticket-attachments', name: 'Ticket Attachments'},
	{friendlyURL: '/marketplace', name: 'Marketplace'},
	{friendlyURL: '/marketplace/applications', name: 'Applications'},
	{friendlyURL: '/marketplace/products', name: 'Products'},
	{friendlyURL: '/marketplace/solutions', name: 'Solutions'},
	{friendlyURL: '/marketplace/publishers', name: 'Publishers'},
	{friendlyURL: '/admin', name: 'Admin'},
	{friendlyURL: '/product-purchase', name: 'Product Purchase'},
	{friendlyURL: '/search', name: 'Search'},
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

test.describe('Site initializer layouts', () => {
	for (const {friendlyURL, name} of SITE_LAYOUTS) {
		test(`${name} (${friendlyURL}) loads for an authenticated user`, async () => {
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
