/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {ApolloClient, NormalizedCacheObject} from '@apollo/client';
import {createContext, useContext} from 'react';

export interface IAppPropertiesContext {
	accountSettingsURL: string;
	articleAccountSupportURL: string;
	articleDeactivateKey: string;
	articleDeployingActivationKeysURL: string;
	articleGettingStartedWithLiferayEnterpriseSearchURL: string;
	articleNotifiedWhenMyActivationKeyIsAboutToExpireURL: string;
	articleWhatIsMyInstanceSizingValueURL: string;
	client: ApolloClient<NormalizedCacheObject>;
	createTicketURL: string;
	featureFlags: string[];
	importDate?: string | null;
	jiraFLSPortalURL: string;
	jiraFLSProject: string;
	jiraHCPortalURL: string;
	provisioningServerAPI: string;
	submitSupportTicketURL: string;
	theOverviewPageURL: string;
}

export const AppPropertiesContext = createContext<IAppPropertiesContext>({
	accountSettingsURL: '',
	articleAccountSupportURL: '',
	articleDeactivateKey: '',
	articleDeployingActivationKeysURL: '',
	articleGettingStartedWithLiferayEnterpriseSearchURL: '',
	articleNotifiedWhenMyActivationKeyIsAboutToExpireURL: '',
	articleWhatIsMyInstanceSizingValueURL: '',
	client: null as unknown as ApolloClient<NormalizedCacheObject>,
	createTicketURL: '',
	featureFlags: [],
	importDate: null,
	jiraFLSPortalURL: '',
	jiraFLSProject: '',
	jiraHCPortalURL: '',
	provisioningServerAPI: '',
	submitSupportTicketURL: '',
	theOverviewPageURL: '',
});

export function useAppPropertiesContext() {
	return useContext(AppPropertiesContext);
}
