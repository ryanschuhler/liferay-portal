/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import React from 'react';
import {StatusTag} from '~/components';
import {getLicenseKeyPermanentStatus} from '~/features/project/containers/GenerateNewKey/utils/licenseKeyPermanentStatus';
import {getPerpetualValidStartDate} from '~/features/project/containers/GenerateNewKey/utils/perpetualValidStartDate';
import {getSubscriptionStatus} from '~/features/project/utils/getSubscriptionStatus';
import i18n from '~/utils/I18n';
import {FORMAT_DATE_TYPES} from '~/utils/constants';
import getDateCustomFormat from '~/utils/getDateCustomFormat';

interface IOrderItemOptions {
	endDate: string;
	instanceSize: number;
	startDate: string;
}

interface IReducedCustomFields {
	provisionedCount: number;
	status: string;
}

interface IOrderItem {
	options: IOrderItemOptions;
	quantity: number;
	reducedCustomFields: IReducedCustomFields;
}

interface ITableRow {
	'id': string | number;
	'instance-size': number;
	'provisioned': number;
	'quantity': number;
	'start-end-date': string;
	'subscription-term-status': React.ReactNode;
}

export default function getRows(orderItems: IOrderItem[]): ITableRow[] {
	return orderItems?.map(({options, quantity, reducedCustomFields}) => {
		const isPermanentLicenseKey = getLicenseKeyPermanentStatus(
			options?.startDate,
			options?.endDate
		);

		const isValidPerpetualStartDate = getPerpetualValidStartDate(
			options?.startDate
		);

		const datesDisplay =
			isPermanentLicenseKey && isValidPerpetualStartDate
				? i18n.translate('not-applicable')
				: `${getDateCustomFormat(
						FORMAT_DATE_TYPES.day2DMonth2DYearN,
						options?.startDate
					)} - ${getDateCustomFormat(
						FORMAT_DATE_TYPES.day2DMonth2DYearN,
						options?.endDate
					)}`;

		return {
			'id': `${options.startDate}-${options.endDate}-${quantity}`,
			'instance-size': options?.instanceSize,
			'provisioned': reducedCustomFields?.provisionedCount,
			quantity,
			'start-end-date': datesDisplay,
			'subscription-term-status': reducedCustomFields?.status && (
				<StatusTag
					currentStatus={getSubscriptionStatus(
						new Date(options?.startDate),
						new Date(options?.endDate)
					)}
				/>
			),
		};
	});
}
