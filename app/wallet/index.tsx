import Appbar from '@/components/layout/Appbar';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const Wallet = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<'revenue' | 'expense' | null>(null);
  const [actionType, setActionType] = useState<'deposit' | 'withdraw' | null>(null);

  const [form, setForm] = useState({
    bankAccountNumber: '',
    bankName: '',
    amount: '',
  });

  const [wallets, setWallets] = useState({
    revenue: 12500000,
    expense: 3500000,
  });

  const handleAction = () => {
    console.log(`${actionType === 'deposit' ? 'Nạp' : 'Rút'} tiền từ`, selectedWallet, form);
    // 💡 Tại đây bạn có thể gọi API tương ứng, ví dụ:
    // jsonPostAPI(`/transactions/${actionType}`, { walletType: selectedWallet, ...form })

    // reset form
    setForm({ bankAccountNumber: '', bankName: '', amount: '' });
    setModalVisible(false);
  };

  const openModal = (wallet: 'revenue' | 'expense', type: 'deposit' | 'withdraw') => {
    setSelectedWallet(wallet);
    setActionType(type);
    setModalVisible(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F2F2' }}>
      <Appbar title="Thông tin ví thanh toán" />

      <ScrollView contentContainerStyle={styles.container}>
        {/* === Ví Doanh thu === */}
        <View style={[styles.card, { backgroundColor: '#1565C0' }]}>
          <Text style={styles.cardTitle}>Ví doanh thu</Text>
          <Text style={styles.cardAmount}>{wallets.revenue.toLocaleString()} đ</Text>
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => openModal('revenue', 'deposit')}>
              <Ionicons name="add-circle-outline" size={18} color="#fff" />
              <Text style={styles.actionText}>Nạp tiền</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => openModal('revenue', 'withdraw')}>
              <Ionicons name="arrow-down-circle-outline" size={18} color="#fff" />
              <Text style={styles.actionText}>Rút tiền</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* === Ví Chi tiêu === */}
        <View style={[styles.card, { backgroundColor: '#10B981' }]}>
          <Text style={styles.cardTitle}>Ví chi tiêu</Text>
          <Text style={styles.cardAmount}>{wallets.expense.toLocaleString()} đ</Text>
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => openModal('expense', 'deposit')}>
              <Ionicons name="add-circle-outline" size={18} color="#fff" />
              <Text style={styles.actionText}>Nạp tiền</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => openModal('expense', 'withdraw')}>
              <Ionicons name="arrow-down-circle-outline" size={18} color="#fff" />
              <Text style={styles.actionText}>Rút tiền</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* === Modal Nạp/Rút tiền === */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {actionType === 'deposit' ? 'Nạp tiền vào' : 'Rút tiền từ'}{' '}
                {selectedWallet === 'revenue' ? 'Ví doanh thu' : 'Ví chi tiêu'}
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color="#333" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              <View style={styles.form}>
                <Text style={styles.label}>Số tài khoản</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập số tài khoản"
                  keyboardType="numeric"
                  value={form.bankAccountNumber}
                  onChangeText={(text) => setForm({ ...form, bankAccountNumber: text })}
                />

                <Text style={styles.label}>Ngân hàng</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập tên ngân hàng"
                  value={form.bankName}
                  onChangeText={(text) => setForm({ ...form, bankName: text })}
                />

                <Text style={styles.label}>Số tiền</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập số tiền"
                  keyboardType="numeric"
                  value={form.amount}
                  onChangeText={(text) => setForm({ ...form, amount: text })}
                />

                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    { backgroundColor: actionType === 'deposit' ? '#10B981' : '#1565C0' },
                  ]}
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
    shadowOffset: { width: 0, height: 2 },
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
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
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
});
