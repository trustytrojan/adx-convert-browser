import { useState } from 'react';
import { Alert } from 'react-native';
import type { SongItem, DownloadState, DownloadJobItem } from '../types';
import { getFileForSong } from '../utils/fileSystem';
import { openWithAstroDX } from '../utils/sharing';
import { ExportJob, fetchFolderName } from '../services/gdrive';

export const useDownload = () => {
  const [downloading, setDownloading] = useState<DownloadState>({});
  const [downloadJobs, setDownloadJobs] = useState<DownloadJobItem[]>([]);
  const [downloadedMap, setDownloadedMap] = useState<Record<string, boolean>>({});

  const handleSongPress = async (item: SongItem) => {
    setDownloading((prev) => ({ ...prev, [item.folderId]: true }));

    try {
      const file = getFileForSong(item);
      if (file.exists) {
        setDownloadedMap((prev) => ({ ...prev, [item.folderId]: true }));
        await openWithAstroDX(file, item.title);
        return;
      }

      setDownloadJobs((prev) => {
        const exists = prev.some((job) => job.folderId === item.folderId);
        if (exists) return prev;
        return [
          ...prev,
          {
            folderId: item.folderId,
            title: item.title,
            artist: item.artist,
            status: 'QUEUED',
          },
        ];
      });

      const folderName = await fetchFolderName(item.folderId);
      const job = await ExportJob.create(item.folderId, folderName);
      await job.waitForSuccess((status, percentDone) => {
        setDownloadJobs((prev) =>
          prev.map((entry) =>
            entry.folderId === item.folderId
              ? {
                  ...entry,
                  status: status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'QUEUED',
                  percentDone,
                }
              : entry
          )
        );
      });

      if (!job.archives || job.archives.length === 0) {
        throw new Error('No archives generated');
      }

      const downloadUrl = job.archives[0].storagePath;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);

      try {
        const response = await fetch(downloadUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        file.write(new Uint8Array(arrayBuffer));
        setDownloadedMap((prev) => ({ ...prev, [item.folderId]: true }));
        await openWithAstroDX(file, item.title);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      } finally {
        setDownloadJobs((prev) => prev.filter((entry) => entry.folderId !== item.folderId));
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error 
        ? (error.name === 'AbortError' ? 'Download timed out (90s limit)' : error.message)
        : 'An unknown error occurred';
      Alert.alert('Error', errorMessage);
    } finally {
      setDownloading((prev) => {
        const newState = { ...prev };
        delete newState[item.folderId];
        return newState;
      });
    }
  };

  return {
    downloading,
    downloadJobs,
    downloadedMap,
    handleSongPress,
    setDownloadedMap,
  };
};
