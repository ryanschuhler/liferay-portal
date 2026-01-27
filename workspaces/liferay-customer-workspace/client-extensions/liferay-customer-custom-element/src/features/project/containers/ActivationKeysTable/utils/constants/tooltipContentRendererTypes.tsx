/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import i18n from '~/utils/I18n';

interface TooltipContentRendererTypes {
	[key: string]: JSX.Element;
}

export const TOOLTIP_CONTENT_RENDERER_TYPES: TooltipContentRendererTypes = {
	'dropdown-item': (
		<p
			className="m-0"
			dangerouslySetInnerHTML={{
				__html: i18n.sub(
					'to-download-an-aggregate-key-select-keys-for-a-valid-liferay-version-with-identical-type-start-date-end-date-and-instance-size-to-learn-more-click-x-here-x',
					[
						'<a href="https://support.liferay.com/w/how-do-i-download-my-liferay-dxp-portal-activation-keys" target="_blank">',
						'</a>',
					]
				),
			}}
		/>
	),
};
