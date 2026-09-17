/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import Form from '~/components/MarketplaceForm/MarketplaceForm';
import i18n, {translate} from '~/i18n';
import RichText from '~/pages/PublisherDashboard/components/RichText/RichText';
import {MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH} from '~/utils/blockConstants';

import type {TextBlock as TextBlockType} from '~/context/SolutionContextProvider';
import type {BlockTypeProps} from '~/types/blockTypeProps';

const TextBlock = ({
	block: {content},
	onChange,
}: BlockTypeProps<TextBlockType>) => (
	<div className="p-4">
		<Form.FormControl>
			<Form.Label className="mt-2" htmlFor="title" required>
				{i18n.translate('title')}
			</Form.Label>

			<Form.Input
				maxLength={MAX_TITLE_LENGTH}
				name="title"
				onChange={(event) => onChange({title: event.target.value})}
				placeholder={translate('enter-title')}
				type="text"
				value={content.title ?? ''}
			/>
		</Form.FormControl>

		<Form.FormControl>
			<Form.Label className="mt-5" htmlFor="description" required>
				{i18n.translate('description')}
			</Form.Label>

			<RichText
				maxLength={MAX_DESCRIPTION_LENGTH}
				onChange={(description) => onChange({description})}
				placeholder={i18n.translate('insert-text-here')}
				value={content.description ?? ''}
			/>
		</Form.FormControl>
	</div>
);

export default TextBlock;
