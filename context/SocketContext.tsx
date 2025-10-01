// src/context/SocketContext.tsx
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import React, { createContext, useContext, useEffect, useState } from 'react';

type SocketContextType = {
  client: Client | null;
  connected: boolean;
  subscribe: (topic: string, cb: (msg: IMessage) => void) => StompSubscription | null;
  send: (destination: string, body: any) => void;
};

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{userId: string; children: React.ReactNode}> = ({userId, children}) => {
  const [client, setClient] = useState<Client | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const stompClient = new Client({
      brokerURL: process.env.EXPO_PUBLIC_WS_URL,
      connectHeaders: {userId},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('✅ Connected to WS', userId);
        setConnected(true);
      },
      onDisconnect: () => {
        console.log('🔌 Disconnected WS', userId);
        setConnected(false);
      },
      onStompError: frame => {
        console.error('❌ STOMP error', frame.headers['message'], frame.body);
        setConnected(false);
      },
      onWebSocketClose: evt => {
        console.log('⚠️ WebSocket closed', {
          code: evt.code,
          reason: evt.reason,
          wasClean: evt.wasClean,
        });
        setConnected(false);
      },
      debug: str => {
        console.log('[STOMP DEBUG]', str);
      },
    });

    stompClient.activate();
    setClient(stompClient);

    return () => {
      stompClient.deactivate();
      console.log('🔌 Disconnected WS', userId);
    };
  }, [userId]);

  const subscribe = (topic: string, cb: (msg: IMessage) => void) => {
    if (!client || !client.connected) return null;
    return client.subscribe(topic, cb);
  };

  const send = (destination: string, body: any) => {
    if (!client || !client.connected) return;
    client.publish({destination, body: JSON.stringify(body)});
  };

  return <SocketContext.Provider value={{client, subscribe, send, connected}}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};
