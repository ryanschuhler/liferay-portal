/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState} from 'react';
import {useSearchParams} from 'react-router-dom';

const BASE_URL = '/o/one/v1/common-license-keys';
const PAGE_SIZE = 20;

type ProductGroup = 'COMMERCE' | 'ENTERPRISE_SEARCH';

type CommonLicenseKey = {
	endDate: string;
	id: number;
	name: string;
	productEnvironment: string;
	startDate: string;
};

type ApiPage = {
	items: CommonLicenseKey[];
	lastPage: number;
	page: number;
	pageSize: number;
	totalCount: number;
};

declare const Liferay: {authToken?: string} | undefined;

function csrfHeaders(): Record<string, string> {
	const token =
		typeof Liferay !== 'undefined' ? (Liferay.authToken ?? '') : '';

	return {'x-csrf-token': token};
}

function formatDate(iso: string): string {
	try {
		return new Date(iso).toLocaleDateString(undefined, {dateStyle: 'medium'});
	}
	catch {
		return iso;
	}
}

async function downloadKey(id: number, name: string): Promise<void> {
	const response = await fetch(`${BASE_URL}/${id}/download`, {
		credentials: 'include',
		headers: csrfHeaders(),
	});

	if (!response.ok) {
		throw new Error(`Download failed: ${response.status}`);
	}

	const blob = await response.blob();
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.download = name;
	anchor.href = url;
	anchor.style.display = 'none';
	document.body.appendChild(anchor);
	anchor.click();
	document.body.removeChild(anchor);
	URL.revokeObjectURL(url);
}

async function deleteKey(id: number): Promise<void> {
	const response = await fetch(`${BASE_URL}/${id}`, {
		credentials: 'include',
		headers: csrfHeaders(),
		method: 'DELETE',
	});

	if (!response.ok) {
		throw new Error(`Delete failed: ${response.status}`);
	}
}

async function uploadKeys(
	files: File[],
	productGroup: ProductGroup
): Promise<void> {
	const formData = new FormData();

	formData.append('productGroup', productGroup);

	for (const file of files) {
		formData.append('files[]', file);
	}

	const response = await fetch(BASE_URL, {
		body: formData,
		credentials: 'include',
		headers: csrfHeaders(),
		method: 'POST',
	});

	if (!response.ok) {
		let message = `Upload failed: ${response.status}`;

		try {
			const body = await response.json();

			if (
				body.type?.includes('DuplicateCommonLicenseKeyException') ||
				body.title?.includes('DuplicateCommonLicenseKey')
			) {
				message = 'The file has already been uploaded.';
			}
			else {
				message = body.title ?? body.detail ?? message;
			}
		}
		catch {
			// use default message
		}

		throw new Error(message);
	}
}

async function fetchKeys(
	productGroup: ProductGroup,
	page: number
): Promise<ApiPage> {
	const params = new URLSearchParams({
		page: String(page),
		pageSize: String(PAGE_SIZE),
		productGroup,
	});

	const response = await fetch(`${BASE_URL}?${params}`, {
		credentials: 'include',
		headers: csrfHeaders(),
	});

	if (!response.ok) {
		throw new Error(`Failed to load: ${response.status}`);
	}

	return response.json() as Promise<ApiPage>;
}

type TabPanelProps = {
	productGroup: ProductGroup;
};

function TabPanel({productGroup}: TabPanelProps) {
	const [searchParams, setSearchParams] = useSearchParams();

	const page = parseInt(searchParams.get('page') ?? '1', 10);

	const [data, setData] = useState<ApiPage | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

	const fileInputRef = useRef<HTMLInputElement>(null);

	const load = useCallback(
		async (targetPage: number) => {
			setLoading(true);
			setLoadError(null);

			try {
				const result = await fetchKeys(productGroup, targetPage);

				setData(result);
			}
			catch (err) {
				setLoadError(err instanceof Error ? err.message : 'Failed to load.');
			}
			finally {
				setLoading(false);
			}
		},
		[productGroup]
	);

	useEffect(() => {
		load(page);
	}, [load, page]);

	function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
		setSelectedFiles(Array.from(event.target.files ?? []));
		setUploadError(null);
	}

	async function handleUpload(event: FormEvent) {
		event.preventDefault();

		if (!selectedFiles.length) {
			return;
		}

		setUploading(true);
		setUploadError(null);

		try {
			await uploadKeys(selectedFiles, productGroup);

			setSelectedFiles([]);

			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}

			setSearchParams((prev) => {
				const next = new URLSearchParams(prev);

				next.set('page', '1');

				return next;
			});

			await load(1);
		}
		catch (err) {
			setUploadError(
				err instanceof Error ? err.message : 'Upload failed.'
			);
		}
		finally {
			setUploading(false);
		}
	}

	async function handleDelete(key: CommonLicenseKey) {
		if (
			!window.confirm(
				'Are you sure you want to delete this common license key?'
			)
		) {
			return;
		}

		try {
			await deleteKey(key.id);

			const newPage =
				data && data.items.length === 1 && page > 1 ? page - 1 : page;

			setSearchParams((prev) => {
				const next = new URLSearchParams(prev);

				next.set('page', String(newPage));

				return next;
			});

			await load(newPage);
		}
		catch (err) {
			setLoadError(
				err instanceof Error ? err.message : 'Delete failed.'
			);
		}
	}

	async function handleDownload(key: CommonLicenseKey) {
		try {
			await downloadKey(key.id, key.name);
		}
		catch (err) {
			setLoadError(
				err instanceof Error ? err.message : 'Download failed.'
			);
		}
	}

	function handlePageChange(newPage: number) {
		setSearchParams((prev) => {
			const next = new URLSearchParams(prev);

			next.set('page', String(newPage));

			return next;
		});
	}

	return (
		<div>
			<form className="mb-4" onSubmit={handleUpload}>
				<div className="d-flex align-items-center gap-2">
					<input
						accept=".xml"
						className="form-control form-control-sm"
						multiple
						onChange={handleFileChange}
						ref={fileInputRef}
						style={{maxWidth: '400px'}}
						type="file"
					/>

					<button
						className="btn btn-primary btn-sm"
						disabled={!selectedFiles.length || uploading}
						type="submit"
					>
						{uploading ? 'Uploading…' : 'Upload'}
					</button>
				</div>

				{uploadError && (
					<div className="alert alert-danger mt-2 py-2 small">
						{uploadError}
					</div>
				)}
			</form>

			{loadError && (
				<div className="alert alert-danger py-2 small">{loadError}</div>
			)}

			{loading && <p className="text-muted small">Loading…</p>}

			{!loading && data && (
				<>
					<table className="table table-sm table-striped">
						<thead>
							<tr>
								<th>Name</th>
								<th>Product Environment</th>
								<th>Start Date</th>
								<th>End Date</th>
								<th></th>
							</tr>
						</thead>

						<tbody>
							{data.items.length === 0 && (
								<tr>
									<td
										className="text-center text-muted"
										colSpan={5}
									>
										No records found.
									</td>
								</tr>
							)}

							{data.items.map((key) => (
								<tr key={key.id}>
									<td>{key.name}</td>

									<td>{key.productEnvironment}</td>

									<td>{formatDate(key.startDate)}</td>

									<td>{formatDate(key.endDate)}</td>

									<td className="text-end">
										<button
											className="btn btn-link btn-sm p-0 me-3"
											onClick={() => handleDownload(key)}
											type="button"
										>
											Download
										</button>

										<button
											className="btn btn-link btn-sm p-0 text-danger"
											onClick={() => handleDelete(key)}
											type="button"
										>
											Delete
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>

					{data.lastPage > 1 && (
						<nav>
							<ul className="pagination pagination-sm">
								<li
									className={`page-item${page <= 1 ? ' disabled' : ''}`}
								>
									<button
										className="page-link"
										disabled={page <= 1}
										onClick={() => handlePageChange(page - 1)}
										type="button"
									>
										&laquo;
									</button>
								</li>

								{Array.from(
									{length: data.lastPage},
									(_, i) => i + 1
								).map((p) => (
									<li
										className={`page-item${p === page ? ' active' : ''}`}
										key={p}
									>
										<button
											className="page-link"
											onClick={() => handlePageChange(p)}
											type="button"
										>
											{p}
										</button>
									</li>
								))}

								<li
									className={`page-item${page >= data.lastPage ? ' disabled' : ''}`}
								>
									<button
										className="page-link"
										disabled={page >= data.lastPage}
										onClick={() => handlePageChange(page + 1)}
										type="button"
									>
										&raquo;
									</button>
								</li>
							</ul>
						</nav>
					)}
				</>
			)}
		</div>
	);
}

export default function CommonLicenseKeys() {
	const [searchParams, setSearchParams] = useSearchParams();

	const tab = (searchParams.get('tab') ?? 'commerce') as
		| 'commerce'
		| 'elasticsearch';

	function handleTabChange(newTab: 'commerce' | 'elasticsearch') {
		setSearchParams((prev) => {
			const next = new URLSearchParams(prev);

			next.set('tab', newTab);
			next.delete('page');

			return next;
		});
	}

	const productGroup: ProductGroup =
		tab === 'elasticsearch' ? 'ENTERPRISE_SEARCH' : 'COMMERCE';

	return (
		<div>
			<h4 className="mb-3">Common License Keys</h4>

			<ul className="nav nav-tabs mb-4">
				<li className="nav-item">
					<button
						className={`nav-link${tab === 'commerce' ? ' active' : ''}`}
						onClick={() => handleTabChange('commerce')}
						type="button"
					>
						Commerce
					</button>
				</li>

				<li className="nav-item">
					<button
						className={`nav-link${tab === 'elasticsearch' ? ' active' : ''}`}
						onClick={() => handleTabChange('elasticsearch')}
						type="button"
					>
						Elasticsearch
					</button>
				</li>
			</ul>

			<TabPanel key={tab} productGroup={productGroup} />
		</div>
	);
}
