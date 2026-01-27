/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import DOMPurify from 'dompurify';
import {useEffect, useState} from 'react';
import {Table} from '~/components';
import {useAppContext} from '~/features/project/context';
import ActivationKeysLayout from '~/features/project/layouts/ActivationKeysLayout';
import {Liferay} from '~/services/liferay';
import {fetchHeadless} from '~/services/liferay/api';
import {getOrRequestToken} from '~/services/liferay/security/auth/getOrRequestToken';
import i18n from '~/utils/I18n';

interface IColumn {
	accessor: string;

	bodyClass: string;

	header: {
		name: string;

		styles: string;
	};

	headingTitle?: boolean;
}

interface IActivationInstructionsDataItem {
	instructions: string;

	version: string;
}

const columns: IColumn[] = [
	{
		accessor: 'version',
		bodyClass: 'border border-0 py-4 pl-4',
		header: {
			name: i18n.translate('version'),
			styles: 'bg-neutral-1 font-weight-bold text-neutral-8 table-cell-minw-200 py-3 pl-4',
		},
		headingTitle: true,
	},
	{
		accessor: 'instructions',
		bodyClass: 'border border-0',
		header: {
			name: i18n.translate('instructions'),
			styles: 'bg-neutral-1 font-weight-bold text-neutral-8 table-cell-expand-smaller py-3',
		},
	},
];

const Commerce = () => {
	const [activationInstructionsData, setActivationInstructionsData] =
		useState<IActivationInstructionsDataItem[]>([]);
	const [oAuthToken, setOAuthToken] = useState<string | undefined>(undefined);
	const [
		isLoadingActivationInstructions,
		setIsLoadingActivationInstructions,
	] = useState(false);

	const [{project}] = useAppContext();

	useEffect(() => {
		const fetchToken = async () => {
			const token = await getOrRequestToken();

			setOAuthToken(token);
		};

		fetchToken();
	}, []);

	const fetchCommerceActivationsKeysInstructions = async () => {
		const webContentFolderName = 'commerce-activation';
		const webContentTemplateName = 'COMMERCE-ACTIVATION-TEMPLATE';

		const siteGroupId = Liferay.ThemeDisplay.getSiteGroupId();

		const structuredContentFolders = await fetchHeadless({
			url: `/sites/${siteGroupId}/structured-content-folders`,
		});

		const {id: commerceActivationInstructionsFolderID} =
			structuredContentFolders.items.find(
				({name}: {name: string}) => name === webContentFolderName
			) || {};

		const contentTemplates = await fetchHeadless({
			url: `/sites/${siteGroupId}/content-templates`,
		});

		const contentTemplate = contentTemplates.items.find(
			({id}: {id: string}) => id === webContentTemplateName
		);

		const structuredContents = await fetchHeadless({
			url: `/structured-content-folders/${commerceActivationInstructionsFolderID}/structured-contents`,
		});

		const renderedInstructionsData = await structuredContents.items.reduce(
			async (
				structuredContentList: Promise<
					IActivationInstructionsDataItem[]
				>,
				structuredContent: any
			) => {
				const promiseStructuredContentList =
					await structuredContentList;

				const dxpVersion =
					structuredContent.contentFields.find(
						({name}: {name: string}) => name === 'DXPVersion'
					) || {};
				const structuredComponent = await fetchHeadless({
					resolveAsJson: false,
					url: `/structured-contents/${structuredContent?.id}/rendered-content/${contentTemplate?.id}`,
				});

				promiseStructuredContentList.push({
					instructions: await structuredComponent.text(),
					version: dxpVersion?.contentFieldValue?.data || '',
				});

				return structuredContentList;
			},
			Promise.resolve([])
		);

		setActivationInstructionsData(renderedInstructionsData);
		setIsLoadingActivationInstructions(false);
	};

	useEffect(() => {
		setIsLoadingActivationInstructions(true);
		fetchCommerceActivationsKeysInstructions();
	}, []);

	if (!project) {
		return <ActivationKeysLayout.Skeleton />;
	}

	return (
		<ActivationKeysLayout>
			{oAuthToken && project.dxpVersion && project.dxpVersion < '7.3' ? (
				<ActivationKeysLayout.Inputs
					accountKey={project.accountKey}
					accountSubscriptionGroupName="commerce"
					oAuthToken={oAuthToken}
					productTitle="Commerce"
					projectName={project?.name}
				/>
			) : (
				<Table
					checkboxConfig={{
						checkboxesChecked: [],
						setCheckboxesChecked: () => {},
					}}
					className="cp-activation-keys-commerce-table mt-4 table-autofit"
					columns={columns}
					handleSortChange={() => {}}
					hasCheckbox={false}
					hasPagination={false}
					isLoading={isLoadingActivationInstructions}
					paginationConfig={{
						activePage: 1,
						itemsPerPage: 10,
						setActivePage: () => {},
						setItemsPerPage: () => {},
						totalCount: 0,
					}}
					rows={activationInstructionsData.map(
						({instructions, version}) => ({
							id: version,
							instructions: (
								<div
									dangerouslySetInnerHTML={{
										__html: DOMPurify.sanitize(
											instructions,
											{USE_PROFILES: {html: true}}
										),
									}}
									key={version}
								></div>
							),
							version: (
								<span className="m-0 table-list-title text-neutral-7 text-paragraph">
									{version}
								</span>
							),
						})
					)}
				/>
			)}
		</ActivationKeysLayout>
	);
};

export default Commerce;
