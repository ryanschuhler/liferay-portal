/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {describe, expect, it} from 'vitest';

import {normalizeURLProtocol, removeHTMLTags} from './stringUtils';

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
