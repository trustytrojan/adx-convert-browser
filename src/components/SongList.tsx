import { Text, FlatList } from 'react-native';
import { useRef } from 'react';
import type { SongItem, DownloadState } from '../types';
import { SongListItem } from './SongListItem';
import { getFileForSong } from '../utils/fileSystem';
import { styles } from '../styles/AppStyles';

interface SongListProps {
  songs: SongItem[];
  downloading: DownloadState;
  downloadedMap: Record<string, boolean>;
  onSongPress: (item: SongItem) => void;
  setDownloadedMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  searchText: string;
  loading: boolean;
}

export const SongList = ({
  songs,
  downloading,
  downloadedMap,
  onSongPress,
  setDownloadedMap,
  searchText,
  loading,
}: SongListProps) => {
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

  return (
    <>
      <Text style={styles.sectionLabel}>Song List</Text>
      <FlatList
        style={styles.songsList}
        data={songs}
        keyExtractor={(item, index) => `${item.folderId}-${index}`}
        renderItem={({ item }) => (
          <SongListItem
            item={item}
            downloading={downloading}
            downloaded={downloadedMap[item.folderId] || false}
            onPress={onSongPress}
          />
        )}
        ListEmptyComponent={
          !loading && searchText ? (
            <Text style={styles.emptyText}>No songs found</Text>
          ) : null
        }
        onViewableItemsChanged={viewableItemsChanged.current}
        viewabilityConfig={viewabilityConfig}
      />
    </>
  );
};
