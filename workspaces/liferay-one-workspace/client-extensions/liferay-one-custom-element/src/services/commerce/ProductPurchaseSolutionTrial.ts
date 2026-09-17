/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import trialOAuth2 from '~/services/spring-boot/Trial';

import ProductPurchase from './ProductPurchase';

import type {OrderTypes} from '~/types/OrderTypes';
import type {Cart} from '~/types/orders';

export default class ProductPurchaseSolutionTrial extends ProductPurchase {
	protected override orderTypeExternalReferenceCode: OrderTypes =
		'SOLUTIONS7';

	public override async createOrder(cart?: Partial<Cart>): Promise<Cart> {
		const order = await super.createOrder(cart);

		trialOAuth2.provisioningTrial(order.id);

		return order;
	}

	public override async getNextStepsLink(cart: Cart) {
		const maxTrialsReached = await this.isTrialOnHold();

		const searchParams = new URLSearchParams({
			orderId: String(cart.id),
			state: maxTrialsReached ? 'hold' : '',
		});

		return `/next-steps?${searchParams.toString()}`;
	}

	public async isTrialOnHold() {
		const trialAvailability = await trialOAuth2.getAvailability();

		return trialAvailability.fallback
			? false
			: trialAvailability.available === 0;
	}
}
