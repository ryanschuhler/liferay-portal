/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {test} from '@playwright/test';

// Hard-failing backlog: every plan item below has no implementable test yet
// (the action matrix, a feature, UI selectors, or seeded state is missing).
// Each test fails with an actionable TODO and turns green when a real test
// replaces it. The [ID] tag makes check-coverage count the item, so a failing
// test here is the difference between "tracked" and "forgotten". Run only the
// implemented tests with: --grep-invert "pending:"

const PENDING: Array<{id: string; todo: string}> = [
	{
		id: 'FLOW-CHECKOUT-PAID',
		todo: 'Paid app checkout: account selection → license → payment method → summary → order placed → confirmation',
	},
	{
		id: 'FLOW-CHECKOUT-FREE',
		todo: 'Free app checkout: account selection → summary → order placed → confirmation',
	},
	{
		id: 'FLOW-CHECKOUT-BANK-TRANSFER',
		todo: 'Bank-transfer checkout reaches the bank-transfer-completed state',
	},
	{
		id: 'FLOW-PUBLISHER-ONBOARDING',
		todo: 'Publisher onboarding: request → approval → publisher profile + assets editable',
	},
	{
		id: 'FLOW-TICKET-UPLOAD',
		todo: 'Ticket attachment upload: initiate → GCS upload → complete → Jira comment',
	},
	{
		id: 'FLOW-BUSINESS-EVENT-LIFECYCLE',
		todo: 'Business event lifecycle: create → edit → record go-live / cancel → activity history',
	},
];

for (const item of PENDING) {
	test(`[${item.id}] pending: not yet implementable`, () => {
		throw new Error(`PENDING ${item.id} — ${item.todo}`);
	});
}
