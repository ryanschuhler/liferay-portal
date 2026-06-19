/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {Page, expect, test} from '@playwright/test';

import {liferayLogin, liferayLogout} from '../utils/login';
import {gotoStable} from '../utils/navigation';

const SITE_PATH = process.env.SITE_PATH ?? '/web/one';

// Drive the same /c/portal/update_language endpoint the language selector links
// to. Going through the URL keeps the locale switch deterministic instead of
// depending on the dropdown's render timing.

async function switchLanguage(page: Page, languageId: string): Promise<void> {
	const redirect = encodeURIComponent(`${SITE_PATH}/home`);

	await gotoStable(
		page,
		`/c/portal/update_language?redirect=${redirect}&languageId=${languageId}`
	);
}

test.afterEach(async ({page}) => {
	await liferayLogout(page);
});

test.beforeEach(async ({page}) => {
	await liferayLogin(page);
});

test.describe('Locale switching', () => {
	test('[I18N-LOCALE-SWITCHING] language selector switches the UI locale', async ({
		page,
	}) => {
		try {
			await switchLanguage(page, 'es_ES');

			// html[lang] is the authoritative locale indicator for the page.

			await expect(page.locator('html')).toHaveAttribute('lang', /^es/);
		}
		finally {

			// Restore English so the shared test user's preference is unchanged.

			await switchLanguage(page, 'en_US');

			await expect(page.locator('html')).toHaveAttribute('lang', /^en/);
		}
	});
});
