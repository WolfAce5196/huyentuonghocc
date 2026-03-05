import { UserData } from '../components/DownloadModal';

export const downloadAsFile = (content: string, filename: string, userData: UserData) => {
  const header = `
=========================================
HUYỀN TƯỚNG HỌC - AI MYSTIC PLATFORM
=========================================
THÔNG TIN NGƯỜI NHẬN:
Họ tên: ${userData.fullName}
Số điện thoại: ${userData.phone}
Email: ${userData.email}
Ngày tải: ${new Date().toLocaleString('vi-VN')}
=========================================

`;
  
  const fullContent = header + content;
  const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
