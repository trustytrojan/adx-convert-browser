import { Text, View, FlatList, ActivityIndicator } from 'react-native';
import type { DownloadJobItem } from '../types';
import { styles } from '../styles/AppStyles';

interface DownloadJobsListProps {
  downloadJobs: DownloadJobItem[];
}

export const DownloadJobsList = ({ downloadJobs }: DownloadJobsListProps) => {
  if (downloadJobs.length === 0) {
    return null;
  }

  return (
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
  );
};
