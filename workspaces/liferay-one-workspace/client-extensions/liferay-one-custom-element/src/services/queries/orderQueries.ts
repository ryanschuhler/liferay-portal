/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import HeadlessCommerceDeliveryOrder from '~/services/headless/HeadlessCommerceDeliveryOrder';
import {Liferay} from '~/services/liferay/liferay';

import type {APIResponse, DataQuery} from '~/types/api';
import type {PlacedOrder} from '~/types/orders';

const channelId = Liferay.CommerceContext.commerceChannelId;

const MAX_PAGES = 20;

export type PlacedOrdersQueryProps = {
	accountId: number | string;
	fetchAllPages?: boolean;
	filter?: string;
	orderTypeExternalReferenceCodes?: string[];
	page: number;
	pageSize: number;
	restrictFields?: string;
	shouldFetch?: boolean;
};

export function placedOrdersQuery({
	accountId,
	fetchAllPages = false,
	filter,
	orderTypeExternalReferenceCodes,
	page,
	pageSize,
	restrictFields,
	shouldFetch = true,
}: PlacedOrdersQueryProps): DataQuery<APIResponse<PlacedOrder>> {
	return {
		fetcher: async () => {
			const getPage = (currentPage: number) =>
				HeadlessCommerceDeliveryOrder.getPlacedOrders(
					channelId,
					accountId,
					new URLSearchParams({
						...(filter && {filter}),
						nestedFields: 'placedOrderItems',
						page: currentPage.toString(),
						pageSize: pageSize.toString(),
						...(restrictFields && {restrictFields}),
						sort: 'createDate:desc',
					})
				);

			const response = await getPage(page);

			const items = [...response.items];

			if (fetchAllPages && response.totalCount > items.length) {
				const lastPage = Math.min(
					Math.ceil(response.totalCount / pageSize),
					page + MAX_PAGES - 1
				);

				const remainingPages = await Promise.all(
					Array.from({length: lastPage - page}, (_, index) =>
						getPage(page + index + 1)
					)
				);

				remainingPages.forEach((remainingPage) =>
					items.push(...remainingPage.items)
				);
			}

			return {
				...response,
				items: items.filter(({orderTypeExternalReferenceCode}) =>
					orderTypeExternalReferenceCodes?.length
						? orderTypeExternalReferenceCodes.includes(
								orderTypeExternalReferenceCode
							)
						: true
				),
			} as APIResponse<PlacedOrder>;
		},
		key: shouldFetch
			? `/placed-orders/${accountId}/${page}/${pageSize}/${fetchAllPages}/${filter ?? ''}/${restrictFields ?? ''}`
			: null,
	};
}

const PROJECT_ORDERS_PAGE_SIZE = 200;

const RESTRICTED_ORDER_FIELDS = [
	'account',
	'attachments',
	'channelId',
	'couponCode',
	'lastPriceUpdateDate',
	'modifiedDate',
	'name',
	'orderType',
	'orderUUID',
	'paymentMethod',
	'paymentStatus',
	'paymentStatusInfo',
	'paymentStatusLabel',
	'placedOrderBillingAddressId',
	'placedOrderItems.adaptiveMediaImageHTMLTag',
	'placedOrderItems.customFields',
	'placedOrderItems.deliveryGroup',
	'placedOrderItems.deliveryGroupName',
	'placedOrderItems.externalReferenceCode',
	'placedOrderItems.options',
	'placedOrderItems.parentOrderItemId',
	'placedOrderItems.price.currency',
	'placedOrderItems.price.discount',
	'placedOrderItems.price.discountFormatted',
	'placedOrderItems.price.discountPercentage',
	'placedOrderItems.price.discountPercentageLevel1',
	'placedOrderItems.price.discountPercentageLevel2',
	'placedOrderItems.price.discountPercentageLevel3',
	'placedOrderItems.price.discountPercentageLevel4',
	'placedOrderItems.price.finalPrice',
	'placedOrderItems.price.finalPriceFormatted',
	'placedOrderItems.price.priceFormatted',
	'placedOrderItems.price.promoPrice',
	'placedOrderItems.productURLs',
	'placedOrderItems.quantity',
	'placedOrderItems.replacedSku',
	'placedOrderItems.settings',
	'placedOrderItems.shippingAddressId',
	'placedOrderItems.sku',
	'placedOrderItems.skuId',
	'placedOrderItems.subscription',
	'placedOrderItems.unitOfMeasureKey',
	'placedOrderItems.virtualItemURLs',
	'placedOrderShippingAddressId',
	'printedNote',
	'shippingOption',
	'steps',
	'summary.currency',
	'summary.itemsCount',
	'summary.itemsQuantity',
	'summary.shippingDiscountPercentages',
	'summary.shippingDiscountValue',
	'summary.shippingDiscountValueFormatted',
	'summary.shippingValue',
	'summary.shippingValueFormatted',
	'summary.shippingValueWithTaxAmount',
	'summary.shippingValueWithTaxAmountFormatted',
	'summary.subtotal',
	'summary.subtotalDiscountPercentages',
	'summary.subtotalDiscountValue',
	'summary.subtotalDiscountValueFormatted',
	'summary.subtotalFormatted',
	'summary.taxValue',
	'summary.taxValueFormatted',
	'summary.total',
	'summary.totalDiscountPercentages',
	'summary.totalDiscountValue',
	'summary.totalDiscountValueFormatted',
].join(',');

export function toProjectOrdersProps(accountId?: number | string | null) {
	return {
		accountId: accountId ?? -1,
		fetchAllPages: true,
		page: 1,
		pageSize: PROJECT_ORDERS_PAGE_SIZE,
		restrictFields: RESTRICTED_ORDER_FIELDS,
		shouldFetch: Boolean(accountId),
	};
}

export function projectOrdersQuery(accountId?: number | string | null) {
	return placedOrdersQuery(toProjectOrdersProps(accountId));
}
