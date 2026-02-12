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
  const batchCompletedFilesRef = useRef<Array<{ file: any; title: string }>>([]);
  const shouldClearOnNextActiveRef = useRef<boolean>(false);

  // Update progress notification when download jobs change
  useEffect(() => {
    const updateProgressNotification = async () => {
      const activeJobs = downloadJobs.filter((job) => job.status !== 'COMPLETED');
      if (activeJobs.length > 0) {
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
  }, [downloadJobs]);

  const handleSongPress = async (item: SongItem) => {
    const file = getFileForSong(item);
    
    // If file already exists, accumulate it for batch opening
    if (file.exists) {
      setDownloadedMap((prev) => ({ ...prev, [item.folderId]: true }));
      batchCompletedFilesRef.current.push({ file, title: item.title });
      
      // Check if other downloads are active
      setDownloading((prev) => {
        const hasOtherDownloads = Object.values(prev).some(d => d);
        if (!hasOtherDownloads) {
          // No other downloads, open accumulated files
          const files = batchCompletedFilesRef.current.map(f => f.file);
          if (files.length === 1) {
            openWithAstroDX(files[0], batchCompletedFilesRef.current[0].title).catch(console.error);
          } else if (files.length > 1) {
            openMultipleWithAstroDX(files).catch(console.error);
          }
          batchCompletedFilesRef.current = [];
        }
        return prev;
      });
      return;
    }

    setDownloading((prev) => ({ ...prev, [item.folderId]: true }));

    try {
      // Initialize batch refs if this is the first download
      if (totalDownloadsRef.current === 0) {
        totalDownloadsRef.current = 1;
        completedDownloadsRef.current = 0;
      } else {
        totalDownloadsRef.current += 1;
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
      
      // Don't await - let download progress in background and complete asynchronously
      job.waitForSuccess((status, percentDone) => {
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
      })
        .then(() => {
          // Job succeeded, now download the file
          if (!job.archives || job.archives.length === 0) {
            throw new Error('No archives generated');
          }

          const downloadUrl = job.archives[0].storagePath;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 90000);

          return fetch(downloadUrl, { signal: controller.signal })
            .then(async (response) => {
              clearTimeout(timeoutId);

              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }

              const arrayBuffer = await response.arrayBuffer();
              file.write(new Uint8Array(arrayBuffer));
              setDownloadedMap((prev) => ({ ...prev, [item.folderId]: true }));

              // Accumulate file for batch opening
              batchCompletedFilesRef.current.push({ file, title: item.title });
            })
            .catch((fetchError) => {
              clearTimeout(timeoutId);
              throw fetchError;
            });
        })
        .then(() => {
          // Download complete, check if other downloads are still active
          completedDownloadsRef.current += 1;
          setDownloadJobs((prev) =>
            prev.map((entry) =>
              entry.folderId === item.folderId
                ? { ...entry, status: 'COMPLETED', percentDone: 100 }
                : entry
            )
          );

          setDownloading((prev) => {
            const { [item.folderId]: _, ...remaining } = prev;
            const hasOtherDownloads = Object.values(remaining).some(d => d);

            if (!hasOtherDownloads) {
              // All downloads complete - open all accumulated files
              const files = batchCompletedFilesRef.current.map(f => f.file);
              if (files.length === 1) {
                openWithAstroDX(files[0], batchCompletedFilesRef.current[0].title).catch(console.error);
              } else if (files.length > 1) {
                openMultipleWithAstroDX(files).catch(console.error);
              }
              batchCompletedFilesRef.current = [];
              totalDownloadsRef.current = 0;
              completedDownloadsRef.current = 0;
              if (files.length > 0) {
                shouldClearOnNextActiveRef.current = true;
              }
            }

            return remaining;
          });
        })
        .catch((error) => {
          console.error('Error:', error);
          completedDownloadsRef.current += 1;
          const errorMessage = error instanceof Error 
            ? (error.name === 'AbortError' ? 'Download timed out (90s limit)' : error.message)
            : 'An unknown error occurred';
          Alert.alert('Error', errorMessage);

          setDownloadJobs((prev) => prev.filter((entry) => entry.folderId !== item.folderId));
          setDownloading((prev) => {
            const { [item.folderId]: _, ...remaining } = prev;
            return remaining;
          });
        });
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error 
        ? (error.name === 'AbortError' ? 'Download timed out (90s limit)' : error.message)
        : 'An unknown error occurred';
      Alert.alert('Error', errorMessage);

      setDownloading((prev) => {
        const { [item.folderId]: _, ...remaining } = prev;
        return remaining;
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
    batchCompletedFilesRef.current = [];
    itemsToDownload.forEach(handleSongPress);
  };

  const handleAppBecameActive = () => {
    if (!shouldClearOnNextActiveRef.current) return;
    const hasActiveJobs = downloadJobs.some((job) => job.status !== 'COMPLETED');
    if (hasActiveJobs) return;

    setDownloadJobs([]);
    shouldClearOnNextActiveRef.current = false;
    totalDownloadsRef.current = 0;
    completedDownloadsRef.current = 0;
  };

  return {
    downloading,
    downloadJobs,
    downloadedMap,
    handleSongPress,
    handleBatchDownload,
    setDownloadedMap,
    handleAppBecameActive,
  };
};
