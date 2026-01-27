/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayLoadingIndicator from '@clayui/loading-indicator';
import {useEffect, useMemo, useState} from 'react';
import {HashRouter, Route, Routes} from 'react-router-dom';
import {useAppPropertiesContext} from '~/contexts/AppPropertiesContext';

// import {DeactivateKeysTable} from '~/features/project/containers/DeactivateKeysTable';

import GenerateNewKey from '~/features/project/containers/GenerateNewKey';
import {useAppContext} from '~/features/project/context';
import {actionTypes} from '~/features/project/context/reducer';
import Layout from '~/features/project/layouts/BaseLayout';
import BusinessEventAdd from '~/features/project/pages/Project/BusinessEvents/pages/BusinessEventsAdd';
import useMyUserAccountByAccountExternalReferenceCode from '~/features/project/pages/Project/TeamMembers/components/TeamMembersTable/hooks/useMyUserAccountByAccountExternalReferenceCode';
import {PRODUCT_TYPES} from '~/features/project/utils/constants';
import {WEB_CONTENT_DXP_VERSION_TYPES} from '~/features/project/utils/constants/webContentDXPVersionTypes';
import {getWebContents} from '~/features/project/utils/getWebContents';
import useCurrentKoroneikiAccount from '~/hooks/useCurrentKoroneikiAccount';
import getKebabCase from '~/utils/getKebabCase';
import {
	IAccountSubscriptionGroup,
	IKoroneikiAccount,
	IProject,
} from '~/utils/types';

import Commerce from '../ActivationKeys/Commerce';
import EnterpriseSearch from '../ActivationKeys/EnterpriseSearch';
import AnalyticsCloud from '../AnalyticsCloud';
import Attachments from '../Attachments';
import BusinessEvents from '../BusinessEvents';
import BusinessEventsItemActivityHistory from '../BusinessEvents/pages/BusinessEventsItem/BusinessEventsItemActivityHistory';
import BusinessEventsItemDetails from '../BusinessEvents/pages/BusinessEventsItem/BusinessEventsItemDetails';
import BusinessEventsItemEdit from '../BusinessEvents/pages/BusinessEventsItem/BusinessEventsItemEdit';
import CloudNative from '../CloudNative';
import DXP from '../DXP';
import DXPCloud from '../DXPCloud';
import LiferayExperienceCloud from '../LiferayExperienceCloud';
import Overview from '../Overview';
import Portal from '../Portal';
import ProjectUsage from '../ProjectUsage';
import RenewTable from '../RenewTable';
import TeamMembers from '../TeamMembers';
import ActivationOutlet from './Outlets/ActivationOutlet';
import BusinessEventOutlet from './Outlets/BusinessEventOutlet';
import ProductOutlet from './Outlets/ProductOutlet';

interface IMyUserAccount {
	myUserAccount: {
		isLiferayStaff: boolean;
		isPartner: boolean;
		selectedAccountSummary: {
			hasAdministratorRole: boolean;
		};
	};
}

interface IAppPropertiesContext {
	featureFlags: string[];
}

const ProjectRoutes = () => {
	const [hasComplimentaryKey, setHasComplimentaryKey] =
		useState<boolean>(false);

	const [{project, subscriptionGroups}, dispatch] = useAppContext();
	const {featureFlags} = useAppPropertiesContext() as IAppPropertiesContext;

	const {data: koroneikiData, loading: koroneikiAccountLoading} =
		useCurrentKoroneikiAccount();
	const koroneikiAccount: IKoroneikiAccount | undefined =
		koroneikiData?.koroneikiAccountByExternalReferenceCode;

	if (koroneikiAccount) {
		const userId = Liferay.ThemeDisplay.getUserId();

		const cookieKey = `CP_LAST_VIEWED_PROJECT_${userId}`;
		const cookieValue = encodeURIComponent(
			koroneikiAccount?.accountKey ?? ''
		);
		const expires = new Date();

		expires.setDate(expires.getDate() + 30);

		if (Liferay?.Util?.Cookie) {
			Liferay.Util.Cookie.set?.(cookieKey, cookieValue, {
				expires,
				secure: true,
			});
		}
	}

	const {data: myUserAccountData} =
		useMyUserAccountByAccountExternalReferenceCode(
			koroneikiAccount?.accountKey ?? '',
			koroneikiAccountLoading
		);
	const loggedUserAccount: IMyUserAccount['myUserAccount'] | undefined =
		myUserAccountData?.myUserAccount;

	const hasSaasSubscription: boolean = useMemo(() => {
		const allowedERCs = [
			`${project?.externalReferenceCode ?? ''}_liferay-cloud`,
			`${project?.externalReferenceCode ?? ''}_liferay-saas`,
		];

		return (
			subscriptionGroups?.some((group: IAccountSubscriptionGroup) =>
				allowedERCs.includes(group.externalReferenceCode ?? '')
			) ?? false
		);
	}, [project?.externalReferenceCode, subscriptionGroups]);

	const hasSLASubscription: boolean = useMemo(
		() =>
			Boolean(
				koroneikiAccount?.slaCurrent ||
					koroneikiAccount?.slaExpired ||
					koroneikiAccount?.slaFuture ||
					false
			),
		[koroneikiAccount]
	);

	useEffect(() => {
		if (project && subscriptionGroups) {
			dispatch({
				payload: getWebContents(
					WEB_CONTENT_DXP_VERSION_TYPES[
						project.dxpVersion as keyof typeof WEB_CONTENT_DXP_VERSION_TYPES
					]
						? (project.dxpVersion as keyof typeof WEB_CONTENT_DXP_VERSION_TYPES)
						: undefined,
					project.slaCurrent,
					subscriptionGroups as IAccountSubscriptionGroup[]
				),
				type: actionTypes.UPDATE_QUICK_LINKS as 'UPDATE_QUICK_LINKS',
			});
		}
	}, [dispatch, project, subscriptionGroups]);

	return (
		<HashRouter>
			<Routes>
				<Route element={<ClayLoadingIndicator />} index />

				<Route element={<Layout />} path="/:accountKey">
					<Route element={<Overview />} index />

					<Route element={<ActivationOutlet />} path="activation">
						<Route
							element={
								<ProductOutlet product={PRODUCT_TYPES.portal} />
							}
							path={getKebabCase(PRODUCT_TYPES.portal)}
						>
							<Route
								element={
									<Portal
										hasComplimentaryKey={
											hasComplimentaryKey
										}
									/>
								}
								index
							/>

							<Route
								element={
									<GenerateNewKey
										hasComplimentaryKey={
											hasComplimentaryKey
										}
										productGroupName={PRODUCT_TYPES.portal}
										setHasComplimentaryKey={
											setHasComplimentaryKey
										}
									/>
								}
								path="new"
							/>

							{/* {featureFlags.includes('LPS-186175') && (
								<Route
									element={
										<DeactivateKeysTable
											initialFilter="startswith(productName,'Portal')"
											productName={PRODUCT_TYPES.portal}
										/>
									}
									path="deactivate"
								/>
							)} */}

							<Route
								element={
									<RenewTable
										hasComplimentaryKey={
											hasComplimentaryKey
										}
										isDXPTable={false}
										isRenewTable
									/>
								}
								path="portal-renew"
							/>
						</Route>

						<Route
							element={
								<ProductOutlet product={PRODUCT_TYPES.dxp} />
							}
							path={getKebabCase(PRODUCT_TYPES.dxp)}
						>
							<Route
								element={
									<DXP
										hasComplimentaryKey={
											hasComplimentaryKey
										}
									/>
								}
								index
							/>

							<Route
								element={
									<GenerateNewKey
										hasComplimentaryKey={
											hasComplimentaryKey
										}
										productGroupName={PRODUCT_TYPES.dxp}
										setHasComplimentaryKey={
											setHasComplimentaryKey
										}
									/>
								}
								path="new"
							/>

							{/* <Route
								element={
									<DeactivateKeysTable
										initialFilter="(startswith(productName,'DXP') or startswith(productName,'Digital'))"
										productName={PRODUCT_TYPES.dxp}
									/>
								}
								path="deactivate"
							/> */}

							<Route
								element={
									<RenewTable
										hasComplimentaryKey={
											hasComplimentaryKey
										}
										isDXPTable
										isRenewTable
									/>
								}
								path="dxp-renew"
							/>
						</Route>

						<Route
							element={
								<ProductOutlet
									product={PRODUCT_TYPES.dxpCloud}
								/>
							}
						>
							<Route
								element={<DXPCloud />}
								path={getKebabCase(PRODUCT_TYPES.dxpCloud)}
							/>
						</Route>

						<Route
							element={
								<ProductOutlet
									product={
										PRODUCT_TYPES.liferayExperienceCloud
									}
								/>
							}
						>
							<Route
								element={<LiferayExperienceCloud />}
								path={getKebabCase(
									PRODUCT_TYPES.liferayExperienceCloud
								)}
							/>
						</Route>

						<Route
							element={
								<ProductOutlet
									product={PRODUCT_TYPES.analyticsCloud}
								/>
							}
							path={getKebabCase(PRODUCT_TYPES.analyticsCloud)}
						>
							<Route element={<AnalyticsCloud />} index />
						</Route>

						<Route
							element={
								<ProductOutlet
									product={PRODUCT_TYPES.cloudNative}
								/>
							}
						>
							<Route
								element={<CloudNative />}
								path={getKebabCase(PRODUCT_TYPES.cloudNative)}
							/>
						</Route>

						<Route
							element={
								<ProductOutlet
									product={PRODUCT_TYPES.commerce}
								/>
							}
							path={getKebabCase(PRODUCT_TYPES.commerce)}
						>
							<Route element={<Commerce />} index />
						</Route>

						<Route
							element={
								<ProductOutlet
									product={PRODUCT_TYPES.enterpriseSearch}
								/>
							}
							path={getKebabCase(PRODUCT_TYPES.enterpriseSearch)}
						>
							<Route element={<EnterpriseSearch />} index />
						</Route>
					</Route>

					{featureFlags.includes('ISSD-119') && (
						<Route element={<Attachments />} path="attachments" />
					)}

					<Route element={<TeamMembers />} path="team-members" />

					{hasSLASubscription && (
						<Route path="business-events">
							<Route element={<BusinessEvents />} index />
							<Route element={<BusinessEventAdd />} path="new" />
							<Route
								element={
									<BusinessEventOutlet
										project={project as IProject}
										skip={!project}
									/>
								}
								path=":id"
							>
								<Route
									element={<BusinessEventsItemDetails />}
									index
								/>
								<Route
									element={<BusinessEventsItemEdit />}
									path="edit"
								/>
								<Route
									element={
										<BusinessEventsItemActivityHistory />
									}
									path="activity-history"
								/>
							</Route>
						</Route>
					)}

					{((featureFlags.includes('LRSD-6322') &&
						loggedUserAccount?.isLiferayStaff) ||
						(featureFlags.includes('LRSD-7805') &&
							loggedUserAccount?.isPartner)) &&
						hasSaasSubscription && (
							<Route
								element={<ProjectUsage />}
								path="project-usage"
							/>
						)}

					<Route element={<h3>Page not found</h3>} path="*" />
				</Route>
			</Routes>
		</HashRouter>
	);
};

export default ProjectRoutes;
