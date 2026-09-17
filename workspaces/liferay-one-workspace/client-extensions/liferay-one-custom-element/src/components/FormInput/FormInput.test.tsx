/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {zodResolver} from '@hookform/resolvers/zod';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {useForm} from 'react-hook-form';
import {describe, expect, it, vi} from 'vitest';
import {z} from 'zod';

import FormInput from './FormInput';

const schema = z.object({
	emailAddress: z.string().email('Please enter a valid email address'),
});

function EmailForm({onValid}: {onValid: (values: unknown) => void}) {
	const {
		formState: {errors},
		handleSubmit,
		register,
	} = useForm<Record<string, string>>({
		defaultValues: {emailAddress: ''},
		resolver: zodResolver(schema),
	});

	return (
		<form onSubmit={handleSubmit(onValid)}>
			<FormInput
				errors={errors as Record<string, {message?: string}>}
				label="Email Address"
				name="emailAddress"
				register={register}
				required
			/>

			<button type="submit">Invite</button>
		</form>
	);
}

describe('FormInput', () => {
	it('labels the input so the label focuses it', () => {
		render(<FormInput label="Email Address" name="emailAddress" />);

		expect(screen.getByLabelText('Email Address')).toHaveAttribute(
			'name',
			'emailAddress'
		);
	});

	it('renders the description and help message alongside the input', () => {
		render(
			<FormInput
				description="We only use this to send the invitation"
				helpMessage="Work addresses only"
				label="Email Address"
				name="emailAddress"
			/>
		);

		expect(
			screen.getByText('We only use this to send the invitation')
		).toBeInTheDocument();
		expect(screen.getByText('Work addresses only')).toBeInTheDocument();
	});

	it('shows only the error belonging to its own field', () => {
		render(
			<FormInput
				errors={{
					familyName: {message: 'Last name is required'},
				}}
				label="Email Address"
				name="emailAddress"
			/>
		);

		expect(
			screen.queryByText('Last name is required')
		).not.toBeInTheDocument();
	});

	it('rejects a malformed address and surfaces the message from the schema', async () => {
		const onValid = vi.fn();

		render(<EmailForm onValid={onValid} />);

		await userEvent.type(
			screen.getByLabelText('Email Address'),
			'not-an-email'
		);
		await userEvent.click(screen.getByRole('button', {name: 'Invite'}));

		expect(
			await screen.findByText('Please enter a valid email address')
		).toBeInTheDocument();
		expect(onValid).not.toHaveBeenCalled();
	});

	it('submits once the address is valid and clears the message', async () => {
		const onValid = vi.fn();

		render(<EmailForm onValid={onValid} />);

		await userEvent.type(
			screen.getByLabelText('Email Address'),
			'member@liferay.com'
		);
		await userEvent.click(screen.getByRole('button', {name: 'Invite'}));

		expect(onValid).toHaveBeenCalledTimes(1);
		expect(onValid.mock.calls[0][0]).toMatchObject({
			emailAddress: 'member@liferay.com',
		});
		expect(
			screen.queryByText('Please enter a valid email address')
		).not.toBeInTheDocument();
	});
});
