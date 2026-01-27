/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {Button, useModal} from '@clayui/core';
import ClayIcon from '@clayui/icon';
import ClayModal from '@clayui/modal';
import classNames from 'classnames';
import {useState} from 'react';
import {Skeleton} from '~/components';
import SearchBar from '~/components/SearchBar';
import PopoverIconButton from '~/features/project/components/PopoverIconButton';
import InviteTeamMembersForm from '~/features/project/containers/InviteTeamMembersForm';
import i18n from '~/utils/I18n';
import {IKoroneikiAccount, IProject} from '~/utils/types';

interface IProps {
	articleAccountSupportURL: string;
	availableSupportSeatsCount: number;
	count: number;
	hasAdministratorRole: boolean;
	koroneikiAccount?: IKoroneikiAccount;
	loading: boolean;
	mutateUserData: () => void;
	oAuthToken?: string;
	onSearch: (term: string) => void;
	searching: boolean;
}

const TeamMembersTableHeader = ({
	articleAccountSupportURL,
	availableSupportSeatsCount,
	count,
	hasAdministratorRole,
	koroneikiAccount,
	loading,
	mutateUserData,
	oAuthToken,
	onSearch,
	searching,
}: IProps) => {
	const [searchTerm, setSearchTerm] = useState<string>('');

	const {observer, onOpenChange, open} = useModal();

	return (
		<>
			{open && (
				<ClayModal center observer={observer}>
					<InviteTeamMembersForm
						availableSupportSeatsCount={availableSupportSeatsCount}
						handlePage={() => onOpenChange(false)}
						leftButton={i18n.translate('cancel')}
						mutateUserData={mutateUserData}
						oAuthToken={oAuthToken ?? ''}
						project={
							{
								acWorkspaceGroupId:
									koroneikiAccount?.code ?? '',
								accountKey: koroneikiAccount?.accountKey ?? '',
								code: koroneikiAccount?.code ?? '',
								dxpVersion:
									koroneikiAccount?.dxpVersion ?? '7.4',
								id: koroneikiAccount?.id?.toString() ?? '', // Use koroneikiAccount.id and convert to string
								maxRequestors:
									koroneikiAccount?.maxRequestors ?? 0,
								name: koroneikiAccount?.name ?? '',
							} as IProject
						}
					/>
				</ClayModal>
			)}

			<div className="bg-neutral-1 d-flex flex-column px-3 py-3 rounded">
				<div className="d-flex">
					<div>
						<SearchBar
							onSearchSubmit={(term) => {
								setSearchTerm(term);
								onSearch(term);
							}}
						/>
					</div>

					<div className="align-items-center d-flex ml-auto">
						{(koroneikiAccount?.maxRequestors ?? 0) > 0 && (
							<>
								<PopoverIconButton
									alignPosition="top"
									popoverLink={{
										textLink: i18n.translate(
											'learn-more-about-customer-portal-roles'
										),
										url: articleAccountSupportURL,
									}}
									popoverText={i18n.translate(
										'the-support-seats-limit-counts-the-total-users-with-the-administrator-or-requester-role-administrators-and-requesters-have-permissions-to-open-support-tickets'
									)}
								/>

								<p className="font-weight-bold m-0">
									{i18n.translate('support-seats-available')}:
									&nbsp;
								</p>

								{loading ? (
									<Skeleton height={24} width={42} />
								) : (
									<p
										className={classNames(
											'font-weight-semi-bold m-0 text-neutral-7',
											{
												'mr-4': !hasAdministratorRole,
											}
										)}
									>
										{i18n.sub('x-of-x-available', [
											availableSupportSeatsCount.toString(),
											(
												koroneikiAccount?.maxRequestors ??
												0
											).toString(),
										])}
									</p>
								)}
							</>
						)}

						{hasAdministratorRole && (
							<Button
								aria-label={i18n.translate('invite')}
								className="bg-white ml-3 px-3 py-2"
								displayType="primary"
								onClick={() => {
									onOpenChange(true);
								}}
								outline
							>
								<span className="inline-item inline-item-before mr-2">
									<ClayIcon symbol="user-plus" />
								</span>

								{i18n.translate('invite')}
							</Button>
						)}
					</div>
				</div>

				<div className="d-flex">
					{Boolean(searchTerm) && !searching && (
						<p className="font-weight-semi-bold m-0 mt-3 text-paragraph-sm">
							{count > 1
								? i18n.sub('x-results-for-x', [
										count.toString(),
										searchTerm,
									])
								: i18n.sub('x-result-for-x', [
										count.toString(),
										searchTerm,
									])}
						</p>
					)}
				</div>
			</div>
		</>
	);
};

export default TeamMembersTableHeader;
