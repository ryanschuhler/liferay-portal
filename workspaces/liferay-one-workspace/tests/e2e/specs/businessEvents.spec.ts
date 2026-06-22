/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {Page, expect, test} from '@playwright/test';

import {SPAPage} from '../pages/SPAPage';
import {liferayLogin, liferayLogout} from '../utils/login';

// FLOW: FLOW-BUSINESS-EVENT-LIFECYCLE — create, edit, delete, and activity
// history across ROUTE-BUSINESS-EVENTS-ADD / ROUTE-BUSINESS-EVENTS-EDIT /
// ROUTE-BUSINESS-EVENTS-ACTIVITY-HISTORY and the JiraRestController
// business-events CRUD that backs them.
//
// DEFERRED. Business events are backed by Jira Assets, so this needs a Jira stub
// and an entitled support user with projects. Provision ONE_ENTITLED_EMAIL /
// ONE_ENTITLED_PASSWORD, set ONE_ACCOUNT_KEY, and drop `.fixme`.

const entitledEmail = process.env.ONE_ENTITLED_EMAIL ?? 'test@liferay.com';
const entitledPassword = process.env.ONE_ENTITLED_PASSWORD ?? 'test';
const accountKey = process.env.ONE_ACCOUNT_KEY ?? 'ACCNT-001';

const eventName = 'Quarterly Maintenance Window';

function businessEventsPage(page: Page, suffix = '') {
	return new SPAPage(
		page,
		`/web/one/support/business-events#/${accountKey}/business-events${suffix}`
	);
}

test.afterEach(async ({page}) => {
	await liferayLogout(page);
});

test.beforeEach(async ({page}) => {
	await liferayLogin(page, entitledEmail, entitledPassword);
});

test.describe.fixme(
	'[FLOW-BUSINESS-EVENT-LIFECYCLE] business event lifecycle',
	() => {

		// Create, edit, and delete share one event and must run in order; serial
		// mode stops a failed create from cascading into confusing edit/delete
		// failures.

		test.describe.configure({mode: 'serial'});

		test('[FLOW-BUSINESS-EVENT-LIFECYCLE] [ROUTE-BUSINESS-EVENTS-ADD] creates a business event', async ({
			page,
		}) => {
			const spaPage = businessEventsPage(page);

			await spaPage.goto();

			await expect(spaPage.customElement.first()).toBeAttached();

			await page.getByRole('button', {name: /add/i}).click();

			await page.getByLabel(/event name|name/i).fill(eventName);
			await page.getByLabel(/type/i).selectOption({index: 1});
			await page.getByRole('button', {name: /save|create/i}).click();

			// The new event appears in the list table.

			await expect(
				page.getByRole('cell', {name: eventName})
			).toBeVisible();
		});

		test('[FLOW-BUSINESS-EVENT-LIFECYCLE] [ROUTE-BUSINESS-EVENTS-EDIT] edits and views the activity history', async ({
			page,
		}) => {
			const spaPage = businessEventsPage(page);

			await spaPage.goto();

			await page.getByRole('cell', {name: eventName}).click();

			await page.getByRole('button', {name: /edit/i}).click();
			await page.getByLabel(/description/i).fill('Rescheduled to Sunday');
			await page.getByRole('button', {name: /save/i}).click();

			await expect(
				page.getByText(/rescheduled to sunday/i)
			).toBeVisible();

			// [ROUTE-BUSINESS-EVENTS-ACTIVITY-HISTORY] the edit is recorded.

			await page.getByRole('tab', {name: /activity history/i}).click();

			await expect(
				page.getByText(/updated|edited|changed/i).first()
			).toBeVisible();
		});

		test('[FLOW-BUSINESS-EVENT-LIFECYCLE] deletes a business event', async ({
			page,
		}) => {
			const spaPage = businessEventsPage(page);

			await spaPage.goto();

			const eventRow = page.getByRole('row', {
				name: new RegExp(eventName, 'i'),
			});

			await eventRow.getByRole('button').last().click();
			await page.getByRole('menuitem', {name: /delete/i}).click();
			await page
				.getByRole('button', {name: /confirm|delete|ok/i})
				.click();

			await expect(page.getByRole('cell', {name: eventName})).toHaveCount(
				0
			);
		});
	}
);
