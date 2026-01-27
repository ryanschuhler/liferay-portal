/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import React from 'react';
import PopoverIconButton from '~/features/project/components/PopoverIconButton';
import i18n from '~/utils/I18n';

interface IHeader {
	name: string | React.ReactNode;
	noWrap?: boolean;
	styles: string;
}

interface IColumn {
	accessor: string;
	align?: 'center' | 'left' | 'right';
	bodyClass: string;
	header: IHeader;
	truncate?: boolean;
}

interface IPopoverLink {
	textLink: string;
	url: string;
}

const getInitialColumns = (articleAccountSupportURL: string): IColumn[] => [
	{
		accessor: 'name',
		bodyClass: 'border-0',
		header: {
			name: i18n.translate('name'),
			styles: 'h6 border-bottom text-neutral-10 font-weight-bold table-cell-expand',
		},
		truncate: true,
	},
	{
		accessor: 'email',
		bodyClass: 'border-0',

		header: {
			name: i18n.translate('email'),
			styles: 'h6 border-bottom text-neutral-10 font-weight-bold table-cell-expand-small',
		},
		truncate: true,
	},
	{
		accessor: 'supportSeat',
		align: 'center',
		bodyClass: 'border-0',

		header: {
			name: (
				<div className="align-items-center d-flex justify-content-center">
					<p className="m-0">{i18n.translate('support-seat')}</p>

					<PopoverIconButton
						popoverLink={
							{
								textLink: i18n.translate(
									'learn-more-about-customer-portal-roles'
								),
								url: articleAccountSupportURL,
							} as IPopoverLink
						}
						popoverText={i18n.translate(
							'the-support-seats-limit-counts-the-total-users-with-the-administrator-or-requester-role-administrators-and-requesters-have-permissions-to-open-support-tickets'
						)}
					/>
				</div>
			),
			noWrap: true,
			styles: 'h6 border-bottom text-neutral-10 font-weight-bold table-cell-expand-smaller',
		},
	},
	{
		accessor: 'role',
		bodyClass: 'border-0',
		header: {
			name: i18n.translate('role'),
			styles: 'h6 border-bottom text-neutral-10 font-weight-bold table-cell-expand-smaller',
		},
		truncate: true,
	},
	{
		accessor: 'status',
		bodyClass: 'border-0',
		header: {
			name: i18n.translate('status'),
			styles: 'h6 border-bottom text-neutral-10 font-weight-bold table-cell-expand-smallest',
		},
	},
];

const optionColumn: IColumn = {
	accessor: 'options',
	align: 'right',
	bodyClass: 'border-0',
	header: {
		name: '',
		styles: 'border-bottom bg-transparent',
	},
};

export function getColumns(
	hasAccountAdministrator: boolean,
	articleAccountSupportURL: string
): IColumn[] {
	const columns = getInitialColumns(articleAccountSupportURL);

	if (hasAccountAdministrator) {
		return [...columns, optionColumn];
	}

	return columns;
}
