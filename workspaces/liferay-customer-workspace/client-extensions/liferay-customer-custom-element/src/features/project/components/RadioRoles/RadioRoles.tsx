/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {ClayRadio} from '@clayui/form';

interface RadioRolesProps {
	onChange: () => void;
	selected: boolean;
	value: string | number;
	[key: string]: any; // For ...props
}

const RadioRoles = ({onChange, selected, value, ...props}: RadioRolesProps) => {
	return (
		<ClayRadio
			{...props}
			checked={selected}
			disabled={false}
			onChange={onChange}
			value={value}
		/>
	);
};

export default RadioRoles;
