import dayjs from 'dayjs';

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

export function generateDocumentName(serviceName: string, prefix = 'WORKER_LICENSE') {
  const date = dayjs().format('YYYYMMDD'); // 20250830
  // Chuyển tên dịch vụ thành UPPERCASE, bỏ dấu và khoảng trắng
  const normalizedService = serviceName
    .normalize('NFD') // bỏ dấu tiếng Việt
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-') // thay khoảng trắng bằng dấu -
    .toUpperCase();

  return `${prefix}_${normalizedService}_${date}`;
}
