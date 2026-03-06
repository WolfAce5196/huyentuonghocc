import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { UserData } from '../components/DownloadModal';

interface PDFResource {
  type: 'image' | 'text' | 'html';
  content: string;
  label?: string;
}

const createPDFTemplate = (title: string, userData: UserData, resources: PDFResource[], mainContent: string, preRenderedContent?: string) => {
  const container = document.createElement('div');
  container.style.width = '800px';
  container.style.padding = '60px';
  container.style.backgroundColor = '#0a0502';
  container.style.color = '#ffffff';
  container.style.fontFamily = "'Times New Roman', serif";
  container.style.lineHeight = '1.6';

  // Header
  const header = `
    <div style="text-align: center; border-bottom: 2px solid #facc15; padding-bottom: 30px; margin-bottom: 40px;">
      <h1 style="color: #facc15; margin: 0; font-size: 36px; text-transform: uppercase; letter-spacing: 4px;">Huyền Tướng Học</h1>
      <p style="color: #facc15; margin: 10px 0 0; font-size: 14px; letter-spacing: 6px; opacity: 0.8;">AI MYSTIC PLATFORM</p>
    </div>
  `;

  // User Info
  const userInfo = `
    <div style="margin-bottom: 40px; background-color: #1a1a1f; padding: 30px; border-radius: 20px; border: 1px solid rgba(250, 204, 21, 0.2);">
      <h3 style="color: #facc15; margin-top: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px;">Thông tin người nhận:</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <p style="margin: 0; font-size: 15px;"><strong>Họ tên:</strong> ${userData.fullName}</p>
        <p style="margin: 0; font-size: 15px;"><strong>Số điện thoại:</strong> ${userData.phone}</p>
        <p style="margin: 0; font-size: 15px;"><strong>Email:</strong> ${userData.email}</p>
        <p style="margin: 0; font-size: 15px;"><strong>Ngày tải:</strong> ${new Date().toLocaleString('vi-VN')}</p>
      </div>
    </div>
  `;

  if (preRenderedContent) {
    // If we have pre-rendered content, we just show the image
    const contentImg = `<img src="${preRenderedContent}" style="width: 100%; height: auto;" />`;
    const footer = `
      <div style="text-align: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 30px; margin-top: 60px; color: #9ca3af; font-size: 13px; font-style: italic;">
        <p style="margin-bottom: 5px;">Bản quyền thuộc về Huyền Tướng Học - Nền tảng huyền học AI hàng đầu.</p>
        <p>Thông tin chỉ mang tính chất tham khảo và chiêm nghiệm.</p>
      </div>
    `;
    container.innerHTML = header + userInfo + contentImg + footer;
    return container;
  }

  // Resources Section (The "Resources at the top" requirement)
  let resourcesHtml = '';
  if (resources.length > 0) {
    resourcesHtml = `
      <div style="margin-bottom: 50px; text-align: center;">
        <h3 style="color: #facc15; font-size: 20px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 30px; border-bottom: 1px solid rgba(250, 204, 21, 0.1); padding-bottom: 10px;">Tài nguyên luận giải</h3>
        <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 20px;">
          ${resources.map(res => {
            if (res.type === 'image') {
              return `
                <div style="text-align: center;">
                  <img src="${res.content}" style="max-width: 200px; max-height: 300px; border-radius: 10px; border: 2px solid #facc15; box-shadow: 0 10px 30px rgba(0,0,0,0.5);" />
                  ${res.label ? `<p style="color: #facc15; margin-top: 10px; font-size: 14px; font-weight: bold;">${res.label}</p>` : ''}
                </div>
              `;
            }
            return '';
          }).join('')}
        </div>
      </div>
    `;
  }

  // Main Content
  const content = `
    <div style="margin-bottom: 50px;">
      <h2 style="color: #facc15; text-align: center; font-size: 28px; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 40px;">${title}</h2>
      <div style="font-size: 16px; color: #e5e7eb; white-space: pre-wrap; text-align: justify;">
        ${mainContent}
      </div>
    </div>
  `;

  // Footer
  const footer = `
    <div style="text-align: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 30px; margin-top: 60px; color: #9ca3af; font-size: 13px; font-style: italic;">
      <p style="margin-bottom: 5px;">Bản quyền thuộc về Huyền Tướng Học - Nền tảng huyền học AI hàng đầu.</p>
      <p>Thông tin chỉ mang tính chất tham khảo và chiêm nghiệm.</p>
    </div>
  `;

  container.innerHTML = header + userInfo + resourcesHtml + content + footer;
  return container;
};

export const downloadPDF = async (
  title: string,
  filename: string,
  userData: UserData,
  mainContent: string,
  resources: PDFResource[] = [],
  preRenderedContent?: string // Optional pre-rendered image data
) => {
  // If we have pre-rendered content, we can skip html2canvas for the main part
  // However, we still need to combine it with the header and footer
  // To keep it simple and fast, we'll still use the template but if preRenderedContent is provided,
  // we can use it directly in the template to avoid re-rendering complex parts.
  
  const tempContainer = createPDFTemplate(title, userData, resources, mainContent, preRenderedContent);
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  tempContainer.style.top = '0';
  document.body.appendChild(tempContainer);

  try {
    const canvas = await html2canvas(tempContainer, {
      scale: 1.5, // Slightly lower scale for speed, still looks good
      useCORS: true,
      backgroundColor: '#0a0502',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.8); // JPEG is faster and smaller than PNG
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    let heightLeft = pdfHeight;
    let position = 0;
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  } catch (error) {
    console.error('PDF generation failed:', error);
  } finally {
    document.body.removeChild(tempContainer);
  }
};

// Specialized functions for each section
export const downloadTarotPDF = (userData: UserData, result: string, cards: { name: string, image: string }[], preRenderedContent?: string) => {
  const resources: PDFResource[] = cards.map(card => ({
    type: 'image',
    content: card.image,
    label: card.name
  }));
  return downloadPDF('Luận Giải Bài Tarot', 'tarot-luan-giai.pdf', userData, result, resources, preRenderedContent);
};

export const downloadNumerologyPDF = (userData: UserData, result: string, preRenderedContent?: string) => {
  return downloadPDF('Luận Giải Thần Số Học', 'than-so-hoc.pdf', userData, result, [], preRenderedContent);
};

export const downloadPhysiognomyPDF = (userData: UserData, result: string, userImage: string, preRenderedContent?: string) => {
  const resources: PDFResource[] = [
    { type: 'image', content: userImage, label: 'Hình ảnh phân tích' }
  ];
  return downloadPDF('Luận Giải Nhân Tướng Học', 'nhan-tuong-hoc.pdf', userData, result, resources, preRenderedContent);
};

export const downloadIChingPDF = (userData: UserData, result: string, hexImage: string, aiImage?: string, preRenderedContent?: string) => {
  const resources: PDFResource[] = [
    { type: 'image', content: hexImage, label: 'Hình tượng quẻ' }
  ];
  if (aiImage) {
    resources.push({ type: 'image', content: aiImage, label: 'Hình ảnh AI tạo bởi quẻ' });
  }
  return downloadPDF('Luận Giải Gieo Quẻ Kinh Dịch', 'kinh-dich.pdf', userData, result, resources, preRenderedContent);
};

export const downloadDivinationPDF = (userData: UserData, result: string, preRenderedContent?: string) => {
  return downloadPDF('Luận Giải Gieo Quẻ Âm Dương', 'gieo-que.pdf', userData, result, [], preRenderedContent);
};

export const preRenderPDFContent = async (
  title: string,
  mainContent: string,
  resources: PDFResource[] = []
): Promise<string> => {
  // Create a template without user info for pre-rendering
  const container = document.createElement('div');
  container.style.width = '800px';
  container.style.padding = '60px';
  container.style.backgroundColor = '#0a0502';
  container.style.color = '#ffffff';
  container.style.fontFamily = "'Times New Roman', serif";
  container.style.lineHeight = '1.6';

  let resourcesHtml = '';
  if (resources.length > 0) {
    resourcesHtml = `
      <div style="margin-bottom: 50px; text-align: center;">
        <h3 style="color: #facc15; font-size: 20px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 30px; border-bottom: 1px solid rgba(250, 204, 21, 0.1); padding-bottom: 10px;">Tài nguyên luận giải</h3>
        <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 20px;">
          ${resources.map(res => {
            if (res.type === 'image') {
              return `
                <div style="text-align: center;">
                  <img src="${res.content}" style="max-width: 200px; max-height: 300px; border-radius: 10px; border: 2px solid #facc15; box-shadow: 0 10px 30px rgba(0,0,0,0.5);" />
                  ${res.label ? `<p style="color: #facc15; margin-top: 10px; font-size: 14px; font-weight: bold;">${res.label}</p>` : ''}
                </div>
              `;
            }
            return '';
          }).join('')}
        </div>
      </div>
    `;
  }

  const content = `
    <div style="margin-bottom: 50px;">
      <h2 style="color: #facc15; text-align: center; font-size: 28px; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 40px;">${title}</h2>
      <div style="font-size: 16px; color: #e5e7eb; white-space: pre-wrap; text-align: justify;">
        ${mainContent}
      </div>
    </div>
  `;

  container.innerHTML = resourcesHtml + content;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 1.5,
      useCORS: true,
      backgroundColor: '#0a0502',
      logging: false,
    });
    return canvas.toDataURL('image/jpeg', 0.8);
  } finally {
    document.body.removeChild(container);
  }
};
