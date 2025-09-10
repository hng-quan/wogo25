import dayjs from 'dayjs';

export const validatePhoneNumber = (phone: string): string | null => {
  if (phone == null) return null;
  const phoneRegex = /^(0|\+84)(\d{9})$/;
  return phoneRegex.test(phone) ? '' : 'SĐT bắt đầu bằng 0 hoặc +84, theo sau là 9 chữ số';
};

export const validatePassword = (password: string): string | null => {
  if (password == null) return null;
  // Ít nhất 1 chữ, ít nhất 1 số, độ dài 6–20 ký tự
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,20}$/;
  return passwordRegex.test(password) ? '' : 'Mật khẩu phải từ 6-20 ký tự, gồm ít nhất 1 chữ cái và 1 số';
};

export const validateFullName = (fullName: string): string | null => {
  if (fullName == null) return null;
  return fullName.trim().length > 0 ? '' : 'Tên không được để trống';
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
