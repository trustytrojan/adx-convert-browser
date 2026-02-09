// the behind-the-scenes request flow when you click "Download all" on a public google drive folder
// works with both nodejs and deno
// last edit: 6 Feb 2026. if this doesn't work, it needs to be patched

// this is a public key google gives to us, you can see it when examining network requests in the browser
const TAKEOUT_API_KEY = 'AIzaSyC1qbk75NzWBvSaDh6KnsjjA9pIrP4lYIE';

// this may need to be changed or turned into a list if new servers are discovered
const TAKEOUT_API_BASE = 'https://takeout-pa.clients6.google.com/v1';

// easy way to get the folder name from the <title> tag without hogging bandwidth
const DRIVE_EMBED_BASE = 'https://drive.google.com/embeddedfolderview';

// REQUIRED for the takeout api to accept our request
const DRIVE_REFERRER = 'https://drive.google.com/';

export interface ExportArchive {
	fileName: string;
	storagePath: string;
	compressedSize: string;
	sizeOfContents: string;
}

export interface TakeoutApiExportResponse {
	exportJob: ExportJob;
	percentDone?: number;
	numFetchedFiles?: number;
}

const decodeHtmlEntities = (value: string): string =>
	value
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");

export const fetchFolderName = async (folderId: string): Promise<string> => {
	const url = `${DRIVE_EMBED_BASE}?id=${encodeURIComponent(folderId)}`;
	const response = await fetch(url, {
		headers: {
			'Accept': 'text/html',
			'Referer': DRIVE_REFERRER,
		},
	});

	if (!response.ok)
		throw new Error(`Failed to fetch folder page: ${response.status} ${response.statusText}`);

	const html = await response.text();
	const match = html.match(/<title>([^<]+)<\/title>/i);
	if (!match || !match[1])
		throw new Error('Could not find <title> tag in embedded folder view');

	return decodeHtmlEntities(match[1].trim());
};

export type StatusCallback = (status: string, percentDone?: number) => void;

export class ExportJob {
	readonly id: string;
	readonly folderName: string;
	status: 'QUEUED' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED';
	percentDone?: number;
	numFetchedFiles?: number;
	archives?: ExportArchive[];

	private constructor(id: string, folderName: string, initialResponse: TakeoutApiExportResponse) {
		this.id = id;
		this.folderName = folderName;
		this.status = initialResponse.exportJob.status;
		this.percentDone = initialResponse.percentDone;
		this.numFetchedFiles = initialResponse.numFetchedFiles;
		this.archives = initialResponse.exportJob.archives;
	}

	static async create(folderId: string, folderName: string) {
		const url = `${TAKEOUT_API_BASE}/exports?key=${TAKEOUT_API_KEY}`;
		const body = {
			archivePrefix: folderName,
			items: [{ id: folderId }],
		};

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Referer': DRIVE_REFERRER,
			},
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			const errorBody = await response.text();
			throw new Error(`Failed to create export job: ${response.status} ${response.statusText}\n${errorBody}`);
		}

		const data: TakeoutApiExportResponse = await response.json();
		return new ExportJob(data.exportJob.id, folderName, data);
	}

	async poll() {
		const url = `${TAKEOUT_API_BASE}/exports/${this.id}?key=${TAKEOUT_API_KEY}`;

		const response = await fetch(url, {
			headers: {
				'Referer': DRIVE_REFERRER,
			},
		});

		if (!response.ok)
			throw new Error(`Failed to poll export job: ${response.status} ${response.statusText}`);

		const data: TakeoutApiExportResponse = await response.json();
		this.status = data.exportJob.status;
		this.percentDone = data.percentDone;
		this.numFetchedFiles = data.numFetchedFiles;
		this.archives = data.exportJob.archives;
	}

	waitForSuccess(statusCallback: StatusCallback, pollIntervalMs = 5_000) {
		return new Promise<void>((resolve, reject) => {
			const checkStatus = async () => {
				await this.poll();
				statusCallback(this.status, this.percentDone);

				if (this.status === 'SUCCEEDED') {
					clearInterval(interval);
					resolve();
				} else if (this.status === 'FAILED') {
					clearInterval(interval);
					reject(new Error('Export job failed'));
				}
			};

			const interval = setInterval(checkStatus, pollIntervalMs);
		});
	}
}
