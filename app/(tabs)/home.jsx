import { router } from 'expo-router';
import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { removeItem } from '../../lib/storage';

const Home = () => {

  const _handleRemoveStore = async () => {
    await removeItem('user');
  };
  return (
    <View>
      <Text>Home</Text>
      <Button mode='contained' onPress={_handleRemoveStore}>
        Click Me
      </Button>
      <Button mode='contained' onPress={() => router.replace('/login')}>
        Login
      </Button>
    </View>
  );
};

export default Home;
