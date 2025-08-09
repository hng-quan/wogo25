import { getItem, setItem } from "@/lib/storage";
import { router } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";

const LoginScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState("0373644375");
  const [password, setPassword] = useState("");
  const [hidePassword, setHidePassword] = useState(true);

   const _handleLogin = async () => {
    console.log('Phone Number:', phoneNumber);
    console.log('Password:', password);
    // call login API
    // Server check login information
    // If login successful
    // Server return tokens + user information
    // Save tokens and user information into secure storage
    setItem('user', { id: 'u1', name: 'Hồng Quân', phone: phoneNumber });
    console.log(await getItem('user'));

    // Navigate to home screen
    router.replace('/home');
    
  };
  return (
    <View className="p-4">
      <Text>Đăng nhập</Text>
      <TextInput label="Số điện thoại" value={phoneNumber} onChangeText={setPhoneNumber} />
      <TextInput
        label="Mật khẩu"
        secureTextEntry={hidePassword}
        right={
          <TextInput.Icon
            icon={`${hidePassword ? "eye-off" : "eye"}`}
            onPress={() => setHidePassword(!hidePassword)}
          />
        }
        value={password}
        onChangeText={setPassword}
      />
      <Button mode="contained" onPress={_handleLogin}>Đăng nhập</Button>
    </View>
  );
};

export default LoginScreen;
