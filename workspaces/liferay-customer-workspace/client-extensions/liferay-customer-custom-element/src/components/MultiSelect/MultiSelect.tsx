/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {ClayButtonWithIcon} from '@clayui/button';
import ClayDropDown from '@clayui/drop-down';
import {ClayInput} from '@clayui/form';
import ClayLabel from '@clayui/label';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import i18n from '~/utils/I18n';

interface Item {
	email?: string;
	label: string;
	value: string;
	[key: string]: any;
}

interface MultiSelectProps {
	addItems?: (items: Item[]) => void;
	disabled?: boolean;
	emptyResponseMessage?: string;
	items: Item[];
	label: string;
	maxItems?: number;
	noResultsMessage?: string;
	placeholder?: string;
	removeItems?: (items: Item[]) => void;
	selectedItems?: Item[];
}

const MultiSelectComponent = ({
	addItems,
	disabled,
	emptyResponseMessage,
	items,
	label,
	maxItems,
	noResultsMessage,
	placeholder,
	removeItems,
	selectedItems = [],
}: MultiSelectProps) => {
	const [currentSelectedItems, setCurrentSelectedItems] =
		useState<Item[]>(selectedItems);
	const [inputValue, setInputValue] = useState('');
	const [active, setActive] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setCurrentSelectedItems(selectedItems);
	}, [selectedItems]);

	const sourceItems: Item[] = useMemo(() => {
		return items.filter(
			(sourceItem) =>
				!currentSelectedItems.some(
					(item) => item.value === sourceItem.value
				)
		);
	}, [items, currentSelectedItems]);

	const filteredSuggestions = useMemo(() => {
		if (inputValue) {
			return sourceItems.filter((item) =>
				item.label.toLowerCase().includes(inputValue.toLowerCase())
			);
		}

		return sourceItems;
	}, [sourceItems, inputValue]);

	const handleItemAdd = useCallback(
		(item: Item) => {
			if (
				maxItems &&
				currentSelectedItems.length >= maxItems &&
				!currentSelectedItems.some(
					(selected) => selected.value === item.value
				)
			) {
				return;
			}

			setCurrentSelectedItems((prevItems) => {
				const newItems = [...prevItems, item];
				addItems?.([item]);

				return newItems;
			});
			setInputValue('');
			setActive(false);
		},
		[addItems, currentSelectedItems, maxItems]
	);

	const handleItemRemove = useCallback(
		(itemToRemove: Item) => {
			setCurrentSelectedItems((prevItems) => {
				const newItems = prevItems.filter(
					(item) => item.value !== itemToRemove.value
				);
				removeItems?.([itemToRemove]);

				return newItems;
			});
		},
		[removeItems]
	);

	const handleInputChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			setInputValue(event.target.value);
			setActive(true);
		},
		[]
	);

	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLInputElement>) => {
			if (
				event.key === 'Enter' &&
				!!filteredSuggestions.length &&
				inputValue
			) {
				event.preventDefault();
				handleItemAdd(filteredSuggestions[0]);
			}
			else if (
				event.key === 'Backspace' &&
				inputValue === '' &&
				!!currentSelectedItems.length
			) {
				event.preventDefault();
				handleItemRemove(
					currentSelectedItems[currentSelectedItems.length - 1]
				);
			}
		},
		[
			filteredSuggestions,
			inputValue,
			currentSelectedItems,
			handleItemAdd,
			handleItemRemove,
		]
	);

	return (
		<div className="multi-select-container">
			<div className="form-control">
				{currentSelectedItems.map((item) => (
					<ClayLabel
						closeButtonProps={{
							'aria-label': `Remove ${item.label}`,
							'onClick': () => handleItemRemove(item),
						}}
						displayType="unstyled"
						key={item.value}
					>
						{item.label}
					</ClayLabel>
				))}
				<ClayInput
					disabled={disabled}
					onChange={handleInputChange}
					onFocus={() => setActive(true)}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					ref={inputRef}
					value={inputValue}
				/>
			</div>
			<ClayDropDown
				active={active && !!filteredSuggestions.length}
				onActiveChange={setActive}
				trigger={<div />}
			>
				<ClayDropDown.Menu alignElementRef={inputRef}>
					{filteredSuggestions.length ? (
						filteredSuggestions.map((item) => (
							<ClayDropDown.Item
								key={item.value}
								onClick={() => handleItemAdd(item)}
							>
								{item.label}
							</ClayDropDown.Item>
						))
					) : (
						<ClayDropDown.Item>
							{inputValue
								? noResultsMessage ||
									i18n.translate('no-results')
								: emptyResponseMessage ||
									i18n.translate('type-to-search')}
						</ClayDropDown.Item>
					)}
				</ClayDropDown.Menu>
			</ClayDropDown>

			{maxItems && currentSelectedItems.length >= maxItems && (
				<div className="mt-2">
					<span
						title={i18n.sub(
							'maximum-number-of-items-reached-for-x',
							[label]
						)}
					>
						<ClayButtonWithIcon
							displayType="unstyled"
							onPointerEnterCapture={() => {}}
							onPointerLeaveCapture={() => {}}
							placeholder=""
							symbol="warning-full"
						/>
					</span>
				</div>
			)}
		</div>
	);
};

export default MultiSelectComponent;
