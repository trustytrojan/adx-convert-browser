import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import type { SongItem, DownloadState, DownloadJobItem } from '../types';
import { getFileForSong } from '../utils/fileSystem';
import { openWithAstroDX, openMultipleWithAstroDX } from '../utils/sharing';
import { ExportJob, fetchFolderName } from '../services/gdrive';
import {
  showDownloadProgressNotification,
  updateDownloadProgressNotification,
  dismissDownloadProgressNotification,
} from '../utils/notifications';

export const useDownload = () => {
  const [downloading, setDownloading] = useState<DownloadState>({});
  const [downloadJobs, setDownloadJobs] = useState<DownloadJobItem[]>([]);
  const [downloadedMap, setDownloadedMap] = useState<Record<string, boolean>>({});
  const progressNotificationId = useRef<string | null>(null);
  const totalDownloadsRef = useRef<number>(0);
  const completedDownloadsRef = useRef<number>(0);

  // Update progress notification when download jobs change
  useEffect(() => {
    const updateProgressNotification = async () => {
      if (downloadJobs.length > 0) {
        const completed = completedDownloadsRef.current;
        const total = totalDownloadsRef.current;
        
        if (progressNotificationId.current) {
          const newId = await updateDownloadProgressNotification(
            progressNotificationId.current,
            completed,
            total
          );
          progressNotificationId.current = newId;
        } else {
          const newId = await showDownloadProgressNotification(completed, total);
          progressNotificationId.current = newId;
        }
      } else if (progressNotificationId.current) {
        // All downloads complete
        await dismissDownloadProgressNotification(progressNotificationId.current);
        progressNotificationId.current = null;
        totalDownloadsRef.current = 0;
        completedDownloadsRef.current = 0;
      }
    };

    updateProgressNotification();
  }, [downloadJobs.length]);

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
        completedDownloadsRef.current += 1;
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

  const handleBatchDownload = async (items: SongItem[]) => {
    // Separate already downloaded and to be downloaded
    const alreadyDownloaded: SongItem[] = [];
    const itemsToDownload: SongItem[] = [];

    items.forEach((item) => {
      const file = getFileForSong(item);
      if (file.exists) {
        alreadyDownloaded.push(item);
      } else {
        itemsToDownload.push(item);
      }
    });

    // If all items are already downloaded, send them via SEND_MULTIPLE
    if (alreadyDownloaded.length > 0 && itemsToDownload.length === 0) {
      const files = alreadyDownloaded.map(getFileForSong);
      await openMultipleWithAstroDX(files);
      return;
    }

    // If no items to download and none already downloaded (shouldn't happen)
    if (itemsToDownload.length === 0) {
      Alert.alert('Already Downloaded', 'All selected songs are already downloaded.');
      return;
    }

    // Send already downloaded files via SEND_MULTIPLE (don't await - let it run in background)
    if (alreadyDownloaded.length > 0) {
      const files = alreadyDownloaded.map(getFileForSong);
      openMultipleWithAstroDX(files).catch((error) => {
        console.error('Error sending files to AstroDX:', error);
      });
    }

    // Start downloads for items to be downloaded
    totalDownloadsRef.current = itemsToDownload.length;
    completedDownloadsRef.current = 0;
    itemsToDownload.forEach(handleSongPress);
  };

  return {
    downloading,
    downloadJobs,
    downloadedMap,
    handleSongPress,
    handleBatchDownload,
    setDownloadedMap,
  };
};
