/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useCallback, useEffect, useState} from 'react';

interface ICheckTicketAccessResult {
	error: Error | null;
	hasAccess: boolean | null;
	loading: boolean;
	ticketExists: boolean | null;
}

const useCheckTicketAccess = (
	ticketId: string | undefined
): ICheckTicketAccessResult => {
	const [error, setError] = useState<Error | null>(null);
	const [hasAccess, setHasAccess] = useState<boolean | null>(null);
	const [loading, setLoading] = useState(true);
	const [ticketExists, setTicketExists] = useState<boolean | null>(null);

	const checkAccess = useCallback(async () => {
		if (!ticketId) {
			setLoading(false);
			setHasAccess(false);
			setTicketExists(false);

			return;
		}

		setLoading(true);
		setError(null);
		setHasAccess(null);
		setTicketExists(null);

		try {
			// IMPORTANT: Replace this with your actual API endpoint to check ticket access.
			const response = await fetch(`/accounts/${externalReferenceCode}/tickets/${ticketId}`);

			if (response.ok) {
				setHasAccess(true);
				setTicketExists(true);
			}
			else if (response.status === 404) {
				setHasAccess(false);
				setTicketExists(false);
			}
			else if (response.status === 403) {
				setHasAccess(false);
				setTicketExists(true);
			}
			else {
				setError(new Error(`Failed to check ticket access: ${response.status} ${response.statusText}`));
			}
		}
		catch (err) {
			console.error('Error checking ticket access:', err);
			setError(err instanceof Error ? err : new Error(String(err)));
		}
		finally {
			setLoading(false);
		}
	}, [ticketId]);

	useEffect(() => {
		checkAccess();
	}, [checkAccess]);

	return {error, hasAccess, loading, ticketExists};
};

export default useCheckTicketAccess;
