export interface SongItem {
  folderId: string;
  songId: string;
  title: string;
  artist: string;
  romanizedTitle?: string;
  romanizedArtist?: string;
  communityNames?: string[];
}

export interface DownloadState {
  [key: string]: boolean;
}

export interface DownloadJobItem {
  folderId: string;
  title: string;
  artist?: string;
  status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED';
  percentDone?: number;
}

export interface SelectionState {
  isSelectionMode: boolean;
  selectedIds: Set<string>;
}
