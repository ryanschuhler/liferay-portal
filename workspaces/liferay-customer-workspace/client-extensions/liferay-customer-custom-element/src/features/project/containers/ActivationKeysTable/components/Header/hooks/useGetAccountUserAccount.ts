/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useEffect, useState} from 'react';
import {useAppPropertiesContext} from '~/contexts/AppPropertiesContext';
import {getAccountUserAccountsByExternalReferenceCode} from '~/services/liferay/graphql/queries';
import {
	IAccountBrief,
	IGraphQLUserAccount,
	IProject,
	IUserAccount,
} from '~/utils/types';

const MAX_PAGE_SIZE = 9999;

interface IProps {
	isLoadingUserAccounts: boolean;
	setFilterTerm: React.Dispatch<React.SetStateAction<string>>;
	setUserAccounts: React.Dispatch<React.SetStateAction<IUserAccount[]>>;
	userAccounts: IUserAccount[];
}

export default function useGetAccountUserAccount(project: IProject): IProps {
	const [userAccounts, setUserAccounts] = useState<IUserAccount[]>([]);
	const [isLoadingUserAccounts, setIsLoadingUserAccounts] =
		useState<boolean>(false);
	const [filterTerm, setFilterTerm] = useState('');
	const {client} = useAppPropertiesContext();

	useEffect(() => {
		setIsLoadingUserAccounts(true);
		const getAccountUserAccounts = async () => {
			const {data} = await client.query({
				query: getAccountUserAccountsByExternalReferenceCode,
				variables: {
					externalReferenceCode: project.accountKey,
					filter: filterTerm,
					pageSize: MAX_PAGE_SIZE,
				},
			});

			if (data) {
				const accountUserAccounts =
					data.accountUserAccountsByExternalReferenceCode?.items?.reduce(
						(
							userAccountsAccumulator: IUserAccount[],
							graphQlUserAccount: IGraphQLUserAccount
						) => {
							const currentAccountBriefFromGraphQL =
								graphQlUserAccount.accountBriefs?.find(
									(brief) =>
										brief.externalReferenceCode ===
										project?.accountKey
								);

							if (currentAccountBriefFromGraphQL) {
								const mappedAccountBriefs: IAccountBrief[] =
									graphQlUserAccount.accountBriefs?.map(
										(brief) => ({
											externalReferenceCode:
												brief.externalReferenceCode,
											id: Number(brief.id),
											name: brief.name,
											roleBriefs: brief.roleBriefs,
										})
									) || [];

								const hasAdminRole = mappedAccountBriefs.some(
									(ab) =>
										ab.roleBriefs?.some(
											(rb) => rb.name === 'Administrator'
										)
								);
								const hasOmniAdminRole =
									mappedAccountBriefs.some((ab) =>
										ab.roleBriefs?.some(
											(rb) =>
												rb.name === 'Omni Administrator'
										)
									);
								const hasProvisioningRole =
									mappedAccountBriefs.some((ab) =>
										ab.roleBriefs?.some(
											(rb) => rb.name === 'Provisioning'
										)
									);

								const userAccount: IUserAccount = {
									accountBriefs: mappedAccountBriefs,
									accountKey: project.accountKey,
									code: project.code,
									dateCreated: graphQlUserAccount.dateCreated,
									email:
										graphQlUserAccount.emailAddress || '',
									emailAddress:
										graphQlUserAccount.emailAddress || '',
									firstName:
										graphQlUserAccount.name?.split(
											' '
										)[0] || '',
									givenName:
										graphQlUserAccount.name?.split(
											' '
										)[0] || '',
									id: Number(graphQlUserAccount.id),
									isAccountAdmin: hasAdminRole,
									isLoggedUser:
										graphQlUserAccount.isLoggedUser ||
										false,
									isOmniAdmin: hasOmniAdminRole,
									isPartner:
										graphQlUserAccount.isPartner || false,
									isProvisioning: hasProvisioningRole,
									isStaff:
										graphQlUserAccount.isLiferayStaff ||
										false,
									lastLoginDate:
										graphQlUserAccount.lastLoginDate,
									lastName:
										graphQlUserAccount.name
											?.split(' ')
											.slice(1)
											.join(' ') || '',
									organizationBriefs:
										graphQlUserAccount.organizationBriefs,
									region: 'unknown',
									roleBriefs: graphQlUserAccount.roleBriefs,
									status: 'active',
									userId: Number(graphQlUserAccount.id),
									userName: graphQlUserAccount.name || '',
									uuid: graphQlUserAccount.uuid || '',
								};

								userAccountsAccumulator.push(userAccount);
							}

							return userAccountsAccumulator;
						},
						[]
					);

				setUserAccounts(accountUserAccounts);
			}

			setIsLoadingUserAccounts(false);
		};
		getAccountUserAccounts();
	}, [client, filterTerm, project.accountKey, project.code]);

	return {
		isLoadingUserAccounts,
		setFilterTerm,
		setUserAccounts,
		userAccounts,
	};
}
