/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {expect, test} from '@playwright/test';

import {SPAPage} from '../pages/SPAPage';
import {liferayLogin, liferayLogout} from '../utils/login';

// FLOW: FLOW-TICKET-UPLOAD — attachment upload through the custom element.
// Selecting an account and ticket (ROUTE-ATTACHMENTS-NEW) and uploading a file
// (ROUTE-ATTACHMENTS-NEW-TICKETID) initiates a GCS resumable session
// (REST-POST-TICKET-ATTACHMENTS-INITIATE-UPLOAD), completes with an MD5 check and
// posts a Jira comment (REST-POST-TICKET-ATTACHMENTS-TICKETATTACHMENTID-COMPLETE-UPLOAD),
// with CRON-SCHEDULEDUPDATETICKETATTACHMENTDRAFTCOMMENTBODY as the comment-retry
// fallback.
//
// DEFERRED. Needs Jira + GCS stubs and an entitled support user with upload
// access. Provision ONE_ENTITLED_EMAIL / ONE_ENTITLED_PASSWORD and drop `.fixme`.

const entitledEmail = process.env.ONE_ENTITLED_EMAIL ?? 'test@liferay.com';
const entitledPassword = process.env.ONE_ENTITLED_PASSWORD ?? 'test';

test.afterEach(async ({page}) => {
	await liferayLogout(page);
});

test.beforeEach(async ({page}) => {
	await liferayLogin(page, entitledEmail, entitledPassword);
});

test.describe.fixme('[FLOW-TICKET-UPLOAD] ticket attachment upload', () => {
	test('[FLOW-TICKET-UPLOAD] [ROUTE-ATTACHMENTS-NEW] uploads an attachment to a selected ticket', async ({
		page,
	}) => {
		const spaPage = new SPAPage(
			page,
			'/web/one/support/ticket-attachments#/new'
		);

		await spaPage.goto();

		await expect(spaPage.customElement.first()).toBeAttached();

		// Select an account, then the tickets for that account load.

		const [accountSelect, ticketSelect] = await page
			.getByRole('combobox')
			.all();

		await accountSelect.selectOption({index: 1});
		await expect(ticketSelect).toBeEnabled();
		await ticketSelect.selectOption({index: 1});

		// [ROUTE-ATTACHMENTS-NEW-TICKETID] the uploader opens for the ticket.

		await page.getByRole('button', {name: /continue|next|upload/i}).click();

		await page.locator('input[type="file"]').setInputFiles({
			buffer: Buffer.from('attachment contents'),
			mimeType: 'text/plain',
			name: 'evidence.txt',
		});

		await page.getByRole('button', {name: /upload|submit|attach/i}).click();

		// The resumable upload completes and the attachment is listed.

		await expect(page.getByText(/evidence\.txt/i)).toBeVisible({
			timeout: 30000,
		});

		await expect(
			page.getByText(/uploaded|complete|success/i).first()
		).toBeVisible();
	});
});
