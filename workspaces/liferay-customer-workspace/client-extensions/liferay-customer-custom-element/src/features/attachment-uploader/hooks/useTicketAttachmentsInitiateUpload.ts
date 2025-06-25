/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useCallback, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Liferay} from '~/services/liferay';

interface IParams {
	fileMd5: string;
	fileName: string;
	fileSize: string;
	ticketId: string;
}

interface IResponse {
	accountKey: string;
	gcsSessionURL: string;
	ticketAttachmentId: string;
}

interface IProps {
	initiateUpload: (params: IParams) => Promise<IResponse | null>;
	loading: boolean;
	ticketAttachmentId: string;
}

const useTicketAttachmentsInitiateUpload = (): IProps => {
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const [ticketAttachmentId, setTicketAttachmentId] = useState('');

	const initiateUpload = useCallback(
		async (params: IParams): Promise<IResponse | null> => {
			setLoading(true);

			const {fileMd5, fileName, fileSize, ticketId} = params;

			try {
				const response: Response =
					(await Liferay.OAuth2Client.FromUserAgentApplication(
						'liferay-customer-etc-spring-boot-oaua'
					).fetch('/ticket-attachments/initiate-upload', {
						body: JSON.stringify({
							fileName,
							fileSize,
							gcsSessionURL:
								sessionStorage.getItem('gcsSessionURL'),
							md5Checksum: fileMd5,
							zendeskTicketId: ticketId,
						}),
						method: 'POST',
					})) as unknown as Response;

				const responseJSON = await response.json();

				if (!response.ok) {
					throw new Error(
						response.text() as unknown as string
					);
				}

				sessionStorage.setItem(
					'gcsSessionURL',
					responseJSON.gcsSessionURL
				);

				setTicketAttachmentId(responseJSON.ticketAttachmentId);

				return {
					accountKey: responseJSON.accountKey,
					gcsSessionURL: responseJSON.gcsSessionURL,
					ticketAttachmentId: responseJSON.ticketAttachmentId,
				};
			}
			catch (uploadError) {
				if (uploadError === "ATTACHMENT_ALREADY_EXISTS") {
					navigate(`/${ticketId}/attachement-already-exists`);
				}
				else if (uploadError === "FORBIDDEN_ACCESS" || uploadError === "ZENDESK_ORGANIZATION_ERROR") {
					navigate(`/${ticketId}/forbidden-access`);
				}
				else if (uploadError === "INVALID_TICKET_NUMBER") {
					navigate(`/${ticketId}/invalid-ticket-number`);
				}
				else {
					navigate(`/${ticketId}/unexpected-error`, {
						state: {
							message: String(uploadError),
						}
					});
				}

				return null;
			}
			finally {
				setLoading(false);
			}
		},
		[navigate]
	);

	return {
		initiateUpload,
		loading,
		ticketAttachmentId,
	};
};

export default useTicketAttachmentsInitiateUpload;
