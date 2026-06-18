/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {describe, expect, it} from 'vitest';

import getKebabCase from './getKebabCase';

describe('getKebabCase', () => {
	it('converts PascalCase to kebab-case', () => {
		expect(getKebabCase('PublisherDashboard')).toBe('publisher-dashboard');
		expect(getKebabCase('LicenseKey')).toBe('license-key');
	});

	it('converts camelCase to kebab-case', () => {
		expect(getKebabCase('businessEvents')).toBe('business-events');
		expect(getKebabCase('supportTicket')).toBe('support-ticket');
	});

	it('returns an empty string for empty input', () => {
		expect(getKebabCase('')).toBe('');
	});
});
