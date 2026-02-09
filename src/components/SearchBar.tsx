import { View, TextInput } from 'react-native';
import { styles } from '../styles/AppStyles';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmitEditing: () => void;
}

export const SearchBar = ({ value, onChangeText, onSubmitEditing }: SearchBarProps) => {
  return (
    <View style={styles.searchContainer}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search for songs..."
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        returnKeyType="search"
      />
    </View>
  );
};
