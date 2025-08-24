import { jsonPostAPI } from '@/lib/apiService';
import { validateFullName, validatePassword, validatePhoneNumber } from '@/lib/utils';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import Toast from 'react-native-toast-message';

const RegisterScreen = () => {
  const {t} = useTranslation();
  const [phoneNumber, setPhoneNumber] = useState('0373644375');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [hidePassword, setHidePassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const _onSuccess = (data: any) => {
    // Xử lý khi đăng ký thành công
    Toast.show({
      type: 'success',
      text1: t('Đăng ký thành công'),
      text2: t('Hãy đăng nhập để bắt đầu!'),
    });
    router.back();
  };

  const _handleRegister = async () => {
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
    <View style={styles.container}>
      <Text variant='headlineMedium' style={styles.title}>
        {t('Đăng ký')}
      </Text>
      {/* <View className='py-1'>{error ? <Text style={{color: 'red'}}>{t(error.message)}</Text> : null}</View> */}
      <HelperText type='error' visible={error !== null}>
        {error ? t(error.message) : null}
      </HelperText>
      <TextInput
        label={t('Số điện thoại')}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        style={styles.input}
        theme={inputTheme}
      />
      <HelperText type='error' visible={!validatePhoneNumber(phoneNumber)}>
        Số điện thoại không hợp lệ!
      </HelperText>
      <TextInput
        label={t('Họ và tên')}
        value={fullName}
        onChangeText={setFullName}
        style={styles.input}
        theme={inputTheme}
      />
      <HelperText type='error' visible={!validateFullName(fullName)}>
        Họ và tên không hợp lệ!
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
      <HelperText type='error' visible={!validatePassword(password)}>
        Mật khẩu không hợp lệ!
      </HelperText>
      <Button
        mode='contained'
        loading={isLoading}
        onPress={_handleRegister}
        style={styles.button}
        buttonColor={styles.buttonColor.backgroundColor}
        rippleColor={rippleColor.rippleColor}>
        <Text>{t('Đăng ký')}</Text>
      </Button>
      <Button
        mode='outlined'
        onPress={_navigateToLogin}
        style={styles.button}
        textColor={styles.outlinedButtonText.color}>
        <Text>{t('Đăng nhập')}</Text>
      </Button>
    </View>
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
    // marginBottom: 16,
    color: '#2E7D32',
  },
  input: {
    // marginBottom: 12,
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
