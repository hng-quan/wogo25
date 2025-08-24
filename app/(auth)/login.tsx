import { useRole } from '@/context/RoleContext';
import { jsonPostAPI } from '@/lib/apiService';
import { setItem } from '@/lib/storage';
import { validatePhoneNumber } from '@/lib/utils';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';

const LoginScreen = () => {
  const {t} = useTranslation();
  const [phoneNumber, setPhoneNumber] = useState('0373644375');
  const [password, setPassword] = useState('');
  const [hidePassword, setHidePassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const {setUser} = useRole();

  const stored = async (response: any) => {
    const saveUser = setItem('user', response.result.user);
    const setAccessToken = setItem('access_token', response.result.accessToken);
    const setRefreshToken = setItem('refresh_token', response.result.refreshToken);

    await saveUser;
    await setAccessToken;
    await setRefreshToken;
    setUser(response.result.user);
    router.replace('/(tabs-customer)');
  };

  const _handleLogin = async () => {
    await jsonPostAPI('/auth/login', {phone: phoneNumber, password: password}, stored, setIsLoading, setError);
  };

  const _navigateToRegister = () => {
    router.push('/register');
  };
  return (
    <View style={styles.container}>
      <Text variant='headlineMedium' style={styles.title}>
        {t('Đăng nhập')}
      </Text>
      <HelperText type="error" visible={error !== null}>
        {error ? t(error.message) : null}
      </HelperText>
      <TextInput
        label={t('Số điện thoại')}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        style={styles.input}
        theme={inputTheme}
      />
      <HelperText type="error" visible={!validatePhoneNumber(phoneNumber)}>
        Số điện thoại không hợp lệ!
      </HelperText>
      <TextInput
        label={t('Mật khẩu')}
        secureTextEntry={hidePassword}
        right={
          <TextInput.Icon
            icon={`${hidePassword ? 'eye-off' : 'eye'}`}
            onPress={() => setHidePassword(!hidePassword)}
            color={styles.icon.color}
          />
        }
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        theme={inputTheme}
      />
      <Button
        mode='contained'
        loading={isLoading}
        onPress={_handleLogin}
        style={styles.button}
        buttonColor={styles.buttonColor.backgroundColor}
        textColor={'#FFFFFF'}>
        <Text>{t('Đăng nhập')}</Text>
      </Button>
      <Button
        mode='outlined'
        onPress={_navigateToRegister}
        style={styles.outlinedButton}
        textColor={styles.outlinedButtonText.color}
        rippleColor={rippleColor.rippleColor}>
        <Text>{t('Tạo tài khoản')}</Text>
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
    backgroundColor: '#E8F5E9',
  },
  title: {
    textAlign: 'center',
    color: '#2E7D32',
  },
  input: {
    backgroundColor: '#FFFFFF',
  },

  icon: {
    color: '#4CAF50',
  },
  button: {
    marginTop: 12,
    borderRadius: 8,
  },
  buttonColor: {
    backgroundColor: '#4CAF50',
  },
  outlinedButton: {
    marginTop: 12,
    borderColor: '#4CAF50',
    borderRadius: 8,
  },
  outlinedButtonText: {
    color: '#2E7D32',
  },

  errorText: {
    color: '#D32F2F',
  },
});

const inputTheme = {
  colors: {
    primary: '#4CAF50',
    onSurfaceVariant: '#1B5E20',
  },
};
const rippleColor = {
  rippleColor: '#A5D6A7',
};
