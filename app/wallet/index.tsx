import Appbar from '@/components/layout/Appbar';
import QRCodeModal from '@/components/modal/QRCodeModal';
import HelpText from '@/components/text/HelpText';
import { jsonGettAPI, jsonPostAPI } from '@/lib/apiService';
import { Colors } from '@/lib/common';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import Toast from 'react-native-toast-message';

const Wallet = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<'revenue' | 'expense' | null>(null);
  const [actionType, setActionType] = useState<'deposit' | 'withdraw' | null>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrLink, setQrLink] = useState<string | null>(null);
  const depositIdRef = useRef<number | null>(null);
  const pollingRef = useRef<any>(null);
  const pollingAttemptsRef = useRef<number>(0);
  const [refreshing, setRefreshing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [wallets, setWallets] = useState({
    revenue: 0,
    expense: 0,
  });
  const [form, setForm] = useState({
    bankAccountNumber: '',
    bankName: '',
    amount: '',
  });
  const [hasErrors, setHasErrors] = useState({
    bankAccountNumber: null,
    bankName: null,
    amount: null,
  } as {bankAccountNumber: any; bankName: any; amount: any});

  const BANKS = [
    {key: 'VIETCOMBANK', label: 'Vietcombank'},
    {key: 'TECHCOMBANK', label: 'Techcombank'},
    {key: 'BIDV', label: 'BIDV'},
    {key: 'AGRIBANK', label: 'Agribank'},
    {key: 'VPBANK', label: 'VPBank'},
    {key: 'ACB', label: 'ACB'},
    {key: 'SACOMBANK', label: 'Sacombank'},
    {key: 'MBBANK', label: 'MBBank'},
    {key: 'EXIMBANK', label: 'Eximbank'},
    {key: 'OCB', label: 'OCB'},
    {key: 'TPBANK', label: 'TPBank'},
    {key: 'HDBANK', label: 'HDBank'},
    {key: 'SHB', label: 'SHB'},
    {key: 'SEAABANK', label: 'SeaABank'},
    {key: 'ABBANK', label: 'ABBANK'},
    {key: 'IVB', label: 'IVB'},
    {key: 'NAMABANK', label: 'Nam A Bank'},
    {key: 'PGBANK', label: 'PGBank'},
    {key: 'SCB', label: 'SCB'},
    {key: 'VIB', label: 'VIB'},
    {key: 'MSBANK', label: 'MSBank'},
  ];

  const handleAction = () => {
    // console.log(`${actionType === 'deposit' ? 'Nạp' : 'Rút'} tiền từ`, selectedWallet, form);
    if (actionType === 'deposit') {
      const amount = Number(form.amount || 0);
      if (!amount || amount <= 0) {
        setHasErrors(prev => ({...prev, amount: 'Vui lòng nhập số tiền hợp lệ'}));
        return;
      }

      // gọi API tạo mã QR
      setModalVisible(false);
      createDepositRequest(amount);
      return;
    }

    // Nếu là rút tiền -> gọi API rút
    let flag = false;
    if (actionType === 'withdraw') {
      const amount = Number(form.amount || 0);
      if (!amount || amount <= 0) {
        setHasErrors(prev => ({...prev, amount: 'Vui lòng nhập số tiền hợp lệ'}));
        flag = true;
      } else {
        setHasErrors(prev => ({...prev, amount: null}));
      }
      if (!form.bankAccountNumber) {
        setHasErrors(prev => ({...prev, bankAccountNumber: 'Vui lòng nhập số tài khoản'}));
        flag = true;
      } else {
        setHasErrors(prev => ({...prev, bankAccountNumber: null}));
      }
      if (!form.bankName) {
        setHasErrors(prev => ({...prev, bankName: 'Vui lòng chọn ngân hàng'}));
        flag = true;
      } else {
        setHasErrors(prev => ({...prev, bankName: null}));
      }
      if (!flag) {
        console.log('Rút tiền', form);
        createWithdrawalRequest({
          bankAccountNumber: form.bankAccountNumber,
          bankName: form.bankName,
          amount: amount,
        });
        // default reset
        setForm({bankAccountNumber: '', bankName: '', amount: ''});
        setModalVisible(false);
      }
      return;
    }
  };

  const createWithdrawalRequest = async (body: {bankAccountNumber: string; bankName: string; amount: number}) => {
    jsonPostAPI(
      '/transactions/withdrawals',
      body,
      (data: any) => {
        const res = data?.result;
        console.log('Create withdrawal response', res);
        if (res) {
          // show success details
          setModalVisible(false);
          setForm({bankAccountNumber: '', bankName: '', amount: ''});
          fetchRevenueData();
          fetchExpensesData();
          const code = res.transactionCode || '';
          Toast.show({
            type: 'success',
            text1: 'Yêu cầu rút tiền đã tạo thành công',
            text2: code ? `Mã giao dịch: ${code}` : undefined,
          });
        }
      },
      undefined,
      (err: any) => {
        console.log('Create withdrawal error', err);
      },
      true,
    );
  };

  const clearPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    pollingAttemptsRef.current = 0;
    depositIdRef.current = null;
  };

  const createDepositRequest = async (amount: number) => {
    console.log('Creating deposit request, amount=', amount);

    jsonPostAPI(
      '/transactions/deposits',
      {amount},
      (data: any) => {
        const res = data?.result;
        if (res) {
          setQrLink(res.qrCodeUrl || null);
          depositIdRef.current = res.depositId || null;
          setQrModalVisible(true);
          // start polling
          console.log('Starting deposit verify polling for depositId=', res.depositId);
          startVerifyPolling(res.depositId);
        }
      },
      (loading: boolean) => {
        // optional loading handler
      },
      (err: any) => {
        console.log('Create deposit error', err);
      },
      true,
    );
  };

  const startVerifyPolling = (depositId: number) => {
    clearPolling();
    pollingAttemptsRef.current = 0;

    pollingRef.current = setInterval(() => {
      pollingAttemptsRef.current += 1;

      // stop after 5 minutes -> 300s / 5s = 60 attempts
      if (pollingAttemptsRef.current > 60) {
        clearPolling();
        setQrModalVisible(false);
        setQrLink(null);
        Toast.show({type: 'error', text1: 'Thời gian xác thực đã hết. Vui lòng thử lại.'});
        return;
      }
      console.log('Polling deposit verify, attempt #', pollingAttemptsRef.current);

      jsonPostAPI(
        `/transactions/deposits/verify/${depositId}`,
        {},
        (data: any) => {
          console.log('Deposit verify polling result=', data);
          const success = data?.result === true;

          if (success) {
            clearPolling();
            setQrModalVisible(false);
            setQrLink(null);
            // refresh balances
            fetchRevenueData();
            fetchExpensesData();
            Toast.show({type: 'success', text1: 'Nạp tiền thành công'});
          }
        },
        undefined,
        (err: any) => {},
        false,
      );
    }, 5000);
  };

  const openModal = (wallet: 'revenue' | 'expense', type: 'deposit' | 'withdraw') => {
    setSelectedWallet(wallet);
    setActionType(type);
    setModalVisible(true);
  };

  // ==================

  useEffect(() => {
    fetchRevenueData();
    fetchExpensesData();
  }, []);

  // cleanup polling on unmount
  useEffect(() => {
    return () => {
      clearPolling();
    };
  }, []);

  const fetchRevenueData = async () => {
    jsonGettAPI('/transactions/walletRevenueBalance', {}, payload => {
      setWallets(prev => ({...prev, revenue: payload?.result || 0}));
    });
  };

  const fetchExpensesData = async () => {
    jsonGettAPI('/transactions/walletExpenseBalance', {}, payload => {
      setWallets(prev => ({...prev, expense: payload?.result || 0}));
    });
  };

  return (
    <View style={{flex: 1, backgroundColor: Colors.background}}>
      <Appbar title='Thông tin ví thanh toán' />

      {/* Buttons to navigate to history screens */}
      <View style={styles.historyButtonsRow}>
        <Pressable
          onPress={() => router.push('/wallet/deposits-history')}
          onHoverIn={() => Platform.OS === 'web' && setHovered(true)}
          onHoverOut={() => Platform.OS === 'web' && setHovered(false)}
          style={({pressed}) => [
            styles.historyButton,
            hovered && styles.historyButtonHover,
            pressed && {opacity: 0.8},
          ]}
        >
          <Text style={[styles.historyButtonText, {color: '#10B981', borderColor: '#10B981', borderWidth: 1, padding: 12, borderRadius: 4}]}>Lịch sử nạp tiền</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/wallet/withdrawals-history')}
          onHoverIn={() => Platform.OS === 'web' && setHovered(true)}
          onHoverOut={() => Platform.OS === 'web' && setHovered(false)}
          style={({pressed}) => [
            styles.historyButton,
            styles.historyButtonOutline,
            hovered && styles.historyButtonOutlineHover,
            pressed && {opacity: 0.8},
          ]}
        >
          <Text style={[styles.historyButtonText, {color: '#1565C0', borderColor: '#1565C0', borderWidth: 1, padding: 12, borderRadius: 4}]}>Lịch sử rút tiền</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await Promise.all([fetchRevenueData(), fetchExpensesData()]);
              setRefreshing(false);
            }}
            colors={['#1565C0']}
            tintColor='#1565C0'
          />
        }>
        {/* === Ví Doanh thu === */}
        <View style={[styles.card, {backgroundColor: '#10B981'}]}>
          <Text style={styles.cardTitle}>Ví doanh thu</Text>
          <Text style={styles.cardAmount}>{wallets.revenue.toLocaleString()} đ</Text>
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => openModal('revenue', 'withdraw')}>
              <Ionicons name='arrow-down-circle-outline' size={18} color='#fff' />
              <Text style={styles.actionText}>Rút tiền</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* === Ví Chi tiêu === */}
        <View style={[styles.card, {backgroundColor: '#1565C0'}]}>
          <Text style={styles.cardTitle}>Ví chi tiêu</Text>
          <Text style={styles.cardAmount}>{wallets.expense.toLocaleString()} đ</Text>
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => openModal('expense', 'deposit')}>
              <Ionicons name='add-circle-outline' size={18} color='#fff' />
              <Text style={styles.actionText}>Nạp tiền</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* === Modal Nạp/Rút tiền === */}
      <Modal visible={modalVisible} transparent animationType='fade' onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {actionType === 'deposit' ? 'Nạp tiền vào' : 'Rút tiền từ'}{' '}
                {selectedWallet === 'revenue' ? 'Ví doanh thu' : 'Ví chi tiêu'}
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name='close' size={22} color='#333' />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{paddingBottom: 20}}>
              <View style={styles.form}>
                {actionType === 'withdraw' && (
                  <>
                    <Text style={styles.label}>Số tài khoản</Text>
                    <TextInput
                      style={styles.input}
                      placeholder='Nhập số tài khoản'
                      keyboardType='numeric'
                      value={form.bankAccountNumber}
                      onChangeText={text => setForm({...form, bankAccountNumber: text})}
                    />
                    <HelpText type='error' visible={hasErrors.bankAccountNumber !== null}>
                      {hasErrors.bankAccountNumber}
                    </HelpText>

                    <View style={{marginBottom: 16, gap: 10}}>
                      <Text style={styles.label}>Ngân hàng</Text>
                      <RNPickerSelect
                        onValueChange={value => {
                          setForm({...form, bankName: value});
                        }}
                        items={BANKS.map(bank => ({
                          label: bank.label,
                          value: bank.key,
                        }))}
                        style={{
                          inputIOS: {
                            fontSize: 16,
                            paddingVertical: 10,
                            paddingHorizontal: 12,
                            borderWidth: 1,
                            borderColor: '#ddd',
                            borderRadius: 8,
                            color: 'black',
                            paddingRight: 30, // Đảm bảo text không đè lên icon
                          },
                          inputAndroid: {
                            fontSize: 16,
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            borderWidth: 1,
                            borderColor: '#ddd',
                            borderRadius: 8,
                            color: 'black',
                            paddingRight: 30, // Đảm bảo text không đè lên icon
                          },
                          iconContainer: {
                            top: 10,
                            right: 12,
                          },
                          placeholder: {
                            color: '#9EA0A4',
                          },
                        }}
                        value={form.bankName}
                        placeholder={{label: 'Chọn ngân hàng...', value: null}}
                        useNativeAndroidPickerStyle={false}
                        Icon={() => {
                          return <Ionicons name='chevron-down' size={20} color='gray' />;
                        }}
                      />
                      <HelpText type='error' visible={hasErrors.bankName !== null}>
                        {hasErrors.bankName}
                      </HelpText>
                    </View>
                  </>
                )}

                <Text style={styles.label}>Số tiền</Text>
                <TextInput
                  style={styles.input}
                  placeholder='Nhập số tiền'
                  keyboardType='numeric'
                  value={form.amount}
                  onChangeText={text => setForm({...form, amount: text})}
                />

                <HelpText type='error' visible={hasErrors.amount !== null}>
                  {hasErrors.amount}
                </HelpText>

                <TouchableOpacity
                  style={[styles.submitBtn, {backgroundColor: actionType === 'deposit' ? '#10B981' : '#1565C0'}]}
                  onPress={handleAction}>
                  <Text style={styles.submitText}>
                    {actionType === 'deposit' ? 'Xác nhận nạp tiền' : 'Xác nhận rút tiền'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* QR code modal shown after creating deposit */}
      <QRCodeModal
        visible={qrModalVisible}
        onClose={() => {
          setQrModalVisible(false);
          clearPolling();
        }}
        qrLink={qrLink}
        description={depositIdRef.current ? `Mã nạp tiền (ID: ${depositIdRef.current})` : undefined}
      />
    </View>
  );
};

export default Wallet;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  card: {
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  cardAmount: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 10,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    flexShrink: 1,
  },
  form: {
    gap: 10,
  },
  label: {
    fontSize: 14,
    color: '#555',
  },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  submitBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  historyButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 12,
  },
  historyButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#10B981',
  },
  historyButtonHover: {
    transform: [{scale: 1.01}],
  },
  historyButtonText: {
    fontWeight: '600',
  },
  historyButtonOutline: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1565C0',
  },
  historyButtonOutlineHover: {
    transform: [{scale: 1.01}],
    backgroundColor: '#F1F8FF',
  },

});
