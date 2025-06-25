/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import React from 'react';
import {Outlet, useParams} from 'react-router-dom';

import {
	AttachmentNotFound,
	ForbiddenAccess,
	InvalidTicketNumber,
	UnexpectedError,
} from '../../pages/AttachmentUploaderMessages';
import useCheckTicketAccess from '../../hooks/useCheckTicketAccess';
import ClayLoadingIndicator from '@clayui/loading-indicator';

const Layout: React.FC = () => {
	const {ticketId} = useParams<{ticketId: string}>();
	const {error, hasAccess, loading, ticketExists} =
		useCheckTicketAccess(ticketId);

	if (loading) {
		return <ClayLoadingIndicator />;
	}

	if (!ticketId || ticketId.trim() === '') {
		return <InvalidTicketNumber />;
	}

	if (error) {
		console.error('Error during ticket access check:', error);

		return <UnexpectedError />;
	}

	if (!ticketExists) {
		return <AttachmentNotFound />;
	}

	if (!hasAccess) {
		return <ForbiddenAccess />;
	}

	return <Outlet />;
};

export default Layout;
