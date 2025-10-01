import { Client, IMessage, StompSubscription } from '@stomp/stompjs';

let stompClient: Client | null = null;

export const connectSocket = (
  userId: string,
  onConnected?: () => void,
  onError?: (error: any) => void
) => {
  stompClient = new Client({
    brokerURL: process.env.EXPO_PUBLIC_WS_URL,
    connectHeaders: {
      // Nếu BE có auth, truyền token hoặc userId
      userId: userId,
    },
    reconnectDelay: 5000, // tự reconnect
    heartbeatIncoming: 4000, 
    heartbeatOutgoing: 4000, 
    debug: (str) => {
      console.log('[STOMP DEBUG]', str);
    },
    onConnect: (frame) => {
      console.log('✅ WebSocket connected');
      if (onConnected) onConnected();
    },
    onStompError: (frame) => {
      console.error('❌ Broker error: ' + frame.headers['message']);
      console.error('❌ Detail: ' + frame.body);
      if (onError) onError(frame);
    },
    onWebSocketError: (evt) => {
      console.error('❌ WebSocket error', evt);
    },
  });

  stompClient.activate();
};

export const disconnectSocket = () => {
  if (stompClient) {
    stompClient.deactivate();
    console.log('🔌 WebSocket disconnected');
  }
};

export const subscribeTopic = (
  topic: string,
  callback: (message: IMessage) => void
): StompSubscription | null => {
  if (!stompClient || !stompClient.connected) {
    console.warn('⚠️ Cannot subscribe, socket not connected');
    return null;
  }
  return stompClient.subscribe(topic, callback);
};

export const sendMessage = (destination: string, body: any) => {
  if (!stompClient || !stompClient.connected) {
    console.warn('⚠️ Cannot send, socket not connected');
    return;
  }
  stompClient.publish({
    destination,
    body: JSON.stringify(body),
  });
};
