import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles/AppStyles';

interface SelectionToolbarProps {
  selectedCount: number;
  onDownload: () => void;
  onCancel: () => void;
}

export const SelectionToolbar = ({ selectedCount, onDownload, onCancel }: SelectionToolbarProps) => {
  return (
    <View style={styles.selectionToolbar}>
      <Text style={styles.selectionToolbarText}>
        {selectedCount} selected
      </Text>
      <View style={styles.selectionToolbarButtons}>
        <TouchableOpacity
          style={[styles.toolbarButton, styles.toolbarButtonSecondary]}
          onPress={onCancel}
        >
          <Text style={styles.toolbarButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={onDownload}
          disabled={selectedCount === 0}
        >
          <Text style={styles.toolbarButtonText}>
            Download/Open {selectedCount > 0 ? `(${selectedCount})` : ''}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
