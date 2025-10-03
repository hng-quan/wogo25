// context/StatusFindJobContext.tsx
import { jsonGettAPI } from '@/lib/apiService';
import { IMessage, StompSubscription } from '@stomp/stompjs';
import { router } from 'expo-router';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import Toast from 'react-native-toast-message';
import { useRole } from './RoleContext';
import { useSocket } from './SocketContext';

type Service = {id: number; serviceName: string};

type StatusFindJobContextType = {
  finding: boolean;
  setFinding: (value: boolean) => void;
  showAlert: boolean;
  toggleFinding: () => void;
  toggleAlert: () => void;
  setShowAlert: (value: boolean) => void;
  jobTrigger: number;
};

const StatusFindJobContext = createContext<StatusFindJobContextType | undefined>(undefined);

export const StatusFindJobProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const {subscribe, connected} = useSocket();
  const [finding, setFinding] = useState(false);
  const [showAlert, setShowAlert] = useState(true);
  const [jobTrigger, setJobTrigger] = useState(0);
  const subscriptionsRef = useRef<StompSubscription[]>([]);
  const showAlertRef = useRef(showAlert);
  const {role} = useRole();

  const toggleAlert = () => setShowAlert(prev => !prev);

  useEffect(() => {
    showAlertRef.current = showAlert;
    // console.log('showAlert =:', showAlert);
  }, [showAlert]);

  useEffect(() => {
    console.log('role', role);
  }, [role]);
  //   useEffect(() => {
  //     console.log('connected =:', connected);
  //   }, [connected]);

  //   useEffect(() => {
  //     console.log('finding =:', finding);
  //   }, [finding]);

  const toggleFinding = async () => {
    setFinding(prev => !prev);
  };

  useEffect(() => {
    if (!finding) {
      console.log('❌ Đã tắt trạng thái tìm việc');
      return;
    }
    if (!connected) return;

    // 🔒 chỉ worker mới lắng nghe
    if (role !== 'worker') {
      console.log('👤 Role hiện tại không phải worker, bỏ qua subscribe.');
      return;
    }

    const subscribeServices = async () => {
      try {
        const res = await jsonGettAPI('/workers/services-of-worker');
        const services: Service[] = [];

        res.result.forEach((item: any) => {
          if (item.service.parentService) {
            services.push({
              id: item.service.parentService.id,
              serviceName: item.service.parentService.serviceName,
            });
          }
          if (item.service.childServices?.length) {
            item.service.childServices.forEach((c: any) => services.push({id: c.id, serviceName: c.serviceName}));
          }
        });

        console.log('✅ Dịch vụ cần lắng nghe:', services);

        services.forEach(s => {
          const sub = subscribe(`/topic/new-job/${s.id}`, (msg: IMessage) => {
            const job = JSON.parse(msg.body);
            console.log(`📥 Job mới cho dịch vụ [${s.serviceName}]`, job);

            setJobTrigger(prev => (prev >= 1_000_000 ? 1 : prev + 1));

            console.log('showAlertRef.current', showAlertRef.current);
            if (showAlertRef.current) {
              Toast.show({
                type: 'job',
                text1: 'Có job mới!',
                text2: `Khách vừa tạo job thuộc dịch vụ ${s.serviceName}`,
                autoHide: true,
                visibilityTime: 3000,
                onPress: () => {
                  router.push('/find-job');
                },
              });
            }
          });
          subscriptionsRef.current.push(sub!);
        });
      } catch (err) {
        console.error('❌ Lỗi khi lấy dịch vụ:', err);
      }
    };

    subscribeServices();

    return () => {
      console.log('🧹 Hủy tất cả subscription khi tắt tìm việc hoặc ngắt kết nối');
      subscriptionsRef.current.forEach(sub => sub.unsubscribe());
      subscriptionsRef.current = [];
    };
  }, [finding, connected, role]);

  return (
    <StatusFindJobContext.Provider
      value={{
        finding,
        showAlert,
        toggleFinding,
        toggleAlert,
        setShowAlert,
        jobTrigger,
        setFinding,
      }}>
      {children}
    </StatusFindJobContext.Provider>
  );
};

export const useStatusFindJob = () => {
  const ctx = useContext(StatusFindJobContext);
  if (!ctx) throw new Error('useStatusFindJob must be used within StatusFindJobProvider');
  return ctx;
};
