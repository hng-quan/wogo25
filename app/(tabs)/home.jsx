import { router } from 'expo-router';
import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { getItem, removeItem } from '../../lib/storage';

const Home = () => {

  const _handleRemoveStore = async () => {
    await removeItem('user');
  };

  const _handleShowStorage = async () => {
    const user = await getItem('user');
    console.log('user:', user);
    const accessToken = await getItem('access_token');
    console.log('access_token:', accessToken);
    const refreshToken = await getItem('refresh_token');
    console.log('refresh_token:', refreshToken);
  };
  return (
    <View>
      <Text>Home</Text>
      <Button mode='contained' onPress={_handleRemoveStore}>
        <Text>Remove</Text>
      </Button>
      <Button mode='contained' onPress={() => router.replace('/login')}>
        <Text>Login</Text>
      </Button>
      <Button mode='contained' onPress={_handleShowStorage}>
        <Text>Show storage</Text>
      </Button>
    </View>
  );
};

export default Home;
