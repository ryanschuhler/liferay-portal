/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {Locator, Page} from '@playwright/test';

import {BasePage} from './BasePage';

/**
 * A page hosting the `liferay-one-custom-element` SPA. The custom element mounts
 * one of the page-group routers (admin, my-account, product-purchase, …) chosen
 * by the widget instance's `route` attribute; `customElement` is the mount point
 * an e2e test waits on to prove the SPA rendered.
 */
export class SPAPage extends BasePage {
	readonly customElement: Locator;

	constructor(page: Page, path: string) {
		super(page);

		this._path = path;

		this.customElement = page.locator('liferay-one-custom-element');
	}

	async goto() {
		await this.navigateTo(this._path);
	}

	private readonly _path: string;
}
