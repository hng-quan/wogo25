import ButtonCustom from '@/components/button/ButtonCustom';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

export default function Result() {
  const {passed, scorePercentage, service_name} = useLocalSearchParams();

  const isPassed = passed === 'true';
  const score = Number(scorePercentage);

  return (
    <View style={{flex: 1, padding: 16, backgroundColor: '#F8FAFC'}}>
      <Text style={{fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 16}}>Kết quả</Text>

      <View
        style={{
          alignItems: 'center',
          backgroundColor: '#fff',
          borderRadius: 16,
          padding: 20,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 6,
          marginBottom: 20,
        }}>
        <Text style={{fontSize: 80, marginBottom: 12}}>{isPassed ? '🎉' : '❌'}</Text>

        <Text style={{fontSize: 18, marginBottom: 4}}>Kết quả bài kiểm tra {service_name}</Text>
        <Text style={{fontSize: 28, fontWeight: 'bold', color: isPassed ? 'green' : 'red'}}>{score}%</Text>

        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: isPassed ? 'green' : 'red',
            marginTop: 12,
            marginBottom: 8,
          }}>
          {isPassed ? 'Hoàn thành' : 'Chưa đạt'}
        </Text>

        <Text style={{textAlign: 'center', color: '#555'}}>
          {isPassed
            ? 'Chúc mừng bạn đã hoàn thành bài kiểm tra! Bạn có năng lực và tiềm năng để trở thành một chuyên gia trong lĩnh vực của mình.'
            : 'Rất tiếc, bạn chưa đạt yêu cầu. Hãy ôn tập lại kiến thức và thử lại để nâng cao kết quả.'}
        </Text>
      </View>

      <ButtonCustom
        mode='contained'
        onPress={() => {
          router.replace('/ppi');
        }}>
        Xem nghiệp vụ
      </ButtonCustom>
    </View>
  );
}
