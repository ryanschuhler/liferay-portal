/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayForm from '@clayui/form';
import {Input} from '~/components';
import useBannedDomains from '~/hooks/useBannedDomains';
import i18n from '~/utils/I18n';
import {isValidEmail} from '~/utils/validations.form';

interface ILxcAdmin {
	email: string;
	fullName: string;
	github: string;
}

interface AdminsInputProps {
	admin: ILxcAdmin;
	id: number;
}

const AdminsInput = ({admin, id}: AdminsInputProps) => {
	const bannedDomains = useBannedDomains(admin?.email);

	return (
		<ClayForm.Group className="mb-0 pb-1">
			<hr className="mb-4 mt-4 mx-3" />

			<Input
				groupStyle="pb-1"
				label={i18n.translate('project-admin-s-email-address')}
				name={`lxc.admins[${id}].email`}
				placeholder="email@example.com"
				required
				type="email"
				validations={[isValidEmail(bannedDomains)]}
			/>

			<Input
				groupStyle="mb-0"
				label={i18n.translate('project-admin-s-full-name')}
				name={`lxc.admins[${id}].fullName`}
				required
				type="text"
			/>
		</ClayForm.Group>
	);
};

export default AdminsInput;
