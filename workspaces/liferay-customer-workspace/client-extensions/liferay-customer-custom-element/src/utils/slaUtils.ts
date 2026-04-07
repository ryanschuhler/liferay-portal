/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {SLA_TYPES} from '~/utils/constants/slaTypes';

export function hasPrioritySLA(sla?: string) {
	return (
		sla?.includes(SLA_TYPES.global) ||
		sla?.includes(SLA_TYPES.gold) ||
		sla?.includes(SLA_TYPES.platinum) ||
		sla?.includes(SLA_TYPES.premier) ||
		sla?.includes(SLA_TYPES.standard) ||
		sla?.includes(SLA_TYPES.strategic)
	);
}
