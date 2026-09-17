/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {describe, expect, it} from 'vitest';
import i18n from '~/i18n';

import accountSchemas, {MAX_INVITATIONS_COUNT} from './accountSchemas';

function invite(overrides: Record<string, unknown> = {}) {
	return {
		emailAddress: 'member@liferay.com',
		familyName: 'Doe',
		givenName: 'Jane',
		roleNames: [],
		...overrides,
	};
}

function validate(invites: Record<string, unknown>[]) {
	return accountSchemas.inviteMembers.safeParse({invites});
}

function messagesFor(invites: Record<string, unknown>[]) {
	const result = validate(invites);

	return result.success
		? []
		: result.error.issues.map((issue) => issue.message);
}

describe('accountSchemas.inviteMembers', () => {
	it('accepts a complete invitation', () => {
		expect(validate([invite()]).success).toBe(true);
	});

	it('trims surrounding whitespace off every name and address', () => {
		const result = validate([
			invite({
				emailAddress: '  member@liferay.com  ',
				familyName: ' Doe ',
				givenName: ' Jane ',
			}),
		]);

		expect(result.success && result.data.invites[0]).toEqual(
			invite({roleNames: []})
		);
	});

	it('rejects an address without a domain', () => {
		expect(messagesFor([invite({emailAddress: 'member@liferay'})])).toEqual(
			[i18n.translate('please-enter-a-valid-email-address')]
		);
	});

	it('rejects a name that is only whitespace', () => {
		expect(
			messagesFor([invite({familyName: '   ', givenName: '   '})])
		).toEqual([
			i18n.translate('please-enter-a-valid-last-name'),
			i18n.translate('please-enter-a-valid-first-name'),
		]);
	});

	it('rejects a duplicated address regardless of case', () => {
		const result = validate([
			invite({emailAddress: 'member@liferay.com'}),
			invite({emailAddress: 'MEMBER@liferay.com'}),
		]);

		expect(result.success).toBe(false);
		expect(!result.success && result.error.issues[0]).toMatchObject({
			message: i18n.translate('this-email-address-is-duplicated'),
			path: ['invites', 1, 'emailAddress'],
		});
	});

	it('rejects an empty invitation list', () => {
		expect(validate([]).success).toBe(false);
	});

	it('rejects more invitations than the batch allows', () => {
		const invites = Array.from({length: MAX_INVITATIONS_COUNT}, (
			unused,
			index
		) => invite({emailAddress: `member${index}@liferay.com`}));

		expect(validate(invites).success).toBe(true);
		expect(
			validate([
				...invites,
				invite({
					emailAddress: `member${MAX_INVITATIONS_COUNT}@liferay.com`,
				}),
			]).success
		).toBe(false);
	});
});
