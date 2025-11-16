import Appbar from '@/components/layout/Appbar';
import { useRole } from '@/context/RoleContext';
import { Colors } from '@/lib/common';
import { formatPrice } from '@/lib/utils';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

interface Message {
  role: 'user' | 'bot';
  content: string;
}

const API_URL = process.env.EXPO_PUBLIC_CHATBOT_URL;

const STATUS = {
  COMPLETE: 'complete',
  PARTIAL: 'partial',
};

export default function ChatbotScreen() {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [popup, setPopup] = useState<any>(null);
  const [priceRange, setPriceRange] = useState<any>(null);
  const {user} = useRole();
  const [sending, setSending] = useState(false);
  const [botTyping, setBotTyping] = useState(false);

  const fetchSession = async () => {
    try {
      const response = await axios.get(`${API_URL}/session/${String(user.id)}`);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error fetching session:', error);
    }
  };
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        fetchSession();
      }
    }, [user]),
  );

  const handleSend = async () => {
    try {
      if (text.trim() === '') return;

      // Khi popup đang mở, gửi lại tin nhắn mới sẽ reset popup và price range
      if (popup?.status === STATUS.COMPLETE) {
        setPopup(null);
        setPriceRange(null);
      }

      const newMessage: Message = {
        role: 'user',
        content: text,
      };

      setMessages(prevMessages => [...prevMessages, newMessage]);
      const userInput = text;
      setText('');

      setSending(true);
      setBotTyping(true);
      const response = await axios.post(`${API_URL}/wogo/chatbot`, {
        session_id: String(user.id),
        message: userInput,
      });
      console.log('Response from chatbot API:', response.data);
      setPopup(response.data.popup);
      fetchSession();
      setSending(false);
      setBotTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
      setSending(false);
    }
  };

  const handleDeleteSession = async () => {
    try {
      await axios.delete(`${API_URL}/session/${String(user.id)}`);
      setMessages([]);
      setPopup(null);
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const fetchPrice = async () => {
    try {
      const response = await axios.get(`${API_URL}/price-range/${String('35')}`);
      setPriceRange(response.data);
    } catch (error) {
      console.error('Error fetching price range:', error);
    }
  };

  useEffect(() => {
    if (popup?.status === STATUS.COMPLETE) {
      fetchPrice();
    }
  }, [popup]);

  return (
    <KeyboardAvoidingView
      style={{flex: 1, backgroundColor: Colors.background}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 45 : 0}
      >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{flex: 1}}>
          {/* Header */}
          <View>
            <Appbar title='AI Wogo' />
            <TouchableOpacity
              onPress={handleDeleteSession}
              style={{position: 'absolute', right: 16, top: 12, zIndex: 10, padding: 6}}>
              <Ionicons name='trash-bin' size={24} color={Colors.secondary || '#FFB300'} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={{flex: 1}}>
            <ScrollView
              style={{flex: 1}}
              contentContainerStyle={{
                padding: 16,
                paddingBottom: 160, // chừa khoảng cho popup + input
              }}>
              {messages.length > 0 ? (
                <>
                  {messages.map((msg, index) => (
                    <View
                      key={index}
                      style={{
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        backgroundColor: msg.role === 'user' ? '#E8F5E9' : '#E3F2FD',
                        borderRadius: 16,
                        padding: 12,
                        marginVertical: 4,
                        maxWidth: '80%',
                        shadowColor: '#000',
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: 1,
                      }}>
                      <Text style={{fontSize: 15, color: '#222'}}>{msg.content}</Text>
                    </View>
                  ))}
                  {botTyping && (
                    <View
                      style={{
                        alignSelf: 'flex-start',
                        backgroundColor: '#E3F2FD',
                        borderRadius: 16,
                        padding: 12,
                        marginVertical: 4,
                        maxWidth: '80%',
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}>
                      <TypingDots />
                    </View>
                  )}
                </>
              ) : (
                <GreetingAnimation />
              )}
            </ScrollView>
          </View>

          {/* Popup hiển thị khi có tin nhắn */}
          {popup?.status === STATUS.COMPLETE && (
            <View
              style={{
                position: 'absolute',
                bottom: 70,
                left: 10,
                right: 10,
                backgroundColor: '#fff',
                borderRadius: 16,
                padding: 16,
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 5,
                elevation: 4,
              }}>
              <Text style={{fontWeight: 'bold', fontSize: 16, marginBottom: 8}}>{popup?.service_group}</Text>

              <View
                style={{
                  backgroundColor: '#FFF8E1',
                  padding: 10,
                  borderRadius: 12,
                  marginBottom: 12,
                }}>
                <Text style={{color: '#444', marginBottom: 4}}>Giá tham khảo</Text>
                <Text
                  style={{
                    color: '#F57C00',
                    fontWeight: 'bold',
                    fontSize: 16,
                  }}>
                  {formatPrice(priceRange?.minPrice)} - {formatPrice(priceRange?.maxPrice)}
                </Text>
                <Text style={{color: '#43A047', fontSize: 13, marginTop: 4}}>Độ chính xác giá thị trường: 90%</Text>
              </View>

              <View style={{marginBottom: 12}}>
                <Text style={{color: '#555', marginBottom: 4}}>Mô tả công việc</Text>
                <Text style={{backgroundColor: '#fafafa', padding: 8, borderRadius: 8}}>{popup?.description}</Text>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: Colors.secondary || '#FFB3',
                  borderRadius: 25,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
                onPress={() => {
                  router.push({
                    pathname: '/booking/create-job',
                    params: {
                      serviceId: popup?.service_id,
                      des: popup?.description,
                    },
                  });
                }}>
                <Text style={{color: '#000', fontWeight: 'bold', fontSize: 16}}>Tìm thợ</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Footer */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#fff',
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderTopWidth: 0,
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 4,
              shadowOffset: {width: 0, height: -1},
              elevation: 6, // cho Android
            }}>
            <View
              style={{
                flex: 1,
                backgroundColor: '#F5F5F5',
                borderRadius: 30,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: Platform.OS === 'ios' ? 10 : 4,
              }}>
              <TextInput
                placeholder='Nhập tin nhắn...'
                value={text}
                onChangeText={setText}
                style={{
                  flex: 1,
                  fontSize: 16,
                  color: '#222',
                  paddingRight: 8,
                }}
                placeholderTextColor='#999'
              />
            </View>

            {sending ? (
              <View
                style={{
                  marginLeft: 10,
                  backgroundColor: Colors.secondary || '#FFB300',
                  width: 42,
                  height: 42,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 4,
                }}>
                <ActivityIndicator size='small' color='#fff' />
              </View>
            ) : (
              // loading indicator
              <TouchableOpacity
                onPress={() => handleSend()}
                activeOpacity={0.8}
                style={{
                  marginLeft: 10,
                  backgroundColor: Colors.secondary || '#FFB300',
                  width: 42,
                  height: 42,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 4,
                }}>
                <Ionicons name='send' size={22} color='#fff' />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
const GreetingAnimation = () => {
  const scale = useRef(new Animated.Value(0.8)).current;
  const headTilt = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 500,
        delay: 150,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(headTilt, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(headTilt, {
          toValue: -1,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]),
      {resetBeforeIteration: false},
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(textScale, {
          toValue: 1.05,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(textScale, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const rotate = headTilt.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-8deg', '8deg'],
  });

  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40}}>
      <Animated.Image
        source={require('../../assets/images/icons8-music-robot-94.png')}
        style={{
          width: 90,
          height: 90,
          transform: [{scale}, {rotate}],
        }}
        resizeMode='contain'
      />

      <Animated.Text
        style={{
          fontSize: 16,
          color: '#666',
          textAlign: 'center',
          lineHeight: 22,
          opacity: textOpacity,
          marginTop: 10,
          transform: [{scale: textScale}],
        }}>
        Xin chào! 👋{'\n'}Hãy cho tôi biết vấn đề của bạn nhé.
      </Animated.Text>
    </View>
  );
};

const TypingDots = () => {
  // Giá trị Animated chính. Chúng ta vẫn dùng 0 -> 3 cho 3 dot
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Vòng lặp animation: 900ms cho 3 dot, mỗi dot 300ms
    Animated.loop(
      Animated.timing(progress, {
        toValue: 3,
        duration: 900,
        // Sử dụng easing cho cảm giác nhảy mượt hơn
        easing: Easing.linear, 
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  // Chiều cao nhảy tối đa (ví dụ: 10 đơn vị)
  const JUMP_HEIGHT = -10; 
  // Độ trễ/khoảng cách giữa các dot trong chu kỳ (cần 1 đơn vị cho mỗi dot)
  const DELAY = 1; 

  // Tính toán translateY cho Dot 1
  const translateY1 = progress.interpolate({
    // Input là [0, 0.5, 1.0, 3]
    // Chu kỳ nhảy là 0 -> 1
    inputRange: [0, 0.5, 1, 3],
    outputRange: [0, JUMP_HEIGHT, 0, 0], // Nhảy lên (0 -> JUMP_HEIGHT) và xuống (JUMP_HEIGHT -> 0)
    extrapolate: 'clamp',
  });

  // Tính toán translateY cho Dot 2
  const translateY2 = progress.interpolate({
    // Dot 2 nhảy trễ 0.5 đơn vị so với Dot 1
    // Chu kỳ nhảy là 1 -> 2
    inputRange: [0, DELAY, DELAY + 0.5, DELAY + 1, 3],
    outputRange: [0, 0, JUMP_HEIGHT, 0, 0], // Dot 2: 0ms: 0, 300ms: 0, 450ms: JUMP_HEIGHT, 600ms: 0, 900ms: 0
    extrapolate: 'clamp',
  });

  // Tính toán translateY cho Dot 3
  const translateY3 = progress.interpolate({
    // Dot 3 nhảy trễ 1 đơn vị so với Dot 2 (hoặc 2 đơn vị so với Dot 1)
    // Chu kỳ nhảy là 2 -> 3
    inputRange: [0, DELAY * 2, DELAY * 2 + 0.5, DELAY * 3],
    outputRange: [0, 0, JUMP_HEIGHT, 0], // Dot 3: 0ms: 0, 600ms: 0, 750ms: JUMP_HEIGHT, 900ms: 0
    extrapolate: 'clamp',
  });

  // Bạn có thể giữ lại opacity để các dot mờ đi khi không hoạt động, 
  // nhưng thường thì kiểu nhảy lên xuống sẽ giữ opacity = 1.
  // Ở đây chúng ta bỏ opacity để tập trung vào hiệu ứng nhảy.

  return (
    <View style={styleDot.container}>
      {/* Dot 1 */}
      <Animated.Text 
        style={[styleDot.dot, { transform: [{ translateY: translateY1 }] }]}
      >
        •
      </Animated.Text>
      
      {/* Dot 2 */}
      <Animated.Text 
        style={[styleDot.dot, { transform: [{ translateY: translateY2 }] }]}
      >
        •
      </Animated.Text>

      {/* Dot 3 */}
      <Animated.Text 
        style={[styleDot.dot, { transform: [{ translateY: translateY3 }] }]}
      >
        •
      </Animated.Text>
    </View>
  );
};

const styleDot = StyleSheet.create({
    container: {
        flexDirection: 'row', 
        alignItems: 'center',
        height: 30, // Đảm bảo có đủ không gian cho các dot nhảy
    },
    dot: {
        fontSize: 22,
        marginLeft: 4,
        color: '#0084ff', // Màu xanh Messenger
    }
});
