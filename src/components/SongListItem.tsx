import { Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { SongItem, DownloadState } from '../types';
import { styles } from '../styles/AppStyles';

interface SongListItemProps {
  item: SongItem;
  downloading: DownloadState;
  downloaded: boolean;
  isSelectionMode: boolean;
  isSelected: boolean;
  onPress: (item: SongItem) => void;
  onLongPress: (item: SongItem) => void;
}

export const SongListItem = ({
  item,
  downloading,
  downloaded,
  isSelectionMode,
  isSelected,
  onPress,
  onLongPress,
}: SongListItemProps) => {
  const isDownloading = downloading[item.folderId];

  return (
    <TouchableOpacity
      style={[
        styles.resultButton,
        isDownloading && styles.resultButtonDisabled,
        isSelectionMode && isSelected && styles.resultButtonSelected,
      ]}
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress(item)}
      disabled={isDownloading && !isSelectionMode}
    >
      <View style={styles.resultContent}>
        {isSelectionMode && (
          <View style={styles.selectionCheckbox}>
            {isSelected && <Text style={styles.selectionCheckmark}>✓</Text>}
          </View>
        )}
        <View style={styles.resultTextGroup}>
          <Text style={styles.resultText}>{item.title}</Text>
          <Text style={styles.resultSubtext}>{item.artist}</Text>
        </View>
        {isDownloading
          ? <ActivityIndicator size="small" color="#007AFF" style={styles.downloadIndicator} />
          : downloaded
            ? <Text style={styles.downloadedCheck}>✓</Text>
            : null}
      </View>
    </TouchableOpacity>
  );
};
