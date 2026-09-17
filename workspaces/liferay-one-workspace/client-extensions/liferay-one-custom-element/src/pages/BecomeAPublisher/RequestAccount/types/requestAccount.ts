/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import publishingSchemas from '~/schemas/publishingSchemas';

import type {z} from 'zod';

export type PublisherForm = z.infer<
	typeof publishingSchemas.becomePublisherForm
>;

export enum RequestAccountStep {
	FORM = 'form',
	SUMMARY = 'summary',
	REQUESTED = 'requested',
}
