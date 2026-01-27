/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useEffect} from 'react';
import {
	Outlet,
	useMatch,
	useNavigate,
	useOutletContext,
	useResolvedPath,
} from 'react-router-dom';
import {useAppContext} from '~/features/project/context';
import i18n from '~/utils/I18n';
import getKebabCase from '~/utils/getKebabCase';

interface IOutletContext {
	setHasSideMenu: (hasSideMenu: boolean) => void;
}

interface ISubscriptionGroup {
	activationProductName?: string;
	hasActivation?: boolean;
	name?: string;
}

const ActivationOutlet = () => {
	const [{subscriptionGroups}] = useAppContext();
	const {setHasSideMenu} = useOutletContext<IOutletContext>();

	const isCurrentActivationRoute = !!useMatch({
		path: useResolvedPath('').pathname,
	});
	const navigate = useNavigate();

	useEffect(() => {
		setHasSideMenu(true);
	}, [setHasSideMenu]);

	useEffect(() => {
		if (subscriptionGroups?.length && isCurrentActivationRoute) {
			const productName = (subscriptionGroups as ISubscriptionGroup[])
				?.filter((subscriptionGroup: ISubscriptionGroup) => {
					return subscriptionGroup.hasActivation;
				})
				.map(({activationProductName, name}: ISubscriptionGroup) => {
					return activationProductName
						? activationProductName
						: name || '';
				})
				.sort((a: string, b: string) => {
					return a.localeCompare(b);
				})[0];

			const redirectPage = getKebabCase(productName || '');

			navigate(redirectPage);
		}
	}, [isCurrentActivationRoute, navigate, subscriptionGroups]);

	if (!subscriptionGroups) {
		return <> {i18n.translate('loading')}...</>;
	}

	return (
		<Outlet
			context={{
				setHasSideMenu,
			}}
		/>
	);
};

export default ActivationOutlet;
