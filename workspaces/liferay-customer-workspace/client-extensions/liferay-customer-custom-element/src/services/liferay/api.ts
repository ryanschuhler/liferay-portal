/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {IBusinessEvent, IContact, ITicketAttachment} from '~/utils/types';

import {Liferay} from '.';
import {fetcher} from './fetcher';

const HEADLESS_DELIVERY_BASE_URL_ = `${window.location.origin}/o/headless-delivery/v1.0`;
const HEADLESS_BASE_URL = `${window.location.origin}/o/`;

function fetchHeadless(options: {
	resolveAsJson: false;
	url: string;
}): Promise<Response>;
function fetchHeadless<T = any>(options: {
	resolveAsJson?: true;
	url: string;
}): Promise<T>;
async function fetchHeadless<T = any>({
	resolveAsJson = true,
	url,
}: {
	resolveAsJson?: boolean;
	url: string;
}): Promise<any> {
	return fetcher<T>(`${HEADLESS_DELIVERY_BASE_URL_}${url}`, {
		headers: {
			'Accept-Language': Liferay.ThemeDisplay.getBCP47LanguageId(),
			'Cache-Control': 'max-age=30, stale-while-revalidate=30',
			'x-csrf-token': Liferay.authToken,
		},
		resolveAsJson,
	});
}

const getBusinessEventById = async (
	id: string | number
): Promise<IBusinessEvent | undefined> => {
	return fetcher<IBusinessEvent>(
		`${HEADLESS_BASE_URL}${`c/businessevents/${id}`}`,
		{
			headers: {
				'Accept-Language': Liferay.ThemeDisplay.getBCP47LanguageId(),
				'Content-Type': 'application/json',
				'x-csrf-token': Liferay.authToken,
			},
			method: 'GET',
		}
	);
};

const getBusinessEvents = async (
	filters: string
): Promise<{items: IBusinessEvent[]; totalCount: number} | undefined> => {
	return fetcher<{items: IBusinessEvent[]; totalCount: number}>(
		`${HEADLESS_BASE_URL}${`c/businessevents?${filters}`}`,
		{
			headers: {
				'Accept-Language': Liferay.ThemeDisplay.getBCP47LanguageId(),
				'Content-Type': 'application/json',
				'x-csrf-token': Liferay.authToken,
			},
			method: 'GET',
		}
	);
};

const getBusinessEventVersions = async (
	filters: string
): Promise<{items: any[]; totalCount: number} | undefined> => {
	return fetcher<{items: any[]; totalCount: number}>(
		`${HEADLESS_BASE_URL}${`c/businesseventversions?${filters}`}`,
		{
			headers: {
				'Accept-Language': Liferay.ThemeDisplay.getBCP47LanguageId(),
				'Content-Type': 'application/json',
				'x-csrf-token': Liferay.authToken,
			},
			method: 'GET',
		}
	);
};

const getHighPriorityContacts = async (
	filter: string
): Promise<{items: IContact[]; totalCount: number} | undefined> => {
	return fetcher<{items: IContact[]; totalCount: number}>(
		`${HEADLESS_BASE_URL}${`c/highprioritycontacts/?nestedFields=user&filter=${filter}`}`,
		{
			headers: {
				'Accept-Language': Liferay.ThemeDisplay.getBCP47LanguageId(),
				'Cache-Control': 'max-age=30, stale-while-revalidate=30',
				'x-csrf-token': Liferay.authToken,
			},
		}
	);
};

const getTicketAttachmentById = async (
	id: string,
	fields: string
): Promise<ITicketAttachment | undefined> => {
	return fetcher<ITicketAttachment>(
		`${HEADLESS_BASE_URL}${`c/ticketattachments/${id}?fields=${fields}`}`,
		{
			headers: {
				'Accept-Language': Liferay.ThemeDisplay.getBCP47LanguageId(),
				'Cache-Control': 'max-age=30, stale-while-revalidate=30',
				'x-csrf-token': Liferay.authToken,
			},
			method: 'GET',
		}
	);
};

const getTicketAttachments = async (
	filter: string
): Promise<{items: ITicketAttachment[]; totalCount: number} | undefined> => {
	return fetcher<{items: ITicketAttachment[]; totalCount: number}>(
		`${HEADLESS_BASE_URL}${`c/ticketattachments?filter=${filter}`}`,
		{
			headers: {
				'Accept-Language': Liferay.ThemeDisplay.getBCP47LanguageId(),
				'Cache-Control': 'max-age=30, stale-while-revalidate=30',
				'x-csrf-token': Liferay.authToken,
			},
			method: 'GET',
		}
	);
};

const updateBusinessEventItem = async (
	id: string | number,
	fieldsToPatch: Partial<IBusinessEvent>
): Promise<IBusinessEvent | undefined> => {
	return fetcher<IBusinessEvent>(
		`${HEADLESS_BASE_URL}c/businessevents/${id}`,
		{
			body: JSON.stringify(fieldsToPatch),
			headers: {
				'Accept-Language': Liferay.ThemeDisplay.getBCP47LanguageId(),
				'Content-Type': 'application/json',
				'x-csrf-token': Liferay.authToken,
			},
			method: 'PATCH',
		}
	);
};

export {
	getBusinessEventById,
	getBusinessEvents,
	getBusinessEventVersions,
	getHighPriorityContacts,
	getTicketAttachmentById,
	getTicketAttachments,
	fetchHeadless,
	updateBusinessEventItem,
};
