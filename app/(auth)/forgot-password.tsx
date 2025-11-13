import ButtonCustom from '@/components/button/ButtonCustom';
import { jsonGettAPI, jsonPostAPI } from '@/lib/apiService';
import { validatePassword, validatePhoneNumber } from '@/lib/utils';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import Toast from 'react-native-toast-message';

type FormValues = {
  phone: string;
  newPassword: string;
};

/**
 * ForgotPasswordScreen
 * - B1: Kiểm tra xem số điện thoại đã tồn tại (GET /isExistPhone)
 * - B2: Nếu tồn tại, nhập mật khẩu mới và gọi POST /updatePassword
 *
 * Thực hiện validate bằng hàm util, hiển thị toast bằng react-native-toast-message.
 */
const ForgotPasswordScreen = () => {
  const {t} = useTranslation();
  const {control, handleSubmit, setError, clearErrors, formState: {errors}} = useForm<FormValues>({
    defaultValues: {phone: '', newPassword: ''},
  });

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  // Hiển thị toast tiện dụng
  const showToast = (type: 'success' | 'error', text1: string, text2?: string) => {
    Toast.show({type, text1, text2});
  };

  // B1: Kiểm tra phone tồn tại
  const handleCheckPhone = async (data: FormValues) => {
    const {phone} = data;

    // Validate client-side trước khi gọi API
    const phoneValidation = validatePhoneNumber(phone);
    if (phoneValidation) {
      setError('phone', {type: 'manual', message: phoneValidation});
      return;
    }

    setLoading(true);
    try {
      // jsonGettAPI expects second param as axios config -> pass params inside { params: { phone } }
      const res = await jsonGettAPI('/auth/isExistPhone', {params: {phone}}, (d: any) => d, setLoading, undefined, false);

      // Nếu API trả về result === true (hoặc tuỳ backend), chuyển bước 2
      if (res && (res.result === true || res.result?.exists === true)) {
        setStep(2);
        setPhoneNumber(phone);
        showToast('success', t('Số điện thoại hợp lệ'), t('Vui lòng nhập mật khẩu mới'));
        clearErrors('phone');
      } else {
        showToast('error', t('Số điện thoại không tồn tại'));
      }
    } catch (err) {
      // jsonGettAPI đã hiển thị toast lỗi chung; ở đây chúng ta log thêm nếu cần
      console.log('check phone error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Phone number set to', phoneNumber);
  }, [phoneNumber])

  // B2: Gọi API update password
  const handleUpdatePassword = async (data: FormValues) => {
    const {newPassword} = data;

    // Validate password client-side
    const passValidation = validatePassword(newPassword);
    if (passValidation) {
      setError('newPassword', {type: 'manual', message: passValidation});
      return;
    }

    setLoading(true);
    try {
      // Note: jsonPostAPI gửi body JSON. Nếu backend bắt params qua query, thay đổi endpoint tương ứng.
      console.log('Calling updatePassword with', {phoneNumber, newPassword});
      const res = await jsonPostAPI('/auth/updatePassword', {phone: phoneNumber, newPassword}, (d: any) => d, setLoading, undefined, true, true);

      if (res && res.result) {
        showToast('success', t('Cập nhật mật khẩu thành công'));
        // Sau khi đổi mật khẩu, điều hướng về login
        router.replace('/(auth)/login');
      } else {
        showToast('error', t('Cập nhật mật khẩu thất bại'));
      }
    } catch (err) {
      console.log('update password error', err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (data: FormValues) => {
    if (step === 1) return handleCheckPhone(data);
    return handleUpdatePassword(data);
  };

  const navigateToLogin = () => router.push('/(auth)/login');

  return (
    <View style={styles.container}>
      <Text variant='headlineSmall' style={styles.title}>{t('Quên mật khẩu')}</Text>

      {step === 1 ? (
        <>
          <Controller
            control={control}
            name='phone'
            rules={{required: 'Vui lòng nhập số điện thoại'}}
            render={({field: {onChange, value}}) => (
              <TextInput
                label={t('Số điện thoại')}
                value={value}
                onChangeText={text => onChange(text)}
                style={styles.input}
                keyboardType='phone-pad'
                theme={inputTheme}
              />
            )}
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone.message as string}</Text>}

          <ButtonCustom mode='contained' loading={loading} onPress={handleSubmit(onSubmit)} style={{marginTop: 12}}>
            {t('Kiểm tra số điện thoại')}
          </ButtonCustom>
        </>
      ) : (
        <>
          <Controller
            control={control}
            name='newPassword'
            rules={{required: 'Vui lòng nhập mật khẩu mới'}}
            render={({field: {onChange, value}}) => (
              <TextInput
                key='newPassword'
                label={t('Mật khẩu mới')}
                value={value}
                secureTextEntry
                keyboardType='default'
                onChangeText={text => onChange(text)}
                style={styles.input}
                theme={inputTheme}
              />
            )}
          />
          {errors.newPassword && <Text style={styles.errorText}>{errors.newPassword.message as string}</Text>}

          <ButtonCustom mode='contained' loading={loading} onPress={handleSubmit(onSubmit)} style={{marginTop: 12}}>
            {t('Cập nhật mật khẩu')}
          </ButtonCustom>
        </>
      )}

      <Pressable
        onPress={navigateToLogin}
        onHoverIn={() => Platform.OS === 'web' && setHovered(true)}
        onHoverOut={() => Platform.OS === 'web' && setHovered(false)}
        style={[styles.backButton, hovered && styles.backButtonHover]}
      >
        {({pressed}) => (
          <Text style={[styles.backButtonText, pressed && {opacity: 0.7}]}>{t('Quay lại đăng nhập')}</Text>
        )}
      </Pressable>

      <View style={{marginTop: 8}} />

    </View>
  );
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: '#F7FFF7',
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  errorText: {
    color: 'red',
    marginTop: 6,
  },
  backButton: {
    marginTop: 18,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  backButtonHover: {
    backgroundColor: '#E8F5E9',
  },
  backButtonText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
});

const inputTheme = {
  colors: {
    primary: '#4CAF50',
  },
};
