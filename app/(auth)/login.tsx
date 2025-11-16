import ButtonCustom from '@/components/button/ButtonCustom';
import HelpText from '@/components/text/HelpText';
import { useRole } from '@/context/RoleContext';
import { jsonPostAPI } from '@/lib/apiService';
import { setItem } from '@/lib/storage';
import { validatePhoneNumber } from '@/lib/utils';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text, TextInput } from 'react-native-paper';

const LoginScreen = () => {
  const {t} = useTranslation();
  const [phoneNumber, setPhoneNumber] = useState(null as string | null);
  const [password, setPassword] = useState(null as string | null);
  const [hidePassword, setHidePassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const {setUser} = useRole();

  useEffect(() => {
    if (phoneNumber !== null) {
      setError((prev: any) => ({...prev, phoneError: validatePhoneNumber(phoneNumber)}));
    }
  }, [phoneNumber]);

  useEffect(() => {
    if (password !== null && password.length === 0) {
      setError((prev: any) => ({...prev, passwordError: 'Vui lòng nhập mật khẩu'}));
    } else if (password !== null && password.length > 0) {
      setError((prev: any) => ({...prev, passwordError: ''}));
    }
  }, [password]);

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

  const hasErrors = () => {
    let hasError = false;
    if (phoneNumber === null) {
      hasError = true
      setError((prev: any) => ({
        ...prev,
        phoneError: 'Vui lòng nhập số điện thoại',
      }));
    }
    if (password === null) {
      hasError = true;
      setError((prev: any) => ({
        ...prev,
        passwordError: 'Vui lòng nhập mật khẩu',
      }));
    }
    if (error?.phoneError || error?.passwordError) {
      hasError = true;
    }
    return hasError;
  };

  const _handleLogin = async () => {
    if (hasErrors()) return;
    await jsonPostAPI('/auth/login', {phone: phoneNumber, password: password}, stored, setIsLoading, setError);
  };

  const _navigateToRegister = () => {
    router.push('/register');
  };
  return (
    <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient colors={['#E8F5E9', '#C8E6C9']} style={styles.container}>
      <Text variant='headlineSmall' style={styles.title}>
        {t('Đăng nhập')}
      </Text>

      <HelpText type='error' visible={error !== null}>
        {error ? t(error.message) : null}
      </HelpText>
      <TextInput
        keyboardType='phone-pad'
        label={t('Số điện thoại')}
        value={phoneNumber ?? ''}
        onChangeText={(text) => {
          setPhoneNumber(text);
        }}
        style={styles.input}
        theme={inputTheme}
      />
      <HelpText type='error' visible={error !== null}>
        {t(error?.phoneError)}
      </HelpText>
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
        value={password ?? ''}
        onChangeText={text => {
          setPassword(text);
        }}
        style={styles.input}
        theme={inputTheme}
      />
      {error?.passwordError && (
        <HelpText type='error' visible={error !== null}>
          {t(error?.passwordError)}
        </HelpText>
      )}
      <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
        <Text style={styles.forgotPasswordText}>{t('Quên mật khẩu?')}</Text>
      </Pressable>

      <ButtonCustom mode='contained' loading={isLoading} onPress={_handleLogin} style={{marginTop: 15}}>
        {t('Đăng nhập')}
      </ButtonCustom>
      <ButtonCustom mode='outlined' onPress={_navigateToRegister} style={{marginTop: 15}}>
        {t('Tạo tài khoản')}
      </ButtonCustom>

      <View style={{alignItems: 'center'}}>
        <Text style={styles.termsText}>
          <Text style={styles.boldText}>{t('Điều khoản dịch vụ')}</Text>
          {''} &amp; {''}
          <Text style={styles.boldText}>{t('Chính sách bảo mật')}</Text>
        </Text>
      </View>
    </LinearGradient>
    </KeyboardAvoidingView>
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
