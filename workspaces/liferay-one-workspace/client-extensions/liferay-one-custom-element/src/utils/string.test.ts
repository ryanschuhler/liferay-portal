/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {afterEach, describe, expect, it, vi} from 'vitest';

import {
	getRandomID,
	normalizeURLProtocol,
	removeHTMLTags,
	removeUnnecessaryURLString,
	sanitizeStringForURL,
} from './string';

afterEach(() => {
	vi.restoreAllMocks();
});

describe('getRandomID', () => {
	it('returns the crypto UUID when available', () => {
		vi.spyOn(crypto, 'randomUUID').mockReturnValue(
			'11111111-2222-3333-4444-555555555555'
		);

		expect(getRandomID()).toBe('11111111-2222-3333-4444-555555555555');
	});

	it('falls back to a dotless liferay id when crypto throws', () => {
		vi.spyOn(crypto, 'randomUUID').mockImplementation(() => {
			throw new Error('unavailable');
		});

		const id = getRandomID();

		expect(id.startsWith('liferay-')).toBe(true);
		expect(id).not.toContain('.');
	});
});

describe('normalizeURLProtocol', () => {
	function setHref(href: string) {
		Object.defineProperty(window, 'location', {
			configurable: true,
			value: {href},
			writable: true,
		});
	}

	it('downgrades https to http when the page is served over http', () => {
		setHref('http://localhost:8080/');

		expect(normalizeURLProtocol('https://cdn.example.com/a.png')).toBe(
			'http://cdn.example.com/a.png'
		);
	});

	it('leaves the url untouched when the page is served over https', () => {
		setHref('https://app.example.com/');

		expect(normalizeURLProtocol('https://cdn.example.com/a.png')).toBe(
			'https://cdn.example.com/a.png'
		);
	});

	it('defaults to an empty string', () => {
		setHref('https://app.example.com/');

		expect(normalizeURLProtocol()).toBe('');
	});
});

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

	it('returns the text unchanged when there is no /o segment', () => {
		expect(removeUnnecessaryURLString('/headless/v1.0/widgets')).toBe(
			'/headless/v1.0/widgets'
		);
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
