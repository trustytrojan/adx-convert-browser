import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import songsData from '../songs.json';
import type { SongItem } from './types';
import { SearchBar } from './components/SearchBar';
import { DownloadJobsList } from './components/DownloadJobsList';
import { SongList } from './components/SongList';
import { useSearch } from './hooks/useSearch';
import { useDownload } from './hooks/useDownload';
import { styles } from './styles/AppStyles';

export default function App() {
  const songs = songsData as SongItem[];
  
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
    setDownloadedMap,
  } = useDownload();

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
        onSongPress={handleSongPress}
        setDownloadedMap={setDownloadedMap}
        searchText={searchText}
        loading={loading}
      />

      <StatusBar style="auto" />
    </View>
  );
}
