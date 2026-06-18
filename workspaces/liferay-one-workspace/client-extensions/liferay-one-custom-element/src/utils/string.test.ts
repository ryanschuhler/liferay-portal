/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {describe, expect, it} from 'vitest';

import {
	removeHTMLTags,
	removeUnnecessaryURLString,
	sanitizeStringForURL,
} from './string';

describe('removeHTMLTags', () => {
	it('strips HTML tags but keeps the text content', () => {
		expect(removeHTMLTags('<p>Hello <strong>World</strong></p>')).toBe(
			'Hello World'
		);
	});

	it('returns plain text unchanged', () => {
		expect(removeHTMLTags('no tags here')).toBe('no tags here');
	});
});

describe('removeUnnecessaryURLString', () => {
	it('trims everything before the /o headless prefix', () => {
		expect(
			removeUnnecessaryURLString(
				'https://example.com/o/headless-admin-user/v1.0/my-user-account'
			)
		).toBe('/o/headless-admin-user/v1.0/my-user-account');
	});
});

describe('sanitizeStringForURL', () => {
	it('lowercases, strips punctuation, and hyphenates whitespace', () => {
		expect(sanitizeStringForURL('  Hello, World!  ')).toBe('hello-world');
	});

	it('collapses repeated whitespace into a single hyphen', () => {
		expect(sanitizeStringForURL('Foo   Bar  Baz')).toBe('foo-bar-baz');
	});
});
