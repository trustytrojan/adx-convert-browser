export interface SongItem {
  folderId: string;
  songId?: string;
  title: string;
  artist?: string;
  romanizedTitle?: string;
  romanizedArtist?: string;
}

export interface DownloadState {
  [key: string]: boolean;
}

export interface DownloadJobItem {
  folderId: string;
  title: string;
  artist?: string;
  status: 'QUEUED' | 'IN_PROGRESS';
  percentDone?: number;
}
