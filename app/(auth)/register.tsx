import { postAPI } from '@/lib/apiService';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
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
    await postAPI('/auth/signup', params, _onSuccess, setIsLoading, setError);
  };
  const _navigateToLogin = () => {
    router.back();
  };
  return (
    <View style={styles.container}>
      <Text variant='headlineMedium' style={styles.title}>
        {t('Đăng ký')}
      </Text>
      <View className='py-1'>{error ? <Text style={{color: 'red'}}>{t(error.message)}</Text> : null}</View>
      <TextInput label={t('Số điện thoại')} value={phoneNumber} onChangeText={setPhoneNumber} style={styles.input} />
      <TextInput label={t('Họ và tên')} value={fullName} onChangeText={setFullName} style={styles.input} />
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
      <Button mode='contained' loading={isLoading} onPress={_handleRegister} style={styles.button}>
        <Text>{t('Đăng ký')}</Text>
      </Button>
      <Button mode='outlined' onPress={_navigateToLogin} style={styles.button}>
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
