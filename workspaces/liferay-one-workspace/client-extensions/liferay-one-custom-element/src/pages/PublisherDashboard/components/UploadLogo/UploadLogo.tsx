/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayIcon from '@clayui/icon';
import {ClayTooltipProvider} from '@clayui/tooltip';
import ReactDOMServer from 'react-dom/server';
import {UploadedFile} from '~/components/FileList/FileList';
import i18n, {translate} from '~/i18n';

import './UploadLogo.css';

type UploadLogoProps = {
	onDeleteFile: (id: string) => void;
	onUpload: (files: FileList) => void;
	tooltip?: string;
	uploadedFile?: UploadedFile;
};

const UploadLogo: React.FC<UploadLogoProps> = ({
	onDeleteFile,
	onUpload,
	uploadedFile,
}) => {
	return (
		<ClayTooltipProvider>
			<div className="upload-logo-container">
				{uploadedFile?.preview ? (
					<img
						alt={translate('new-app-logo')}
						className="upload-logo-icon"
						src={uploadedFile?.preview}
					/>
				) : (
					<div className="align-items-center bg-light d-flex justify-content-center rounded upload-logo-placeholder">
						<ClayIcon
							aria-label={translate('new-app-logo')}
							className="text-muted upload-logo-placeholder-icon"
							symbol="picture"
						/>
					</div>
				)}

				<div
					data-title-set-as-html
					data-tooltip-align="top"
					title={ReactDOMServer.renderToString(
						<span>
							{translate(
								'the-icon-is-a-small-image-representation-of-the-app-icons-must-be-a-png-jpg-or-gif-format-and-cannot-exceed-5mb-animated-images-are-prohibited-the-use-of-the-liferay-logo-including-any-permitted-alternate-versions-of-the-liferay-logo-is-permitted-only-with-liferays-express-permission-please-refer-to-our'
							)}{' '}
							<a
								href="https://www.liferay.com/trademark"
								target="_blank"
							>
								{translate('trademark-policy')}
							</a>{' '}
							{translate('for-details')}
						</span>
					)}
				>
					<input
						accept="image/jpeg, image/png, image/gif"
						id="file"
						name="file"
						onChange={({target: {files}}) => {
							if (files !== null) {
								onUpload(files);
							}
						}}
						type="file"
					/>

					<label
						className="btn btn-primary btn-sm m-0"
						htmlFor="file"
					>
						{i18n.translate('upload-image')}
					</label>
				</div>

				{uploadedFile?.preview && (
					<button
						className="btn btn-secondary btn-sm m-0 upload-logo-delete-button"
						onClick={() => onDeleteFile(uploadedFile.id)}
					>
						{i18n.translate('delete')}
					</button>
				)}
			</div>
		</ClayTooltipProvider>
	);
};

export default UploadLogo;
