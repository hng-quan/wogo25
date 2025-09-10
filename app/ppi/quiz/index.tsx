import ButtonCustom from '@/components/button/ButtonCustom';
import Appbar from '@/components/layout/Appbar';
import { Question } from '@/interfaces/interfaces';
import { jsonPostAPI } from '@/lib/apiService';
import { useNavigation } from '@react-navigation/native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, View } from 'react-native';
import { Text } from 'react-native-paper';

const DURATION = 1800; // 30 phút
export default function Index() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  const [started, setStarted] = useState(false);
  const [testId, setTestId] = useState<number | null>(null);
  const {service_id, service_name} = useLocalSearchParams();
  const navigation = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    if (!started) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          Alert.alert('Hết giờ', 'Bài của bạn đã được nộp tự động.');
          submitTest();
          unmountAll();
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [started]);

  const confirmAndSubmit = () => {
    Alert.alert('Xác nhận nộp bài', 'Bạn chắc chắn muốn nộp bài và xem kết quả chứ?', [
      {text: 'Hủy', style: 'cancel'},
      {
        text: 'Nộp bài',
        style: 'destructive',
        onPress: () => {
          submitTest();
          unmountAll();
        },
      },
    ]);
  };

  const onSuccess = (data: any) => {
    if (!data || !data.result || data.result.questions.length === 0) {
      Alert.alert('Thông báo', 'Hệ thống không có câu hỏi nào cho dịch vụ này. Vui lòng quay lại sau.');
      return;
    }
    setStarted(true);
    setTimeLeft(DURATION);
    setAnswers({});
    setTestId(data.result.testId);
    setQuestions(data.result.questions);
  };

  const fetchQuestions = async () => {
    const params = {
      serviceId: service_id,
    };
    await jsonPostAPI('/worker-verify/create-test', params, onSuccess);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleAnswer = useCallback((q: Question, optionId: number) => {
    setAnswers(prev => {
      const current = prev[q.id] || [];
      if (q.questionType === 'SINGLE_CHOICE') {
        return {...prev, [q.id]: [optionId]};
      } else {
        if (current.includes(optionId)) {
          return {...prev, [q.id]: current.filter(id => id !== optionId)};
        } else {
          return {...prev, [q.id]: [...current, optionId]};
        }
      }
    });
  }, []);

  const submitTest = async (options?: { skipNavigate?: boolean }) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        testId: testId,
        answers: Object.entries(answers).map(([qId, optionIds]) => ({
          questionId: Number(qId),
          selectedOptionIds: optionIds,
        })),
      };
      console.log('Payload nộp bài:', payload);
      await jsonPostAPI('/worker-verify/complete-test', payload, data => {
        if (data && !options?.skipNavigate) {
          router.replace({
            pathname: '/ppi/quiz/result',
            params: {
              passed: data.result.passed,
              scorePercentage: data.result.scorePercentage,
              service_name: service_name,
            },
          });
        }
      });
    } catch (error) {
      console.error('Submit failed:', error);
      Alert.alert('Lỗi', 'Nộp bài thất bại, vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const unmountAll = () => {
    setStarted(false);
    setTimeLeft(DURATION);
    setAnswers({});
    setTestId(null);
    setQuestions([]);
  };

  useFocusEffect(
    React.useCallback(() => {
      const beforeRemove = (e: any) => {
        if (!started) return; // chưa bắt đầu thì cho thoát luôn

        e.preventDefault(); // chặn điều hướng mặc định

        Alert.alert(
          'Thoát khỏi bài kiểm tra',
          'Bài kiểm tra sẽ bị hủy khi bạn thoát khỏi màn hình này. Bạn có muốn tiếp tục không?',
          [
            {
              text: 'Ở lại',
              style: 'cancel',
              onPress: () => {},
            },
            {
              text: 'Thoát',
              style: 'destructive',
              onPress: () => {
                setAnswers({});
                submitTest({ skipNavigate: true });
                unmountAll();
                navigation.dispatch(e.data.action);
              },
            },
          ],
        );
      };

      navigation.addListener('beforeRemove', beforeRemove);

      return () => {
        navigation.removeListener('beforeRemove', beforeRemove);
      };
    }, [navigation, started, answers]),
  );

  const answeredCount = Object.values(answers).filter(optIds => optIds.length > 0).length;

  if (!started) {
    return (
      <>
        <Appbar title='Làm bài kiểm tra' />
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F2'}}>
          <Text variant='titleMedium' style={{marginBottom: 20, textAlign: 'center'}}>
            Kiểm tra nghiệp vụ {service_name}
          </Text>
          <Text variant='titleMedium' style={{marginBottom: 20, textAlign: 'center'}}>
            Hãy hoàn thành 20 câu hỏi trong {DURATION / 60} phút!
          </Text>
          <ButtonCustom
            mode='contained'
            onPress={() => {
              fetchQuestions();
            }}>
            Bắt đầu làm bài
          </ButtonCustom>
        </View>
      </>
    );
  }

  return (
    <View className='h-full bg-[#F2F2F2]'>
      <Appbar title='Làm bài kiểm tra' />
      {/* Header */}
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}} className='px-4'>
        <Text variant='titleMedium'>{`${answeredCount}/${questions.length} câu`}</Text>
        <Text variant='titleMedium'>⏳{formatTime(timeLeft)}</Text>
      </View>

      {/* Danh sách câu hỏi */}
      <FlatList
        className='px-4'
        data={questions}
        keyExtractor={item => item.id.toString()}
        renderItem={({item, index}) => (
          <View style={{marginVertical: 12}}>
            <Text style={{fontSize: 16, fontWeight: '600', color: 'blue'}}>
              Câu {index + 1}: {item.questionText}
            </Text>

            {item.questionType === 'SINGLE_CHOICE'
              ? item.questionOptions.map(opt => {
                  const checked = answers[item.id]?.includes(opt.id);
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => toggleAnswer(item, opt.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        marginVertical: 2,
                      }}>
                      <View
                        style={{
                          height: 20,
                          width: 20,
                          borderRadius: 10,
                          borderWidth: 2,
                          borderColor: checked ? 'blue' : '#aaa',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 8,
                        }}>
                        {checked && (
                          <View
                            style={{
                              height: 10,
                              width: 10,
                              borderRadius: 5,
                              backgroundColor: 'blue',
                            }}
                          />
                        )}
                      </View>
                      <Text>{opt.optionText}</Text>
                    </Pressable>
                  );
                })
              : item.questionOptions.map(opt => {
                  const checked = answers[item.id]?.includes(opt.id);
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => toggleAnswer(item, opt.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        marginVertical: 2,
                      }}>
                      <View
                        style={{
                          height: 20,
                          width: 20,
                          borderWidth: 2,
                          borderColor: checked ? 'blue' : '#aaa',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 8,
                        }}>
                        {checked && (
                          <View
                            style={{
                              height: 12,
                              width: 12,
                              backgroundColor: 'blue',
                            }}
                          />
                        )}
                      </View>
                      <Text>{opt.optionText}</Text>
                    </Pressable>
                  );
                })}
          </View>
        )}
      />

      <View className='p-4'>
        <ButtonCustom
          mode='contained'
          onPress={confirmAndSubmit}
          style={{marginTop: 16}}
          // disabled={timeLeft <= 0 || answeredCount <= 5}
        >
          {/* {answeredCount <= 5 ? 'Bạn cần trả lời ít nhất 5 câu' : 'Nộp bài và xem kết quả'} */}
          Nộp bài và xem kết quả
        </ButtonCustom>
      </View>
    </View>
  );
}
