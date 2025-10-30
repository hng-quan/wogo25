import Appbar from '@/components/layout/Appbar';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Image,
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
    const newMsg = { id: Date.now(), from: 'user', text: message.trim() };
    setMessages(prev => [...prev, newMsg]);
    setMessage('');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F2F2F2' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 45 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          {/* Header */}
          <Appbar title="AI Wogo" />

          {/* Body */}
          <View style={{ flex: 1 }}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                padding: 16,
                paddingBottom: 160, // chừa khoảng cho popup + input
              }}
            >
              {messages.length > 0 ? (
                messages.map(msg => (
                  <View
                    key={msg.id}
                    style={{
                      alignSelf: msg.from === 'user' ? 'flex-end' : 'flex-start',
                      backgroundColor:
                        msg.from === 'user' ? '#FFD54F' : '#FFF',
                      borderRadius: 16,
                      padding: 12,
                      marginVertical: 4,
                      maxWidth: '80%',
                      shadowColor: '#000',
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1,
                    }}
                  >
                    <Text style={{ fontSize: 15, color: '#222' }}>{msg.text}</Text>
                  </View>
                ))
              ) : (
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Image
                    source={require('../../assets/images/icons8-music-robot-94.png')}
                    style={{ width: 100, height: 100, marginBottom: 20 }}
                    resizeMode="contain"
                  />
                  <Text
                    style={{ fontSize: 16, color: '#555', textAlign: 'center' }}
                  >
                    Xin chào! Hãy cho tôi biết vấn đề của bạn.
                  </Text>
                </View>
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
              }}
            >
              <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>
                Thợ cửa nhôm kính
              </Text>

              <View
                style={{
                  backgroundColor: '#FFF8E1',
                  padding: 10,
                  borderRadius: 12,
                  marginBottom: 12,
                }}
              >
                <Text style={{ color: '#444', marginBottom: 4 }}>Giá tham khảo</Text>
                <Text
                  style={{
                    color: '#F57C00',
                    fontWeight: 'bold',
                    fontSize: 16,
                  }}
                >
                  800,000 - 5,000,000đ
                </Text>
                <Text style={{ color: '#43A047', fontSize: 13, marginTop: 4 }}>
                  Độ chính xác giá thị trường: 90%
                </Text>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#555', marginBottom: 4 }}>Mô tả công việc</Text>
                <Text style={{ backgroundColor: '#fafafa', padding: 8, borderRadius: 8 }}>
                  {messages[messages.length - 1].text}
                </Text>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: '#FFB300',
                  borderRadius: 25,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 16 }}>
                  Tìm thợ
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Footer */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderTopWidth: 1,
              borderTopColor: '#ddd',
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: '#fff',
            }}
          >
            <TextInput
              placeholder="Nhập tin nhắn..."
              value={message}
              onChangeText={setMessage}
              style={{
                flex: 1,
                backgroundColor: '#f9f9f9',
                borderRadius: 25,
                paddingHorizontal: 16,
                paddingVertical: 10,
                fontSize: 16,
              }}
              placeholderTextColor={'#aaa'}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              onPress={handleSend}
              style={{
                marginLeft: 8,
                backgroundColor: '#10B981',
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="send" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
