import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, AppState } from 'react-native';
import { useEffect, useRef } from 'react';
import songsData from '../songs.json';
import type { SongItem } from './types';
import { SearchBar } from './components/SearchBar';
import { DownloadJobsList } from './components/DownloadJobsList';
import { SongList } from './components/SongList';
import { SelectionToolbar } from './components/SelectionToolbar';
import { useSearch } from './hooks/useSearch';
import { useDownload } from './hooks/useDownload';
import { useSelection } from './hooks/useSelection';
import { resetIntentLock } from './utils/sharing';
import { setupNotifications } from './utils/notifications';
import { styles } from './styles/AppStyles';

// Deduplicate songs by folderId (keep first occurrence)
const rawSongs = songsData as SongItem[];
const songs = Array.from(new Map(rawSongs.map(item => [item.folderId, item])).values());

export default function App() {
  const {
    searchText,
    filteredSongs,
    loading,
    handleSearch,
    handleSubmitEditing,
  } = useSearch(songs);

  const {
    downloading,
    downloadJobs,
    downloadedMap,
    handleSongPress,
    handleBatchDownload,
    setDownloadedMap,
    handleAppBecameActive,
  } = useDownload();

  const {
    isSelectionMode,
    enterSelectionMode,
    exitSelectionMode,
    toggleSelection,
    isSelected,
    getSelectedCount,
    getSelectedIds,
  } = useSelection();

  // Setup notifications and app state tracking
  useEffect(() => {
    setupNotifications();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // Reset intent lock when app comes to foreground
        resetIntentLock();
        handleAppBecameActive();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleItemPress = (item: SongItem) => {
    if (isSelectionMode) {
      toggleSelection(item.folderId);
    } else {
      handleSongPress(item);
    }
  };

  const handleItemLongPress = (item: SongItem) => {
    if (!isSelectionMode) {
      enterSelectionMode(item.folderId);
    }
  };

  const handleDownloadSelected = () => {
    const selectedIds = getSelectedIds();
    const selectedSongs = songs.filter((song) => selectedIds.includes(song.folderId));
    exitSelectionMode();
    handleBatchDownload(selectedSongs);
  };

  return (
    <View style={styles.container}>
      <SearchBar
        value={searchText}
        onChangeText={handleSearch}
        onSubmitEditing={handleSubmitEditing}
      />

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}

      <DownloadJobsList downloadJobs={downloadJobs} />

      <SongList
        songs={filteredSongs}
        downloading={downloading}
        downloadedMap={downloadedMap}
        isSelectionMode={isSelectionMode}
        isSelected={isSelected}
        onSongPress={handleItemPress}
        onSongLongPress={handleItemLongPress}
        setDownloadedMap={setDownloadedMap}
        searchText={searchText}
        loading={loading}
      />

      {isSelectionMode && (
        <SelectionToolbar
          selectedCount={getSelectedCount()}
          onDownload={handleDownloadSelected}
          onCancel={exitSelectionMode}
        />
      )}

      <StatusBar style="auto" />
    </View>
  );
}
