/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import useSWR, {SWRConfiguration} from 'swr';
import {useDataQuery} from '~/hooks/useDataQuery';
import HeadlessCommerceDeliveryOrder from '~/services/headless/HeadlessCommerceDeliveryOrder';
import {placedOrdersQuery} from '~/services/queries/orderQueries';

import type {PlacedOrdersQueryProps} from '~/services/queries/orderQueries';

const usePlacedOrder = (
	orderId: number | string,
	swrOptions?: SWRConfiguration
) =>
	useSWR(
		orderId ? `/placed-order/${orderId}` : null,
		async () => HeadlessCommerceDeliveryOrder.getPlacedOrder(orderId),
		swrOptions
	);

const usePlacedOrders = (props: PlacedOrdersQueryProps) =>
	useDataQuery(placedOrdersQuery(props));

export {usePlacedOrder, usePlacedOrders};
