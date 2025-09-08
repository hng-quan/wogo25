import ButtonCustom from '@/components/button/ButtonCustom';
import HelpText from '@/components/text/HelpText';
import { useRole } from '@/context/RoleContext';
import { jsonPostAPI } from '@/lib/apiService';
import { setItem } from '@/lib/storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Text, TextInput } from 'react-native-paper';

const LoginScreen = () => {
  const {t} = useTranslation();
  const [phoneNumber, setPhoneNumber] = useState('');
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
    // <View style={styles.container}>
    <LinearGradient colors={['#E8F5E9', '#C8E6C9']} style={styles.container}>
      <Text variant='headlineSmall' style={styles.title}>
        {t('Đăng nhập')}
      </Text>

      <HelpText type='error' visible={error !== null} style={styles.errorText}>
        {error ? t(error.message) : null}
      </HelpText>
      <TextInput
        label={t('Số điện thoại')}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        style={styles.input}
        theme={inputTheme}
      />
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
        style={[styles.input, {marginTop: 15}]}
        theme={inputTheme}
      />

      <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>

      <ButtonCustom mode='contained' loading={isLoading} onPress={_handleLogin} style={{marginTop: 15}}>
        {t('Đăng nhập')}
      </ButtonCustom>
      <ButtonCustom mode='outlined' onPress={_navigateToRegister} style={{marginTop: 15}}>
        {t('Tạo tài khoản')}
      </ButtonCustom>

      <View style={{alignItems: 'center'}}>
        <Text style={styles.termsText}>
          <Text style={styles.boldText}>Điều khoản dịch vụ</Text>
          {''} &amp; {''}
          <Text style={styles.boldText}>Chính sách bảo mật</Text>
        </Text>
      </View>
      {/* </View> */}
    </LinearGradient>
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
    fontWeight: 'bold',
  },

  input: {
    backgroundColor: '#FFFFFF',
  },

  icon: {
    color: '#4CAF50',
  },

  errorText: {
    color: 'red',
  },

  forgotPasswordText: {
    textAlign: 'right',
    color: 'green',
    paddingVertical: 12,
  },

  termsText: {
    fontSize: 12,
    marginTop: 24,
  },

  boldText: {
    color: '#4CAF50',
    textDecorationLine: 'underline',
  },
});

const inputTheme = {
  colors: {
    primary: '#4CAF50',
  },
};
