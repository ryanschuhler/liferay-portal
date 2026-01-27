/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayModal from '@clayui/modal';
import Button from '~/components/Button';
import i18n from '~/utils/I18n';

interface ConfirmationMessageModalProps {
	confirmKeyNoLongerVisible: () => void;
	observer: any; // Using any for now, can be refined if needed
}

const ConfirmationMessageModal = ({
	confirmKeyNoLongerVisible,
	observer,
}: ConfirmationMessageModalProps) => {
	return (
		<ClayModal center observer={observer}>
			<div className="pt-4 px-4">
				<div className="flex-row mb-1">
					<div className="d-flex justify-content-between">
						<h2 className="text-neutral-10">
							{i18n.translate('deactivated-key-s-request')}
						</h2>

						<Button
							appendIcon="times"
							aria-label="close"
							className="align-self-start"
							displayType="unstyled"
							onClick={confirmKeyNoLongerVisible}
						/>
					</div>

					<p className="mb-6 mt-5 text-neutral-10">
						{i18n.translate(
							'a-request-was-just-sent-to-deactivate-the-selected-activation-keys-from-now-on-they-will-be-hidden-and-no-longer-be-visible'
						)}
					</p>
				</div>

				<div className="d-flex justify-content-end my-4">
					<Button
						className="bg-danger d-flex ml-2"
						onClick={confirmKeyNoLongerVisible}
					>
						{i18n.translate('continue')}
					</Button>
				</div>
			</div>
		</ClayModal>
	);
};

export default ConfirmationMessageModal;
