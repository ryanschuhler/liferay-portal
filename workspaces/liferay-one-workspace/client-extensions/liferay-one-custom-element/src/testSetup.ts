/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import * as matchers from '@testing-library/jest-dom/matchers';
import {cleanup} from '@testing-library/react';
import {afterEach, expect} from 'vitest';

// jsdom has no Liferay global, but many modules (i18n strings, theme helpers)
// read window.Liferay.ThemeDisplay.* at import time. Install a permissive stub
// before any source module is evaluated so those imports do not throw. Tests
// that depend on a specific value override it with vi.mock('../liferay/liferay')
// or vi.spyOn — see date.test.ts.

const themeDisplayStub = new Proxy(
	{},
	{
		get: (_target, property) => {
			if (property === 'getBCP47LanguageId') {
				return () => 'en-US';
			}

			if (typeof property === 'string' && property.includes('Language')) {
				return () => 'en_US';
			}

			return () => '';
		},
	}
);

(window as unknown as {Liferay: unknown}).Liferay = {
	CommerceContext: {},
	ThemeDisplay: themeDisplayStub,
	Util: {
		fetch: () =>
			Promise.resolve({
				json: () => Promise.resolve({}),
			}),
		navigate: () => {},
		openModal: () => {},
		openToast: () => {},
	},
	authToken: '',
	detach: () => {},
	fire: () => null,
	on: () => {},
};

expect.extend(matchers);

afterEach(() => {
	cleanup();
});
