import ButtonCustom from '@/components/button/ButtonCustom';
import Appbar from '@/components/layout/Appbar';
import { Question } from '@/interfaces/interfaces';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, View } from 'react-native';
import { Checkbox, RadioButton, Text } from 'react-native-paper';
import { questions as questionData } from './dataTest';

const DURATION = 1800; // 30 phút
export default function Index() {
  // const [questions, setQuestions] = useState<Question[]>([]);
  const [questions, setQuestions] = useState<Question[]>(questionData);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  const [started, setStarted] = useState(false);
  const navigation = useNavigation();
  const router = useRouter();

  useEffect(() => {
    if (!started || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [started, timeLeft]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleAnswer = (q: Question, optionId: number) => {
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
  };

  const submitTest = () => {
    const payload = {
      testId: 1, // TODO: truyền testId thực tế
      answers: Object.entries(answers).map(([qId, optionIds]) => ({
        questionId: Number(qId),
        selectedOptionIds: optionIds,
      })),
    };
    console.log('Payload nộp bài:', payload);
    // TODO: gọi API submit
  };

  useFocusEffect(
    React.useCallback(() => {
      const beforeRemove = (e: any) => {
        if (!started) return; // chưa bắt đầu thì cho thoát luôn

        e.preventDefault(); // chặn điều hướng mặc định

        Alert.alert('Thoát khỏi bài kiểm tra', 'Bạn có muốn nộp bài trước khi thoát không?', [
          {
            text: 'Huỷ',
            style: 'cancel',
            onPress: () => {},
          },
          {
            text: 'Thoát không nộp',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
          {
            text: 'Nộp bài và thoát',
            onPress: () => {
              submitTest();
              navigation.dispatch(e.data.action); // hoặc router.back();
            },
          },
        ]);
      };

      navigation.addListener('beforeRemove', beforeRemove);

      return () => {
        navigation.removeListener('beforeRemove', beforeRemove);
      };
    }, [navigation, started, answers]),
  );

  if (!started) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text variant='titleMedium' style={{marginBottom: 20}}>
          Bạn đã sẵn sàng làm bài kiểm tra 20 câu trong {DURATION / 60} phút?
        </Text>
        <ButtonCustom
          mode='contained'
          onPress={() => {
            setStarted(true);
            setTimeLeft(DURATION);
            setAnswers({});
          }}>
          Bắt đầu làm bài
        </ButtonCustom>
      </View>
    );
  }

  return (
    <View>
      <Appbar title='Làm bài kiểm tra' />
      {/* Header */}
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}} className='px-4'>
        <Text variant='titleMedium'>Bài kiểm tra (20 câu)</Text>
        <Text variant='titleMedium'>⏳ {formatTime(timeLeft)}</Text>
      </View>

      {/* Submit */}
      <ButtonCustom mode='contained' onPress={submitTest} style={{marginTop: 16}} disabled={timeLeft <= 0}>
        {timeLeft > 0 ? 'Nộp bài' : 'Hết giờ - Nộp bài'}
      </ButtonCustom>

      {/* Danh sách câu hỏi */}
      <FlatList
        className='px-4'
        data={questions}
        keyExtractor={item => item.id.toString()}
        renderItem={({item, index}) => (
          <View style={{marginVertical: 12}}>
            <Text variant='titleSmall'>
              Câu {index + 1}: {item.questionText}
            </Text>

            {item.questionType === 'SINGLE_CHOICE'
              ? item.questionOptions.map(opt => (
                  <RadioButton.Item
                    key={opt.id}
                    label={opt.optionText}
                    value={String(opt.id)}
                    status={answers[item.id]?.includes(opt.id) ? 'checked' : 'unchecked'}
                    onPress={() => toggleAnswer(item, opt.id)}
                  />
                ))
              : item.questionOptions.map(opt => (
                  <Checkbox.Item
                    key={opt.id}
                    label={opt.optionText}
                    status={answers[item.id]?.includes(opt.id) ? 'checked' : 'unchecked'}
                    onPress={() => toggleAnswer(item, opt.id)}
                  />
                ))}
          </View>
        )}
      />

      
    </View>
  );
}
