/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useCallback, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Liferay} from '~/services/liferay';

interface IParams {
	accountKey: string;
	comment: string;
	ticketAttachmentId: string;
	ticketId: string;
}

interface IProps {
	completeUpload: (params: IParams) => Promise<void>;
	loading: boolean;
}

const useTicketAttachmentsCompleteUpload = (): IProps => {
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const completeUpload = useCallback(async (params: IParams) => {
		setLoading(true);

		const {accountKey, comment, ticketAttachmentId, ticketId} = params;

		try {
			const response: Response =
				(await Liferay.OAuth2Client.FromUserAgentApplication(
					'liferay-customer-etc-spring-boot-oaua'
				).fetch(
					`/ticket-attachments/${ticketAttachmentId}/complete-upload`,
					{
						body: JSON.stringify({
							zendeskTicketCommentBody: comment,
						}),
						method: 'POST',
					}
				)) as unknown as Response;

			if (!response.ok) {
				throw new Error(
					response.text() as unknown as string
				);
			}

			sessionStorage.removeItem('gcsSessionURL');
		}
		catch (uploadError) {
			console.log(uploadError);

			if (uploadError === "COMMENT_POST_FAILED_RETRYING") {
				navigate(`/${ticketId}/comment-post-failed`, {
					state: {
						accountKey,
						ticketId
					}
				});
			}
			else if (uploadError === "FILE_SERVER_UNAVAILABLE") {
				navigate(`/${ticketId}/server-unavailable`, {
					state: {
						accountKey,
						ticketId
					}
				});
			}
			else {
				navigate(`/${ticketId}/unexpected-error`, {
					state: {
						message: String(uploadError),
					}
				});
			}
		}
		finally {
			setLoading(false);
		}
	}, []);

	return {completeUpload, loading};
};

export default useTicketAttachmentsCompleteUpload;
