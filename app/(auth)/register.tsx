import ButtonCustom from '@/components/button/ButtonCustom';
import HelpText from '@/components/text/HelpText';
import { jsonPostAPI } from '@/lib/apiService';
import { validateFullName, validatePassword, validatePhoneNumber } from '@/lib/utils';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import Toast from 'react-native-toast-message';

const RegisterScreen = () => {
  const {t} = useTranslation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [hidePassword, setHidePassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const _onSuccess = (data: any) => {
    Toast.show({
      type: 'success',
      text1: t('Đăng ký thành công'),
      text2: t('Hãy đăng nhập để bắt đầu!'),
    });
    router.back();
  };

  const _handleRegister = async () => {
    const phoneError = error?.phoneError ?? null;
    const passwordError = error?.passwordError ?? null;
    const fullNameError = error?.fullNameError ?? null;
    if (phoneError || passwordError || fullNameError) return;

    let hasError = false;
    if (phoneNumber.trim() === '') {
      setError((prev: any) => ({
        ...prev,
        phoneError: 'Vui lòng nhập số điện thoại',
      }));
      hasError = true;
    }
    if (password.trim() === '') {
      setError((prev: any) => ({
        ...prev,
        passwordError: 'Vui lòng nhập mật khẩu',
      }));
      hasError = true;
    }
    if (fullName.trim() === '') {
      setError((prev: any) => ({
        ...prev,
        fullNameError: 'Vui lòng nhập họ và tên',
      }));
      hasError = true;
    }
    if (hasError) return;

    const params = {
      phone: phoneNumber,
      password: password,
      fullName: fullName,
      avatarUrl: '',
    };
    await jsonPostAPI('/auth/signup', params, _onSuccess, setIsLoading, setError);
  };
  const _navigateToLogin = () => {
    router.back();
  };
  return (
    <LinearGradient colors={['#E8F5E9', '#C8E6C9']} style={styles.container}>
      <Text variant='headlineSmall' style={styles.title}>
        {t('Đăng ký')}
      </Text>

      <HelpText type='error' visible={error !== null}>
        {error ? t(error.message) : null}
      </HelpText>
      <TextInput
        label={t('Số điện thoại')}
        value={phoneNumber}
        onChangeText={text => {
          setPhoneNumber(text);
          setError((prev: any) => ({...prev, phoneError: validatePhoneNumber(text)}));
        }}
        style={styles.input}
        theme={inputTheme}
      />
      <HelpText type='error' visible={error !== null}>
        {t(error?.phoneError)}
      </HelpText>
      <TextInput
        label={t('Họ và tên')}
        value={fullName}
        onChangeText={text => {
          setFullName(text);
          setError((prev: any) => ({...prev, fullNameError: validateFullName(text)}));
        }}
        style={styles.input}
        theme={inputTheme}
      />
      <HelpText type='error' visible={error !== null}>
        {t(error?.fullNameError)}
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
        value={password}
        onChangeText={text => {
          setPassword(text);
          setError((prev: any) => ({...prev, passwordError: validatePassword(text)}));
        }}
        style={styles.input}
        theme={inputTheme}
      />
      <HelpText type='error' visible={error !== null}>
        {t(error?.passwordError)}
      </HelpText>
      <ButtonCustom mode='contained' loading={isLoading} onPress={_handleRegister} style={{marginTop: 32}}>
        {t('Đăng ký')}
      </ButtonCustom>
      <ButtonCustom mode='outlined' onPress={_navigateToLogin} style={{marginTop: 15}}>
        {t('Đăng nhập')}
      </ButtonCustom>

      <Text style={styles.termsText}>
        {t('Bằng cách nhấn đăng ký, bạn đồng ý với')} <Text style={styles.boldText}>{t('Điều khoản dịch vụ')}</Text> &{' '}
        <Text style={styles.boldText}>{t('Chính sách bảo mật')}</Text>
      </Text>
    </LinearGradient>
  );
};

export default RegisterScreen;

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
    color: '#D32F2F',
  },

  termsText: {
    textAlign: 'center',
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
    onSurfaceVariant: '#1B5E20',
  },
};
