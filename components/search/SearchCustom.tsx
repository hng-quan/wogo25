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
    if (onSearch) onSearch(query); // callback cho parent
  };

  return (
    <Searchbar
      onPress={onPress}
      placeholder={placeholder}
      onChangeText={handleChange}
      editable={editable}
      value={searchQuery}
      icon="magnify"          // có thể đổi icon
      clearIcon="close"       // icon xoá
      style={[
        {
          borderRadius: 12,
          backgroundColor: '#FFFFFF',
          elevation: 0, // bỏ shadow
        },
        style,
      ]}
      inputStyle={{ fontSize: 16 }}
      {...props}
    />
  );
}

type SearchCustomProps = {
  placeholder?: string;
  onSearch?: (query: string) => void;
  style?: object;
  [key: string]: any;
  className?: string;
  editable?: boolean;
  onPress?: () => void;
};
