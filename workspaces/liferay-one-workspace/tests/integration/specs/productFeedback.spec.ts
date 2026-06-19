/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {expect} from '@playwright/test';

import {apiTest as test} from '../fixtures/apiTest';

type ProductFeedback = {
	emailAddress: string;
	fullName: string;
	id: number;
};

const PATH = '/o/c/productfeedbacks';

test.describe('Object CRUD — ProductFeedback', () => {
	test('[OBJ-PRODUCTFEEDBACK] round-trips create, read, and delete', async ({
		api,
	}) => {
		const created = await api.post<ProductFeedback>(PATH, {
			emailAddress: 'integration-probe@liferay.com',
			fullName: 'Integration Probe',
			ratingSatisfaction: 5,
		});

		expect(created.id).toBeGreaterThan(0);

		try {
			const fetched = await api.get<ProductFeedback>(
				`${PATH}/${created.id}`
			);

			expect(fetched.emailAddress).toBe('integration-probe@liferay.com');
			expect(fetched.fullName).toBe('Integration Probe');
		}
		finally {
			await api.delete(`${PATH}/${created.id}`);
		}

		const afterDelete = await api.send('get', `${PATH}/${created.id}`);

		expect(afterDelete.status()).toBe(404);
	});

	test('[OBJ-PRODUCTFEEDBACK] rejects a create that omits required fields', async ({
		api,
	}) => {
		const response = await api.send('post', PATH, {
			companyName: 'Missing Required Fields',
		});

		expect(response.status()).toBe(400);
	});
});
