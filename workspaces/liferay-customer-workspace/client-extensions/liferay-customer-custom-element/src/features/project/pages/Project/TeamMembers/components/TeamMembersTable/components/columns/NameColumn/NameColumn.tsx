/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {memo} from 'react';
import i18n from '~/utils/I18n';
import {IUserAccount} from '~/utils/types';

import Avatar from './components/Avatar/Avatar';

interface IProps {
	userAccount: IUserAccount;
}

const NameColumn = ({userAccount}: IProps) => (
	<div className="align-items-center d-flex">
		<Avatar userName={userAccount.userName ?? ''} />

		<p className="m-0 ml-2 mr-1 text-truncate">{userAccount.userName}</p>

		{userAccount.isLoggedUser && (
			<span className="text-neutral-7">({i18n.translate('me')})</span>
		)}
	</div>
);

export default memo(NameColumn);
