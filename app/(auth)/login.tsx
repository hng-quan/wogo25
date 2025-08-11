import { setItem } from '@/lib/storage';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { postAPI } from '../../lib/apiService';

const LoginScreen = () => {
  const { t } = useTranslation();
  const [phoneNumber, setPhoneNumber] = useState('0373644375');
  const [password, setPassword] = useState('');
  const [hidePassword, setHidePassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const stored = async (response: any) => {
    // Save tokens and user information into async storage
    await setItem('user', JSON.stringify(response.result.user));
    await setItem('access_token', response.result.accessToken);
    await setItem('refresh_token', response.result.refreshToken);
    // Navigate to home screen
    router.replace('/home');
  };

  const _handleLogin = async () => {
    // call login API
    await postAPI('/auth/login', {phone: phoneNumber, password: password}, stored, setIsLoading, setError);
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
    marginTop: 0,
  },
});
