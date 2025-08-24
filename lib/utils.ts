export const validatePhoneNumber = (phone: string) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
};

export const validatePassword = (password: string) => {
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/; // Ít nhất 8 ký tự, bao gồm chữ cái và số
  return passwordRegex.test(password);
};

export const validateFullName = (fullName: string) => {
  return fullName.trim().length > 0; // Kiểm tra tên đầy đủ
};
