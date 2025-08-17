import { postAPI } from '@/lib/apiService';
import { setItem } from '@/lib/storage';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';

const LoginScreen = () => {
  const {t} = useTranslation();
  const [phoneNumber, setPhoneNumber] = useState('0373644375');
  const [password, setPassword] = useState('');
  const [hidePassword, setHidePassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const stored = async (response: any) => {
    // Save tokens and user information into async storage
    const setUser = setItem('user', JSON.stringify(response.result.user));
    const setAccessToken = setItem('access_token', response.result.accessToken);
    const setRefreshToken = setItem('refresh_token', response.result.refreshToken);

    await setUser;
    await setAccessToken;
    await setRefreshToken;
    // Navigate to home screen
    router.replace('/home');
  };

  const _handleLogin = async () => {
    await postAPI('/auth/login', {phone: phoneNumber, password: password}, stored, setIsLoading, setError);
  };

  const _navigateToRegister = () => {
    router.push('/register');
  };
  return (
    <View style={styles.container}>
      <Text variant='headlineMedium' style={styles.title}>
        {t('Đăng nhập')}
      </Text>
      <View className='py-1'>{error ? <Text style={{color: 'red'}}>{t(error.message)}</Text> : null}</View>
      <TextInput label={t('Số điện thoại')} value={phoneNumber} onChangeText={setPhoneNumber} style={styles.input} />
      <TextInput
        label={t('Mật khẩu')}
        secureTextEntry={hidePassword}
        right={
          <TextInput.Icon icon={`${hidePassword ? 'eye-off' : 'eye'}`} onPress={() => setHidePassword(!hidePassword)} />
        }
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />
      <Button mode='contained' loading={isLoading} onPress={_handleLogin} style={styles.button}>
        {t('Đăng nhập')}
      </Button>
      <Button mode='outlined' onPress={_navigateToRegister} style={styles.button}>
        {t('Tạo tài khoản')}
      </Button>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },

  title: {
    textAlign: 'center',
    marginBottom: 16,
  },

  input: {
    marginBottom: 12,
  },

  button: {
    marginTop: 12,
  },
});
