import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Searchbar } from 'react-native-paper';

export default function SearchCustom({
  placeholder = 'Tìm kiếm...',
  onSearch,
  style,
  className,
  editable = true,
  onPress,
  ...props
}: SearchCustomProps) {
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleChange = (query: string) => {
    setSearchQuery(query);
    if (onSearch) onSearch(query);
  };

  return (
    <Searchbar
      onPress={onPress}
      placeholder={placeholder}
      onChangeText={handleChange}
      editable={editable}
      value={searchQuery}
      icon={(props) => (
        <MaterialCommunityIcons name="magnify" size={22} color={props.color || '#555'} />
      )}
      clearIcon={(props) => (
        <MaterialCommunityIcons name="close" size={22} color={props.color || '#555'} />
      )}
      style={[
        {
          borderRadius: 100,
          backgroundColor: '#fff',
          borderWidth: 1,
          borderColor: '#4FAF50',
          elevation: 0,
        },
        style,
      ]}
      inputStyle={{
        fontSize: 15,
        color: '#333',
        paddingVertical: 6,
      }}
      {...props}
    />
  );
}

type SearchCustomProps = {
  placeholder?: string;
  onSearch?: (query: string) => void;
  style?: object;
  className?: string;
  editable?: boolean;
  onPress?: () => void;
  [key: string]: any;
};
