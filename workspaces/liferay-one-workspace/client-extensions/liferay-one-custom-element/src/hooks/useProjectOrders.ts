/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useMemo} from 'react';
import {Liferay} from '~/services/liferay/liferay';
import {toProjectOrdersProps} from '~/services/queries/orderQueries';
import {
	formatOrderDate,
	getOrderStatusToken,
	getProjectName,
} from '~/utils/orderUtils';

import {usePlacedOrders} from './usePlacedOrder';

import type {PlacedOrder} from '~/types/orders';

export type ProjectOrder = {
	date: string;
	id: string;
	orderId: string;
	status: string;
	total: string;
};

function getOrderTotal(order: PlacedOrder): string {
	const {summary, totalFormatted} = order as PlacedOrder & {
		summary?: {totalFormatted?: string};
		totalFormatted?: string;
	};

	return summary?.totalFormatted ?? totalFormatted ?? '$0.00';
}

export function useProjectOrders(projectName?: string) {
	const accountId = Liferay.CommerceContext.account?.accountId;

	const {data, error, isLoading} = usePlacedOrders(
		toProjectOrdersProps(accountId)
	);

	const placedOrders = useMemo(
		() =>
			(data?.items ?? []).filter(
				(order) => !projectName || getProjectName(order) === projectName
			),
		[data, projectName]
	);

	const orders = useMemo<ProjectOrder[]>(
		() =>
			placedOrders.map((order) => ({
				date: formatOrderDate(order.createDate),
				id: String(order.id),
				orderId: String(order.id),
				status: getOrderStatusToken(order),
				total: getOrderTotal(order),
			})),
		[placedOrders]
	);

	return {error, loading: isLoading, orders, placedOrders};
}
