/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {Badge} from '..';
import ClayForm from '@clayui/form';
import ClayIcon from '@clayui/icon';
import ClayMultiSelect from '@clayui/multi-select';
import ClaySticker from '@clayui/sticker';
import classNames from 'classnames';
import {useField, useFormikContext} from 'formik';
import {useEffect} from 'react';
import i18n from '~/utils/I18n';
import {validateEmailsArray} from '~/utils/validations.form';

export interface IMultiSelectItem {
	email?: string;
	label: string;
	value: string;
}

interface IProps<T> {
	filteredSourceItems?: T[];
	groupStyle?: string;
	helper?: React.ReactNode;
	items: T[];
	label: string;
	metaErrorCallback: (error: string | undefined) => void;
	name: string;
	onChange: (value: string) => void;
	onItemsChange?: (items: T[]) => void;
	placeholder?: string;
	required?: boolean;
	sourceItems: {email: string}[];
	type?: string;
	validations?: Array<(value: unknown) => string | undefined>;
	values: T[];
}

const MultiSelect = <T extends IMultiSelectItem>({
	filteredSourceItems,
	groupStyle,
	items,
	label,
	metaErrorCallback,
	onChange,
	sourceItems,
	validations,
	values,
	...props
}: IProps<T>) => {
	const formik = useFormikContext();

	const requiredMultiSelect = (value: number) => {
		if (!value) {
			return i18n.sub(
				'one-or-more-contacts-are-required-please-select-a-contact-for-x',
				[label]
			) as string;
		}
	};

	const validateMultiSelect = () => {
		const allValidations = validations ? [...validations] : [];

		if (props.required) {
			allValidations.push(() => requiredMultiSelect(values.length));
		}

		const unfilledField = allValidations
			.map((validation) => validation(values))
			.filter((error) => !!error);

		const emailErrors = validateEmailsArray(
			values.map((item) => item?.email || item?.label),
			sourceItems
		);

		return unfilledField.length ? unfilledField[0] : emailErrors;
	};

	const [field, meta] = useField({
		...props,
		name: props.name,
		validate: validateMultiSelect,
	});

	useEffect(() => {
		formik.setFieldValue(props.name, values);
		formik.validateField(props.name);
	}, [formik, props.name, values]);

	useEffect(() => {
		metaErrorCallback(meta.error);
	}, [meta.error, metaErrorCallback]);

	return (
		<div className="multi-select-container">
			<ClayForm.Group
				className={classNames('w-100', {
					groupStyle,
					'has-error': meta.touched && meta.error,
					'has-success': meta.touched && !meta.error,
				})}
			>
				<label className="ml-0">
					{`${label} `}

					{props.required && (
						<span className="inline-item-after reference-mark text-warning">
							<ClayIcon symbol="asterisk" />
						</span>
					)}
				</label>

				<ClayMultiSelect
					{...props}
					items={items}
					onBlur={field.onBlur}
					onChange={onChange}
					onItemsChange={props.onItemsChange}
					sourceItems={filteredSourceItems}
				>
					{(item: T, index?: number) => (
						<ClayMultiSelect.Item
							key={index}
							textValue={item?.label}
						>
							<div className="autofit-row autofit-row-center">
								<div className="autofit-col mr-3">
									<ClaySticker
										className="sticker-user-icon"
										size="sm"
									>
										<ClayIcon symbol="user" />
									</ClaySticker>
								</div>

								<div className="autofit-col">
									<strong>{item?.label}</strong>

									<span>{item?.email}</span>
								</div>
							</div>
						</ClayMultiSelect.Item>
					)}
				</ClayMultiSelect>

				{typeof meta.error === 'string' && meta.touched && (
					<Badge>
						<span className="pl-1">{meta.error as string}</span>
					</Badge>
				)}
			</ClayForm.Group>
		</div>
	);
};

export default MultiSelect;
