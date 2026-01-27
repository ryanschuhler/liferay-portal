/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {ClayButtonWithIcon} from '@clayui/button';
import {ClayInput} from '@clayui/form';
import classNames from 'classnames';
import {memo, useState} from 'react';
import i18n from '~/utils/I18n';

interface SearchBarProps {
	isBusinessEvent?: boolean;
	onSearchSubmit: (term: string) => void;
}

const SearchBar = ({isBusinessEvent, onSearchSubmit}: SearchBarProps) => {
	const [term, setTerm] = useState<string>('');
	const [searching, setSearching] = useState<boolean>(true);

	const handleSearchSubmit = () => {
		if (searching) {
			onSearchSubmit(term);
			setSearching(false);

			return;
		}

		setTerm('');
		onSearchSubmit('');
		setSearching(true);
	};

	return (
		<ClayInput.Group
			className={classNames('m-0 mr-2', {
				'rounded shadow-lg': isBusinessEvent,
			})}
		>
			<ClayInput.GroupItem>
				<ClayInput
					className={classNames(
						'form-control input-group-inset input-group-inset-after',
						{
							'border-brand-primary-lighten-5 font-weight-semi-bold':
								isBusinessEvent,
						}
					)}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
						setTerm(event.target.value);
						setSearching(true);
					}}
					onKeyPress={(
						event: React.KeyboardEvent<HTMLInputElement>
					) => {
						if (event.key === 'Enter') {
							handleSearchSubmit();
						}
					}}
					placeholder={
						isBusinessEvent
							? i18n.translate('search-event-name')
							: i18n.translate('search')
					}
					type="text"
					value={term}
				/>

				<ClayInput.GroupInsetItem
					after
					className={classNames({
						'border-brand-primary-lighten-5': isBusinessEvent,
					})}
					tag="span"
				>
					{searching || !term ? (
						<ClayButtonWithIcon
							aria-label={i18n.translate('search')}
							displayType="unstyled"
							onClick={() => handleSearchSubmit()}
							onPointerEnterCapture={() => {}}
							onPointerLeaveCapture={() => {}}
							placeholder=""
							symbol="search"
						/>
					) : (
						<ClayButtonWithIcon
							aria-label={i18n.translate('clear')}
							className="navbar-breakpoint-d-none"
							displayType="unstyled"
							onClick={() => handleSearchSubmit()}
							onPointerEnterCapture={() => {}}
							onPointerLeaveCapture={() => {}}
							placeholder=""
							symbol="times"
						/>
					)}
				</ClayInput.GroupInsetItem>
			</ClayInput.GroupItem>
		</ClayInput.Group>
	);
};
export default memo(SearchBar);
