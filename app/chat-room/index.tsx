import Appbar from '@/components/layout/Appbar';
import { ROLE, useRole } from '@/context/RoleContext';
import { useSocket } from '@/context/SocketContext';
import { jsonGettAPI, jsonPostAPI } from '@/lib/apiService'; // Sử dụng hàm của bạn
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { IMessage } from '@stomp/stompjs';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

// Định nghĩa kiểu cho một tin nhắn
interface Message {
  id: string | number;
  content: string;
  senderType: 'USER' | 'WORKER';
  createdAt: string;
}

// Component cho một item tin nhắn
const MessageItem = ({ item }: { item: Message }) => {
  const isMyMessage = item.senderType === 'USER';

  return (
    <View
      style={[
        styles.messageItemContainer,
        {
          justifyContent: isMyMessage ? 'flex-end' : 'flex-start',
        },
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble,
        ]}
      >
        <Text style={styles.messageText}>{item.content}</Text>
      </View>
    </View>
  );
};

export default function ChatRoom() {
  const {
    jobRequestCode,
    prevPathname,
    currentTab,
    latitude,
    longitude,
    serviceId,
    info_worker,
    job_detail,
    workerId,
    userId
  } = useLocalSearchParams<{ jobRequestCode: string; [key: string]: any }>();
  const {user, role} = useRole();
  const [messageList, setMessageList] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const [roomCode, setRoomCode] = useState('');
  const { subscribe, connected } = useSocket();

  useEffect(() => {
    if (role === ROLE.CUSTOMER) {
      // job:JR-74FB848E-2025:worker:99:user:100
      setRoomCode(`job:${jobRequestCode}:worker:${workerId}:user:${user?.id}`);
    } else if (role === ROLE.WORKER) {
      setRoomCode(`job:${jobRequestCode}:worker:${user?.id}:user:${userId}`);
    }
  }, [userId, workerId, role, user, jobRequestCode]);

  useEffect(() => {
    fetchMessageList();
  }, [roomCode]);

  // Lắng nghe tin nhắn mới từ WebSocket
  useEffect(() => {
    if (!connected || !roomCode) return;

    const topic = `/topic/chat/${roomCode}`;
    const subscription = subscribe(topic, (message: IMessage) => {
      try {
        const newMsg: Message = JSON.parse(message.body);
        // Thêm tin nhắn mới vào cuối danh sách
        setMessageList(prevMessages => {
          // Tránh thêm tin nhắn trùng lặp nếu có
          if (prevMessages.find(msg => msg.id === newMsg.id)) {
            return prevMessages;
          }
          return [...prevMessages, newMsg];
        });
      } catch (error) {
        console.error('Lỗi parse tin nhắn từ WS:', error);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [connected, roomCode]);

  // Tự động cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    if (messageList.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messageList]);

  const fetchMessageList = async () => {
    if (!roomCode) return;
    try {
      await jsonGettAPI(
        '/chats/get-messageBooking/' + roomCode,
        {},
        (data: any) => setMessageList(data?.result || []),
        setIsLoading,
        () => setIsLoading(false)
      );
    } catch (error) {
      console.log('❌ Lỗi fetchMessageList:', error);
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !roomCode) return;

    const payload = {
      roomCode: roomCode,
      content: newMessage,
      senderType: role === ROLE.CUSTOMER ? 'USER' : 'WORKER',
    };

    // Sử dụng callback onSuccess để xóa input chỉ khi API gọi thành công
    const onSuccess = () => {
      setNewMessage('');
    };

    try {
      // Gọi API POST để gửi tin nhắn
      await jsonPostAPI('/chats/send-message', payload, onSuccess);
    } catch (error) {
      console.error('❌ Lỗi khi gửi tin nhắn:', error);
    }
  };

  const goBack = () => {
    router.push({
      pathname: prevPathname as any,
      params: { currentTab, jobRequestCode, latitude, longitude, serviceId, info_worker, job_detail },
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Appbar title='Trò chuyện' onBackPress={goBack} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 45 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messageList}
          renderItem={({ item }) => <MessageItem item={item} />}
          keyExtractor={(item, index) => item.id?.toString() || `msg-${index}`}
          style={styles.messageList}
          contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 10 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder='Nhập tin nhắn...'
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
            <MaterialCommunityIcons name='send-circle' size={38} color='#007AFF' />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messageList: {
    flex: 1,
  },
  messageItemContainer: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  messageBubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    maxWidth: '80%',
  },
  myMessageBubble: {
    backgroundColor: '#DCF8C6',
    alignSelf: 'flex-end',
  },
  theirMessageBubble: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 120,
    marginRight: 10,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});