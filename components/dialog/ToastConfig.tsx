import { Text, TouchableOpacity, View } from 'react-native';
import { BaseToastProps } from 'react-native-toast-message';

export const toastConfig = {
  job: ({text1, text2, onPress}: BaseToastProps) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        marginTop: 36, // cách status bar
        marginHorizontal: 12,
        backgroundColor: '#2563eb', // xanh kiểu Zalo
        borderRadius: 8,
        padding: 12,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
      }}
      activeOpacity={0.8}>
      <Text style={{color: 'white', fontWeight: 'bold', fontSize: 15}}>{text1}</Text>
      {text2 ? <Text style={{color: 'white', fontSize: 12, marginTop: 4}}>{text2}</Text> : null}
    </TouchableOpacity>
  ),

  error: ({text1, text2, onPress}: BaseToastProps) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        marginTop: 0, // cách status bar
        marginHorizontal: 16,
        backgroundColor: '#dc2626', // đỏ đậm (red-600)
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 5,
        maxWidth: '90%',
      }}
      activeOpacity={0.85}>
      <View style={{flex: 1}}>
        <Text
          style={{
            color: 'white',
            fontWeight: '600',
            fontSize: 15,
            lineHeight: 20,
          }}>
          {text1}
        </Text>
        {text2 ? (
          <Text
            style={{
              color: '#fca5a5', // đỏ nhạt
              fontSize: 13,
              marginTop: 2,
              lineHeight: 18,
            }}>
            {text2}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  ),

  success: ({text1, text2, onPress}: BaseToastProps) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        marginTop: 0, // cách status bar (giống job)
        marginHorizontal: 16,
        backgroundColor: '#10b981', // xanh lá đậm (emerald-500)
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 5,
        maxWidth: '90%',
      }}
      activeOpacity={0.85}>
      <View style={{flex: 1}}>
        <Text
          style={{
            color: 'white',
            fontWeight: '600',
            fontSize: 15,
            lineHeight: 20,
          }}>
          {text1}
        </Text>
        {text2 ? (
          <Text
            style={{
              color: '#d1fae5', // xanh lá nhạt
              fontSize: 13,
              marginTop: 2,
              lineHeight: 18,
            }}>
            {text2}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  ),

  info: ({text1, text2, onPress}: BaseToastProps) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        marginTop: 0,
        marginHorizontal: 16,
        backgroundColor: '#3b82f6', // xanh dương nhẹ (blue-500)
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 5,
        maxWidth: '90%',
      }}
      activeOpacity={0.85}>
      <View style={{flex: 1}}>
        <Text
          style={{
            color: 'white',
            fontWeight: '600',
            fontSize: 15,
            lineHeight: 20,
          }}>
          {text1}
        </Text>

        {text2 ? (
          <Text
            style={{
              color: '#bfdbfe', // xanh nhạt (blue-200)
              fontSize: 13,
              marginTop: 2,
              lineHeight: 18,
            }}>
            {text2}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  ),
  warning: ({text1, text2, onPress}: BaseToastProps) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        marginTop: 0,
        marginHorizontal: 16,
        backgroundColor: '#f59e0b', // vàng cam (amber-500)
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 5,
        maxWidth: '90%',
      }}
      activeOpacity={0.85}>
      <View style={{flex: 1}}>
        <Text
          style={{
            color: 'white',
            fontWeight: '600',
            fontSize: 15,
            lineHeight: 20,
          }}>
          {text1}
        </Text>

        {text2 ? (
          <Text
            style={{
              color: '#fde68a', // vàng nhạt (amber-200)
              fontSize: 13,
              marginTop: 2,
              lineHeight: 18,
            }}>
            {text2}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  ),
};
