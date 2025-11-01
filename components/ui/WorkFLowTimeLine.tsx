import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

interface WorkflowTimelineProps {
  bookingStatus: string;
}

const WORKFLOW_STEPS = ['PENDING', 'IN_PROGRESS', 'NEGOTIATING', 'WORKING', 'PAYMENT', 'COMPLETED'] as const;

type WorkflowStep = (typeof WORKFLOW_STEPS)[number];

const STATUS_GROUP_MAP: Record<string, WorkflowStep | 'CANCELLED'> = {
  PENDING: 'PENDING',
  COMING: 'IN_PROGRESS',
  ARRIVED: 'IN_PROGRESS',
  NEGOTIATING: 'IN_PROGRESS',
  WORKING: 'WORKING',
  PAYING: 'PAYMENT',
  PAID: 'PAYMENT',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

const WORKFLOW_LABEL: Record<WorkflowStep | 'CANCELLED', string> = {
  PENDING: 'Chờ xử lý',
  IN_PROGRESS: 'Thợ đang đến',
  NEGOTIATING: 'Thỏa thuận',
  WORKING: 'Đang làm việc',
  PAYMENT: 'Thanh toán',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
};

const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({bookingStatus}) => {
  const group = STATUS_GROUP_MAP[bookingStatus] || 'PENDING';
  const currentIndex = WORKFLOW_STEPS.indexOf(group as WorkflowStep);

  return (
    <View style={{paddingHorizontal: 4}}>
      <Text
        style={{
          fontSize: 15,
          fontWeight: '600',
          marginBottom: 4,
          letterSpacing: 0.3,
        }}>
        Quy trình làm việc
      </Text>

      <View style={{marginLeft: 12}}>
        {WORKFLOW_STEPS.map((step, index) => {
          const label = WORKFLOW_LABEL[step];
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          const isLast = index === WORKFLOW_STEPS.length - 1;

          return (
            <View
              key={step}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: isLast ? 0 : 4,
              }}>
              {/* ==== Cột trái: timeline ==== */}
              <View style={{width: 34, alignItems: 'center', position: 'relative'}}>
                {/* Line */}
                {!isLast && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 24,
                      bottom: -24,
                      left: 16,
                      width: 3,
                      borderRadius: 3,
                      backgroundColor: isCompleted ? '#4CAF50' : '#E0E0E0',
                      opacity: isCompleted ? 0.9 : 0.4,
                    }}
                  />
                )}

                {/* Dot/Icon */}
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 14,
                    backgroundColor: isCompleted ? '#4CAF50' : isActive ? '#1565C0' : '#E0E0E0',
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: isActive ? '#1565C0' : '#000',
                    shadowOffset: {width: 0, height: 2},
                    shadowOpacity: isActive ? 0.3 : 0.05,
                    shadowRadius: 3,
                    elevation: isActive ? 4 : 1,
                    transform: [{scale: isActive ? 1.1 : 1}],
                  }}>
                  {isCompleted ? (
                    <MaterialIcons name='check' size={16} color='#fff' />
                  ) : isActive ? (
                    <MaterialIcons name='autorenew' size={18} color='#fff' />
                  ) : (
                    <MaterialIcons name='radio-button-unchecked' size={14} color='#bbb' />
                  )}
                </View>
              </View>

              {/* ==== Nội dung bên phải ==== */}
              <View
                style={{
                  backgroundColor: isActive
                    ? 'rgba(21, 101, 192, 0.08)'
                    : isCompleted
                      ? 'rgba(76, 175, 80, 0.05)'
                      : 'rgba(0,0,0,0.02)',
                  borderRadius: 10,
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  flex: 1,
                  borderLeftWidth: isActive ? 3 : 0,
                  borderLeftColor: isActive ? '#1565C0' : 'transparent',
                }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: isActive ? '700' : '500',
                    color: isCompleted ? '#2E7D32' : isActive ? '#1565C0' : '#555',
                  }}>
                  {label}
                </Text>
                {isActive && <Text style={{fontSize: 13, color: '#666', marginTop: 2}}>(Đang thực hiện bước này)</Text>}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default WorkflowTimeline;
