# 📱 Hướng dẫn chạy ứng dụng React Native với Expo với emulator/thiết bị thật

Mở Command Prompt hoặc PowerShell.
Gõ: ipconfig
Tìm dòng IPv4 Address (ví dụ: 192.168.1.5).
Copy địa chỉ này.
Trong thư mục gốc của dự án, tạo file .env và dán nội dung sau:
EXPO_PUBLIC_API_URL=http://[IPv4]:8080/api/v1/
Thay [IPv4] bằng địa chỉ IPv4 bạn vừa copy.
EXPO_PUBLIC_API_URL=http://192.168.1.5:8080/api/v1/