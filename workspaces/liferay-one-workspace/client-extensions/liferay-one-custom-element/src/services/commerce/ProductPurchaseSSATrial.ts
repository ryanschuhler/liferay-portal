/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ProductPurchase from './ProductPurchase';

import type {OrderTypes} from '~/types/OrderTypes';

export default class ProductPurchaseSSATrial extends ProductPurchase {
	protected override orderTypeExternalReferenceCode: OrderTypes = 'SSA_SAAS';
}
