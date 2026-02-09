import { File, Directory, Paths } from 'expo-file-system';
import type { SongItem } from '../types';

export const getFileForSong = (item: SongItem): File => {
  const sanitizedTitle = item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const fileName = `${sanitizedTitle}.adx`;
  const downloadsDir = new Directory(Paths.document, 'adx-downloads');
  downloadsDir.create({ intermediates: true, idempotent: true });
  return new File(downloadsDir, fileName);
};
