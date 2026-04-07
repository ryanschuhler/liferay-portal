/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useEffect} from 'react';
import {useOutletContext} from 'react-router-dom';
import useCurrentKoroneikiAccount from '~/hooks/useCurrentKoroneikiAccount';
import i18n from '~/utils/I18n';
import {IKoroneikiAccount} from '~/utils/types';

import TicketAttachmentsTable from './components/TicketAttachmentsTable/TicketAttachmentsTable';

interface IOutletContext {
	setHasSideMenu: (hasSideMenu: boolean) => void;
}

const Attachments = () => {
	const {setHasSideMenu} = useOutletContext<IOutletContext>();
	const {data, loading} = useCurrentKoroneikiAccount();
	const koroneikiAccount: IKoroneikiAccount | undefined =
		data?.koroneikiAccountByExternalReferenceCode;

	useEffect(() => {
		setHasSideMenu(true);
	}, [setHasSideMenu]);

	return (
		<>
			<h1>{i18n.translate('attachments')}</h1>

			<div className="mt-4">
				{koroneikiAccount && (
					<TicketAttachmentsTable
						koroneikiAccount={koroneikiAccount}
						loading={loading}
					/>
				)}
			</div>
		</>
	);
};

export default Attachments;
