import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, AppState, Text, Pressable, Linking, Modal } from 'react-native';
import { useEffect, useRef, useState } from 'react';
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
import { styles } from './styles/AppStyles';
import GithubIcon from '../assets/github.svg';

// Deduplicate songs by folderId (keep first occurrence)
const rawSongs = songsData as SongItem[];
const songs = Array.from(new Map(rawSongs.map(item => [item.folderId, item])).values());

export default function App() {
  const [showHelpModal, setShowHelpModal] = useState(false);

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

  // App state tracking
  useEffect(() => {
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
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>AstroDX Convert Browser</Text>
          <View style={styles.headerRight}>
            <Pressable
              onPress={() => { console.log('github icon pressed'); Linking.openURL('https://github.com/trustytrojan/adx-convert-browser') }}
              style={styles.githubButton}
              hitSlop={12}
            >
              <GithubIcon width={24} height={24} fill="#9aa3b2" />
            </Pressable>
            <Pressable 
              onPress={() => setShowHelpModal(true)} 
              style={styles.helpButton}
              hitSlop={12}
            >
              <Text style={styles.helpIcon}>?</Text>
            </Pressable>
          </View>
        </View>
      </View>
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

      <Modal
        visible={showHelpModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowHelpModal(false)}
      >
        <Pressable style={styles.helpModalOverlay} onPress={() => setShowHelpModal(false)}>
          <View style={styles.helpModalContent}>
            <Text style={styles.helpModalTitle}>Help</Text>
            <Text style={styles.helpModalText}>
              This is a helper application for downloading and importing ADX files to AstroDX.{'\n'}
              Here's how to use the app:{'\n'}
              - Filter by song title/artist with the search bar.{'\n'}
              - Tap a song to start downloading it.{'\n'}
              - You can add multiple songs to the download list. Once all songs in the list complete, they will all be imported into AstroDX at the same time!{'\n'}
              - If a song has a <Text style={styles.downloadedCheck}>✓</Text>, it is already downloaded inside this app. Tap on it to immediately import to AstroDX.{'\n'}
              - You can press and hold on a song to enter multi-select mode, which lets you perform the above actions on multiple songs.
            </Text>
            <Pressable
              style={styles.helpModalCloseButton}
              onPress={() => setShowHelpModal(false)}
            >
              <Text style={styles.helpModalCloseButtonText}>Close</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <StatusBar style="inverted" />
    </View>
  );
}
