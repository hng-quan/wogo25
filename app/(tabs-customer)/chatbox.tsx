import Appbar from '@/components/layout/Appbar';
import { Colors } from '@/lib/common';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

export default function ChatbotScreen() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  const handleSend = () => {
    if (!message.trim()) return;
    const newMsg = {id: Date.now(), from: 'user', text: message.trim()};
    setMessages(prev => [...prev, newMsg]);
    setMessage('');
  };

  return (
    <KeyboardAvoidingView
      style={{flex: 1, backgroundColor: Colors.background}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 45 : 0}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{flex: 1}}>
          {/* Header */}
          <Appbar title='AI Wogo' />

          {/* Body */}
          <View style={{flex: 1}}>
            <ScrollView
              style={{flex: 1}}
              contentContainerStyle={{
                padding: 16,
                paddingBottom: 160, // chừa khoảng cho popup + input
              }}>
              {messages.length > 0 ? (
                messages.map(msg => (
                  <View
                    key={msg.id}
                    style={{
                      alignSelf: msg.from === 'user' ? 'flex-end' : 'flex-start',
                      backgroundColor: msg.from === 'user' ? '#FFD54F' : '#FFF',
                      borderRadius: 16,
                      padding: 12,
                      marginVertical: 4,
                      maxWidth: '80%',
                      shadowColor: '#000',
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1,
                    }}>
                    <Text style={{fontSize: 15, color: '#222'}}>{msg.text}</Text>
                  </View>
                ))
              ) : (
                // <View
                //   style={{
                //     flex: 1,
                //     justifyContent: 'center',
                //     alignItems: 'center',
                //   }}>
                //   <Image
                //     source={require('../../assets/images/icons8-music-robot-94.png')}
                //     style={{width: 80, height: 80}}
                //     resizeMode='contain'
                //   />
                //   <Text style={{fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 22}}>
                //     Xin chào! 👋{'\n'}Hãy cho tôi biết vấn đề của bạn nhé.
                //   </Text>
                // </View>
                <GreetingAnimation />
              )}
            </ScrollView>
          </View>

          {/* Popup hiển thị khi có tin nhắn */}
          {messages.length > 0 && (
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
              <Text style={{fontWeight: 'bold', fontSize: 16, marginBottom: 8}}>Thợ cửa nhôm kính</Text>

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
                  800,000 - 5,000,000đ
                </Text>
                <Text style={{color: '#43A047', fontSize: 13, marginTop: 4}}>Độ chính xác giá thị trường: 90%</Text>
              </View>

              <View style={{marginBottom: 12}}>
                <Text style={{color: '#555', marginBottom: 4}}>Mô tả công việc</Text>
                <Text style={{backgroundColor: '#fafafa', padding: 8, borderRadius: 8}}>
                  {messages[messages.length - 1].text}
                </Text>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: '#FFB300',
                  borderRadius: 25,
                  paddingVertical: 12,
                  alignItems: 'center',
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
                paddingVertical: Platform.OS === 'ios' ? 10 : 8,
              }}>
              <TextInput
                placeholder='Nhập tin nhắn...'
                value={message}
                onChangeText={setMessage}
                style={{
                  flex: 1,
                  fontSize: 16,
                  color: '#222',
                  paddingRight: 8,
                }}
                placeholderTextColor='#999'
                returnKeyType='send'
                onSubmitEditing={handleSend}
              />
            </View>

            <TouchableOpacity
              onPress={handleSend}
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
