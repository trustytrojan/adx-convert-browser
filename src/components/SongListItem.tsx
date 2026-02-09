import { Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { SongItem, DownloadState } from '../types';
import { styles } from '../styles/AppStyles';

interface SongListItemProps {
  item: SongItem;
  downloading: DownloadState;
  downloaded: boolean;
  onPress: (item: SongItem) => void;
}

export const SongListItem = ({ item, downloading, downloaded, onPress }: SongListItemProps) => {
  const isDownloading = downloading[item.folderId];

  return (
    <TouchableOpacity
      style={[
        styles.resultButton,
        isDownloading && styles.resultButtonDisabled
      ]}
      onPress={() => onPress(item)}
      disabled={isDownloading}
    >
      <View style={styles.resultContent}>
        <View style={styles.resultTextGroup}>
          <Text style={styles.resultText}>{item.title}</Text>
          {!!item.artist && <Text style={styles.resultSubtext}>{item.artist}</Text>}
        </View>
        {isDownloading ? (
          <ActivityIndicator size="small" color="#007AFF" style={styles.downloadIndicator} />
        ) : downloaded ? (
          <Text style={styles.downloadedCheck}>✓</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};
