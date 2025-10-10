import Appbar from '@/components/layout/Appbar';
import { ROLE, useRole } from '@/context/RoleContext';
import { useSocket } from '@/context/SocketContext';
import { formPostAPI, jsonGettAPI, jsonPostAPI } from '@/lib/apiService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { IMessage } from '@stomp/stompjs';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

// Interface Message không đổi
interface Message {
  id: string | number;
  content?: string;
  senderType: 'USER' | 'WORKER';
  createdAt: string;
  messageType: 'TEXT' | 'FILE' | 'IMAGE';
  fileUrls: string[] | null;
}

const MessageItem = ({item, currentRole}: {item: Message; currentRole: string}) => {
  const isMyMessage = item.senderType === currentRole;

  const renderMessageContent = () => {
    if ((item.messageType === 'IMAGE' || item.messageType === 'FILE') && item.fileUrls && item.fileUrls.length > 0) {
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
      const isImage = imageExtensions.some(ext => item.fileUrls![0].toLowerCase().endsWith(ext));

      if (isImage) {
        return (
          <View style={styles.imageContainer}>
            {item.fileUrls.map((url, index) => (
              <TouchableOpacity key={index} onPress={() => Linking.openURL(url)}>
                <Image source={{uri: url}} style={styles.messageImage} resizeMode='cover' />
              </TouchableOpacity>
            ))}
          </View>
        );
      }
      return (
        <TouchableOpacity style={styles.fileContainer} onPress={() => Linking.openURL(item.fileUrls![0])}>
          <MaterialCommunityIcons name='file-document-outline' size={24} color={isMyMessage ? '#005500' : '#00529B'} />
          <Text style={[styles.fileText, {color: isMyMessage ? '#005500' : '#00529B'}]}>
            {item.content || 'Tệp đính kèm'}
          </Text>
        </TouchableOpacity>
      );
    }

    return <Text style={styles.messageText}>{item.content}</Text>;
  };

  return (
    <View style={[styles.messageItemContainer, {justifyContent: isMyMessage ? 'flex-end' : 'flex-start'}]}>
      <View
        style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble,
          item.messageType === 'IMAGE' && item.fileUrls && {padding: 0, overflow: 'hidden'},
        ]}>
        {renderMessageContent()}
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
    userId,
  } = useLocalSearchParams<{jobRequestCode: string; [key: string]: any}>();

  const {user, role} = useRole();
  const [messageList, setMessageList] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const [roomCode, setRoomCode] = useState('');
  const {subscribe, connected} = useSocket();

  useEffect(() => {
    if (user && role) {
      if (role === ROLE.CUSTOMER) {
        setRoomCode(`job:${jobRequestCode}:worker:${workerId}:user:${user.id}`);
      } else if (role === ROLE.WORKER) {
        setRoomCode(`job:${jobRequestCode}:worker:${user.id}:user:${userId}`);
      }
    }
  }, [userId, workerId, role, user, jobRequestCode]);

  useEffect(() => {
    if (roomCode) fetchMessageList();
  }, [roomCode]);

  // Lắng nghe tin nhắn mới từ WebSocket
  useEffect(() => {
    if (!connected || !roomCode) return;

    const topic = `/topic/chat/${roomCode}`;
    const subscription = subscribe(topic, (message: IMessage) => {
      try {
        fetchMessageList();
      } catch (error) {
        console.error('Lỗi parse tin nhắn từ WS:', error);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [connected, roomCode]);

  useEffect(() => {
    if (messageList.length > 0) {
      flatListRef.current?.scrollToEnd({animated: true});
    }
  }, [messageList]);

  const fetchMessageList = async () => {
    if (!roomCode) return;
    try {
      await jsonGettAPI(
        '/chats/get-messageBooking/' + roomCode,
        {},
        (data: any) => {
          const rawMessages = data?.result?.messages;
          if (Array.isArray(rawMessages)) {
            const formattedMessages = rawMessages.map(msg => ({
              ...msg,
              id: msg.id || msg.createdAt,
            }));
            setMessageList(formattedMessages);
          } else {
            setMessageList([]);
          }
        },
        setIsLoading,
        () => setIsLoading(false),
      );
    } catch (error) {
      console.log('❌ Lỗi fetchMessageList:', error);
      setMessageList([]); // Đặt lại thành mảng rỗng nếu có lỗi
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !roomCode || !role) return;
    const payload = {
      roomCode: roomCode,
      content: newMessage,
      senderType: role === ROLE.CUSTOMER ? 'USER' : 'WORKER',
    };
    try {
      await jsonPostAPI('/chats/send-message', payload);
    } catch (error) {
      console.error('❌ Lỗi khi gửi tin nhắn:', error);
    }
  };

  const handlePickAndSendFile = async () => {
    if (!roomCode || !role) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({type: '*/*', copyToCacheDirectory: true});
      if (result.canceled) return;

      const file = result.assets[0];
      const formData = new FormData();
      formData.append('files', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType,
      } as any);
      formData.append('roomCode', roomCode);
      formData.append('senderType', role === ROLE.CUSTOMER ? 'USER' : 'WORKER');
      formData.append('content', file.name);
      await formPostAPI('/chats/send-file', formData, () => console.log('✅ Gửi file thành công!'));
    } catch (error) {
      console.error('❌ Lỗi khi chọn hoặc gửi file:', error);
    }
  };

  const handlePickAndSendImage = async () => {
    if (!roomCode || !role) return;

    // 1. Lấy trạng thái quyền hiện tại mà không cần hỏi
    const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();

    // 2. Nếu quyền chưa được xác định (lần đầu hỏi) -> Yêu cầu quyền
    let finalStatus = status;
    if (status !== 'granted') {
        const { status: newStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        finalStatus = newStatus;
    }

    // 3. Nếu sau khi hỏi mà quyền vẫn không được cấp -> Hiển thị cảnh báo với nút Mở Cài đặt
    if (finalStatus !== 'granted') {
        Alert.alert(
            'Quyền truy cập bị từ chối',
            'Để gửi ảnh, bạn cần cho phép ứng dụng truy cập vào thư viện ảnh. Vui lòng bật quyền trong Cài đặt.',
            [
                {
                    text: 'Mở Cài đặt',
                    onPress: () => Linking.openSettings(), // Mở Cài đặt của ứng dụng
                },
                {
                    text: 'Hủy',
                    style: 'cancel',
                },
            ]
        );
        return; // Dừng hàm tại đây
    }

    // 4. Nếu quyền đã được cấp -> Mở thư viện ảnh
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
    });

    if (result.canceled) return;

    // ... (Phần còn lại của hàm giữ nguyên)
    const image = result.assets[0];
    const formData = new FormData();
    const filename = image.uri.split('/').pop() || 'image.jpg';
    const fileType = `image/${filename.split('.').pop()}`;

    formData.append('files', {
        uri: image.uri,
        name: filename,
        type: fileType,
    } as any);
    formData.append('roomCode', roomCode);
    formData.append('senderType', role === ROLE.CUSTOMER ? 'USER' : 'WORKER');
    formData.append('content', 'Đã gửi một ảnh');
    try {
        await formPostAPI('/chats/send-file', formData, () => console.log('✅ Gửi ảnh thành công!'));
    } catch (error) {
        console.error('❌ Lỗi khi gửi ảnh:', error);
    }
};

  const goBack = () => {
    router.push({
      pathname: prevPathname as any,
      params: {currentTab, jobRequestCode, latitude, longitude, serviceId, info_worker, job_detail},
    });
  };

  if (isLoading && messageList.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' />
      </View>
    );
  }

  const renderItem = ({item}: {item: Message}) => (
    <MessageItem item={item} currentRole={role === ROLE.CUSTOMER ? 'USER' : 'WORKER'} />
  );

  return (
    <View style={styles.container}>
      <Appbar title='Trò chuyện' onBackPress={goBack} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 45 : 0}>
        <FlatList
          ref={flatListRef}
          data={messageList}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.createdAt}-${index}`}
          style={styles.messageList}
          contentContainerStyle={{paddingVertical: 10, paddingHorizontal: 10}}
        />
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handlePickAndSendFile}>
            <MaterialCommunityIcons name='paperclip' size={28} color='#555' />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handlePickAndSendImage}>
            <MaterialCommunityIcons name='image-outline' size={28} color='#555' />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder='Nhập tin nhắn...'
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            placeholderTextColor={'#555'}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
            <MaterialCommunityIcons name='send-circle' size={38} color='#007AFF' />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const {width} = Dimensions.get('window');
const maxImageWidth = width * 0.6;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F2F2F2'},
  loadingContainer: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  keyboardAvoidingView: {flex: 1},
  messageList: {flex: 1},
  messageItemContainer: {flexDirection: 'row', marginVertical: 4},
  messageBubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    maxWidth: '80%',
  },
  myMessageBubble: {backgroundColor: '#DCF8C6'},
  theirMessageBubble: {backgroundColor: '#FFFFFF'},
  messageText: {fontSize: 16, color: '#000'},
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
  },
  sendButton: {justifyContent: 'center', alignItems: 'center', paddingLeft: 8},
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  imageContainer: {padding: 3},
  messageImage: {
    width: maxImageWidth,
    height: maxImageWidth,
    borderRadius: 18,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileText: {
    marginLeft: 8,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
