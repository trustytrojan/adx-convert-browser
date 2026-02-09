import { Alert, Platform } from 'react-native';
import { File } from 'expo-file-system';
import { getContentUriAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';

export const openWithAstroDX = async (file: File, songTitle: string): Promise<void> => {
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
