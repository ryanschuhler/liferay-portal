/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import i18n from '~/utils/I18n';

import FetcherError from './FetchError';

export interface IFetcherOptions extends RequestInit {
	resolveAsJson?: boolean;
}

export async function fetcher<T = any>(
	url: string | URL,
	options?: IFetcherOptions
): Promise<T | undefined> {
	const {resolveAsJson = true, ...fetchOptions} = options || {};

	// eslint-disable-next-line @liferay/portal/no-global-fetch
	const response = await fetch(url, {
		...fetchOptions,
		headers: {
			...fetchOptions?.headers,
			...(fetchOptions?.method === 'POST' && {
				'Content-Type': 'application/json',
			}),
		},
	});

	if (!response.ok) {
		const error = new FetcherError(
			i18n.translate('an-unexpected-error-occurred')
		);

		error.info = (await response.json()) as unknown;
		error.status = response.status;
		console.error(error.info, JSON.stringify({options, url}, null, 2));

		throw error;
	}

	if (!resolveAsJson) {
		return response as unknown as T;
	}

	if (response.status !== 204) {
		return response.json();
	}
}

export type BaseFetcherType = <T>(
	url: string | URL,
	options?: IFetcherOptions
) => Promise<T | undefined>;

const baseFetcher =
	(baseURL: string | URL, baseOptions?: IFetcherOptions): BaseFetcherType =>
	<T>(url: string | URL, options?: IFetcherOptions) =>
		fetcher<T>(`${baseURL}${url}`, {
			...baseOptions,
			...options,
		});

export {baseFetcher};
