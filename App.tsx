import { StatusBar } from 'expo-status-bar';
import { Text, View, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { File, Directory, Paths } from 'expo-file-system';
import { getContentUriAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import songsData from './songs.json';
import { ExportJob, fetchFolderName } from './gdrive-folder-download';
import { styles } from './AppStyles';

interface SongItem {
  folderId: string;
  songId?: string;
  title: string;
  artist?: string;
  romanizedTitle?: string;
  romanizedArtist?: string;
}

interface DownloadState {
  [key: string]: boolean;
}

interface DownloadJobItem {
  folderId: string;
  title: string;
  artist?: string;
  status: 'QUEUED' | 'IN_PROGRESS';
  percentDone?: number;
}

export default function App() {
  const [searchText, setSearchText] = useState('');
  const songs = songsData as SongItem[];
  const [filteredSongs, setFilteredSongs] = useState<SongItem[]>(songs);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<DownloadState>({});
  const [downloadJobs, setDownloadJobs] = useState<DownloadJobItem[]>([]);
  const [downloadedMap, setDownloadedMap] = useState<Record<string, boolean>>({});
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const getFileForSong = (item: SongItem) => {
    const sanitizedTitle = item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${sanitizedTitle}.adx`;
    const downloadsDir = new Directory(Paths.document, 'adx-downloads');
    downloadsDir.create({ intermediates: true, idempotent: true });
    return new File(downloadsDir, fileName);
  };
  const viewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ item: SongItem }> }) => {
    setDownloadedMap((prev) => {
      let next = prev;
      viewableItems.forEach(({ item }) => {
        if (prev[item.folderId] !== undefined) return;
        const file = getFileForSong(item);
        if (file.exists) {
          if (next === prev) next = { ...prev };
          next[item.folderId] = true;
        }
      });
      return next;
    });
  });
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const performSearch = (query: string) => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      setFilteredSongs(songs);
      return;
    }

    setLoading(true);
    const terms = trimmed.split(/\s+/).filter(Boolean);
    const filtered = songs.filter((song) => {
      const haystack = [
        song.title,
        song.artist,
        song.romanizedTitle,
        song.romanizedArtist,
        song.songId,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return terms.every((term) => haystack.includes(term));
    });

    setFilteredSongs(filtered);
    setLoading(false);
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    
    // Clear existing timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Set new timeout for 500ms
    searchTimeout.current = setTimeout(() => {
      performSearch(text);
    }, 500);
  };

  const handleSubmitEditing = () => {
    // Clear timeout and search immediately
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    performSearch(searchText);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  const openWithAstroDX = async (file: File, songTitle: string) => {
    if (Platform.OS === 'android') {
      try {
        const contentUri = await getContentUriAsync(file.uri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          flags: 1,
          packageName: 'com.Reflektone.AstroDX',
        });
      } catch (error) {
        console.error('Intent error:', error);
        Alert.alert(
          'Cannot Open File',
          'AstroDX app not found. Would you like to share instead?',
          [
            {
              text: 'Share',
              onPress: async () => {
                if (await Sharing.isAvailableAsync()) {
                  await Sharing.shareAsync(file.uri);
                }
              }
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      }
    } else {
      Alert.alert(
        'Download Complete',
        `${songTitle} ready to share!`,
        [
          {
            text: 'Share',
            onPress: async () => {
              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(file.uri);
              }
            }
          },
          { text: 'OK', style: 'cancel' }
        ]
      );
    }
  };

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

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search for songs..."
          value={searchText}
          onChangeText={handleSearch}
          onSubmitEditing={handleSubmitEditing}
          returnKeyType="search"
        />
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}

      {downloadJobs.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Current Downloads</Text>
          <View style={styles.downloadsContainer}>
            <FlatList
              style={styles.downloadsList}
              data={downloadJobs}
              keyExtractor={(item, index) => `${item.folderId}-${index}`}
              renderItem={({ item }) => (
                <View style={styles.resultButton}>
                  <View style={styles.resultContent}>
                    <View style={styles.resultTextGroup}>
                      <Text style={styles.resultText}>{item.title}</Text>
                      {!!item.artist && <Text style={styles.resultSubtext}>{item.artist}</Text>}
                    </View>
                    <ActivityIndicator size="small" color="#007AFF" style={styles.downloadIndicator} />
                  </View>
                </View>
              )}
            />
          </View>
        </>
      )}

      <Text style={styles.sectionLabel}>Song List</Text>
      <FlatList
        style={styles.songsList}
        data={filteredSongs}
        keyExtractor={(item, index) => `${item.folderId}-${index}`}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.resultButton,
              downloading[item.folderId] && styles.resultButtonDisabled
            ]}
            onPress={() => handleSongPress(item)}
            disabled={downloading[item.folderId]}
          >
            <View style={styles.resultContent}>
              <View style={styles.resultTextGroup}>
                <Text style={styles.resultText}>{item.title}</Text>
                {!!item.artist && <Text style={styles.resultSubtext}>{item.artist}</Text>}
              </View>
              {downloading[item.folderId] ? (
                <ActivityIndicator size="small" color="#007AFF" style={styles.downloadIndicator} />
              ) : downloadedMap[item.folderId] ? (
                <Text style={styles.downloadedCheck}>✓</Text>
              ) : null}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading && searchText ? (
            <Text style={styles.emptyText}>No songs found</Text>
          ) : null
        }
        onViewableItemsChanged={viewableItemsChanged.current}
        viewabilityConfig={viewabilityConfig}
      />

      <StatusBar style="auto" />
    </View>
  );
}
