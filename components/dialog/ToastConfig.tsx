import { Text, TouchableOpacity } from "react-native";
import { BaseToastProps } from "react-native-toast-message";

export const toastConfig = {
  job: ({ text1, text2, onPress }: BaseToastProps) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        marginTop: 36, // cách status bar
        marginHorizontal: 12,
        backgroundColor: "#2563eb", // xanh kiểu Zalo
        borderRadius: 8,
        padding: 12,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
      }}
      activeOpacity={0.8}
    >
      <Text style={{ color: "white", fontWeight: "bold", fontSize: 15 }}>
        {text1}
      </Text>
      {text2 ? (
        <Text style={{ color: "white", fontSize: 12, marginTop: 4 }}>
          {text2}
        </Text>
      ) : null}
    </TouchableOpacity>
  ),
};
