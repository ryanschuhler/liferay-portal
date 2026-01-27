/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {NetworkStatus} from '@apollo/client';
import {useMemo} from 'react';
import useSearchTerm from '~/hooks/useSearchTerm';
import {useGetUserAccountsByAccountExternalReferenceCode} from '~/services/liferay/graphql/user-accounts';
import {addContactRoleNameByEmailByProject} from '~/services/liferay/rest/raysource/TeamMembers';

import {
	getRaysourceContactRoleName,
	getRaysourceContactRoleNameURLParameter,
} from '../utils/getRaysourceContactRoleName';
import useDeleteUserAccount from './useDeleteUserAccount';
import useSupportSeatsCount from './useSupportSeatsCount';
import useUpdateUserAccount from './useUpdateUserAccount';

const getFilter = (searchTerm: string) => {
	if (searchTerm) {
		return `(contains(name, '${searchTerm}') or contains(emailAddress, '${searchTerm}') or userGroupRoleNames/any(s:contains(s, '${searchTerm}')))`;
	}

	return '';
};

export default function useUserAccountsByAccountExternalReferenceCode(
	externalReferenceCode: string,
	skip: boolean
): [
	number | undefined,
	{
		data: any;
		loading: boolean;
		refetch: any;
		remove: any;
		search: any;
		searching: boolean;
		update: any;
		updating: boolean;
	},
] {
	const {
		data: userAccountData,
		networkStatus,
		refetch,
	}: any = useGetUserAccountsByAccountExternalReferenceCode(
		externalReferenceCode,
		{
			filter: getFilter(''),
			notifyOnNetworkStatusChange: true,
			page: 1,
			pageSize: 9999,
			skip: skip || !externalReferenceCode,
		}
	);

	const data: any = useMemo(() => {
		const items = (
			userAccountData?.accountUserAccountsByExternalReferenceCode
				?.items ?? []
		).filter((account: any) => {
			const accountBriefByExternalReferenceCode =
				account.accountBriefs.find(
					(accountBrief: any) =>
						accountBrief.externalReferenceCode ===
						externalReferenceCode
				);

			if (
				accountBriefByExternalReferenceCode &&
				accountBriefByExternalReferenceCode.roleBriefs.some(
					(roleBrief: any) => roleBrief.name === 'Provisioning'
				)
			) {
				return false;
			}

			return true;
		});

		return {
			...userAccountData,
			accountUserAccountsByExternalReferenceCode: {
				...userAccountData?.accountUserAccountsByExternalReferenceCode,
				items,
				totalCount: items.length,
			},
		};
	}, [userAccountData, externalReferenceCode]);

	const {
		deleteContactRoles,
		deleteUserAccount,
		loading: removing,
	} = useDeleteUserAccount();

	const {
		loading: updating,
		replaceAccountRole,
		updateContactRoles,
	} = useUpdateUserAccount();

	const supportSeatsCount: number | undefined = useSupportSeatsCount(
		data?.accountUserAccountsByExternalReferenceCode,
		networkStatus === NetworkStatus.loading
	);

	const [, onSearch]: any = useSearchTerm((searchTerm: string) => {
		refetch({
			filter: getFilter(searchTerm),
		});
	});

	const remove = (userAccount: any) => {
		const contactRoleNameURLParameters =
			userAccount.selectedAccountSummary.roleBriefs?.map(
				(roleBrief: any) =>
					getRaysourceContactRoleNameURLParameter(roleBrief.name)
			);

		deleteContactRoles({
			onCompleted: (_: any, {variables}: any) =>
				deleteUserAccount({
					variables: {
						emailAddress: variables.contactEmail,
						externalReferenceCode: variables.externalReferenceCode,
					},
				}),
			variables: {
				contactEmail: userAccount.emailAddress,
				contactRoleNames: contactRoleNameURLParameters.join('&'),
				externalReferenceCode,
			},
		});
	};

	const update = (
		userAccount: any,
		currentAccountRoles: any[],
		newAccountRoleItem: any,
		oAuthToken: string,
		provisioningServerAPI: string,
		project: any,
		assignUserAccountWithAccountRole: any,
		setCurrentUserEditing: () => void
	) => {
		const newContactRoleNameURLParameter =
			getRaysourceContactRoleNameURLParameter(
				newAccountRoleItem.raysourceName
			);

		const currentContactRoleNameURLParameters = currentAccountRoles.map(
			(roleBrief: any) =>
				getRaysourceContactRoleNameURLParameter(roleBrief.name)
		);

		if (Array.isArray(newAccountRoleItem)) {
			const hasConflictedRole = currentAccountRoles.some(
				(currentRole: any) =>
					newAccountRoleItem.some(
						(newRole: any) => currentRole.name === newRole.label
					)
			);

			if (!hasConflictedRole) {
				newAccountRoleItem.map((accountRole: any) => {
					const newAccountRoleRaysourceNameURLParameter =
						getRaysourceContactRoleNameURLParameter(
							accountRole.raysourceName
						);

					updateContactRoles({
						onCompleted: () =>
							currentAccountRoles.map(
								(currentAccountRole: any) => {
									deleteContactRoles({
										onCompleted: () =>
											replaceAccountRole({
												variables: {
													currentAccountRoleId:
														currentAccountRole.id,
													emailAddress:
														userAccount.emailAddress,
													externalReferenceCode,
													newAccountRoleId:
														accountRole.value,
												},
											}),
										variables: {
											contactEmail:
												userAccount.emailAddress,
											contactRoleNames:
												currentContactRoleNameURLParameters.join(
													'&'
												),
											externalReferenceCode,
										},
									});
								}
							),
						variables: {
							contactEmail: userAccount.emailAddress,
							contactRoleName:
								newAccountRoleRaysourceNameURLParameter,
							externalReferenceCode,
						},
					});
				});
			}

			if (hasConflictedRole) {
				const nonConflictingCurrentAccountRoles =
					currentAccountRoles.filter((currentRole: any) => {
						return !newAccountRoleItem.some(
							(newRole: any) => newRole.label === currentRole.name
						);
					});

				const nonConflictingNewAccountRoleItem =
					newAccountRoleItem.filter((newRole: any) => {
						return !currentAccountRoles.some(
							(currentRole: any) =>
								newRole.label === currentRole.name
						);
					});

				const currentRaysourceContactRoleNameURLParameters =
					nonConflictingCurrentAccountRoles.map((roleBrief: any) =>
						getRaysourceContactRoleNameURLParameter(roleBrief.name)
					);

				if (
					nonConflictingNewAccountRoleItem.length &&
					nonConflictingCurrentAccountRoles.length
				) {
					nonConflictingNewAccountRoleItem.map((accountRole: any) => {
						const oldAccountRoleRaysourceNameURLParameter =
							getRaysourceContactRoleNameURLParameter(
								accountRole.raysourceName
							);

						updateContactRoles({
							onCompleted: () =>
								nonConflictingCurrentAccountRoles.map(
									(currentAccountRole: any) => {
										deleteContactRoles({
											onCompleted: () =>
												replaceAccountRole({
													variables: {
														currentAccountRoleId:
															currentAccountRole.id,
														emailAddress:
															userAccount.emailAddress,
														externalReferenceCode,
														newAccountRoleId:
															accountRole.value,
													},
												}),
											variables: {
												contactEmail:
													userAccount.emailAddress,
												contactRoleNames:
													currentRaysourceContactRoleNameURLParameters.join(
														'&'
													),
												externalReferenceCode,
											},
										});
									}
								),
							variables: {
								contactEmail: userAccount.emailAddress,
								contactRoleName:
									oldAccountRoleRaysourceNameURLParameter,
								externalReferenceCode,
							},
						});
					});
				}

				if (
					!nonConflictingNewAccountRoleItem.length &&
					nonConflictingCurrentAccountRoles.length
				) {
					newAccountRoleItem.map((accountRole: any) => {
						nonConflictingCurrentAccountRoles.map(
							(currentAccountRole: any) => {
								deleteContactRoles({
									onCompleted: () =>
										replaceAccountRole({
											variables: {
												currentAccountRoleId:
													currentAccountRole.id,
												emailAddress:
													userAccount.emailAddress,
												externalReferenceCode,
												newAccountRoleId:
													accountRole.value,
											},
										}),
									variables: {
										contactEmail: userAccount.emailAddress,
										contactRoleNames:
											currentRaysourceContactRoleNameURLParameters.join(
												'&'
											),
										externalReferenceCode,
									},
								});
							}
						);
					});
				}

				if (
					nonConflictingNewAccountRoleItem.length &&
					!nonConflictingCurrentAccountRoles.length
				) {
					const firstName = userAccount?.name.split(' ')[0];
					const lastName = userAccount?.name.split(' ')[1];

					nonConflictingNewAccountRoleItem?.map(
						async (accountRole: any) => {
							const context = {
								displayErrors: true,
								displayServerError: false,
								displaySuccess: true,
							};

							const oldAccountRoleRaysourceName =
								getRaysourceContactRoleName(
									accountRole.raysourceName
								);

							await addContactRoleNameByEmailByProject(
								project.accountKey,
								encodeURI(userAccount.emailAddress),
								firstName,
								lastName,
								oAuthToken,
								provisioningServerAPI,
								oldAccountRoleRaysourceName
							);

							await assignUserAccountWithAccountRole({
								context,
								variables: {
									accountKey: project.accountKey,
									accountRoleId: accountRole.value,
									emailAddress: encodeURI(
										userAccount.emailAddress
									),
								},
							});

							if (setCurrentUserEditing) {
								setCurrentUserEditing();
							}
						}
					);
				}
			}
		}

		if (!Array.isArray(newAccountRoleItem)) {
			updateContactRoles({
				onCompleted: () =>
					currentAccountRoles.map((currentAccountRole: any) => {
						deleteContactRoles({
							onCompleted: () =>
								replaceAccountRole({
									variables: {
										currentAccountRoleId:
											currentAccountRole.id,
										emailAddress: userAccount.emailAddress,
										externalReferenceCode,
										newAccountRoleId:
											newAccountRoleItem.value,
									},
								}),
							variables: {
								contactEmail: userAccount.emailAddress,
								contactRoleNames:
									currentContactRoleNameURLParameters.join(
										'&'
									),
								externalReferenceCode,
							},
						});
					}),
				variables: {
					contactEmail: userAccount.emailAddress,
					contactRoleName: newContactRoleNameURLParameter,
					externalReferenceCode,
				},
			});
		}
	};

	return [
		supportSeatsCount,
		{
			data,
			loading: networkStatus === NetworkStatus.loading,
			refetch,
			remove,
			search: onSearch,
			searching: networkStatus === NetworkStatus.setVariables,
			update,
			updating: updating || removing,
		},
	];
}
