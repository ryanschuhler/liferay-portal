/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

/* eslint-disable no-console -- CLI script; console output is its user interface */

import {enumerateSurface} from './surface.ts';

for (const group of enumerateSurface()) {
	console.log(
		`\n## ${group.title} (${group.prefix}) — ${group.anchors.length}`
	);

	for (const anchor of group.anchors) {
		console.log(anchor);
	}
}
