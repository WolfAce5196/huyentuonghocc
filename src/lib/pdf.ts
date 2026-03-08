import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { UserData } from '../components/DownloadModal';

interface PDFResource {
  type: 'image' | 'text' | 'html';
  content: string;
  label?: string;
}

const formatMainContent = (mainContent: string) => {
  const lines = mainContent.split('\n');
  let html = '';
  let inTable = false;
  let tableRows: string[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmedLine = lines[i].trim();

    // Table detection
    if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      
      // Skip separator rows like |:---|:---:|
      if (trimmedLine.includes('---')) continue;

      const cells = trimmedLine
        .split('|')
        .map(cell => cell.trim())
        .filter((cell, index, array) => {
          // If the line starts with |, the first element will be empty
          if (index === 0 && trimmedLine.startsWith('|') && cell === '') return false;
          // If the line ends with |, the last element will be empty
          if (index === array.length - 1 && trimmedLine.endsWith('|') && cell === '') return false;
          return true;
        });
      
      if (cells.length > 0) {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      // End of table
      html += renderTableHtml(tableRows);
      inTable = false;
      tableRows = [];
    }

    if (trimmedLine.startsWith('# ')) {
      html += `<h2 style="color: #facc15; font-size: 28px; margin-top: 40px; margin-bottom: 20px; border-left: 5px solid #facc15; padding-left: 15px; text-transform: uppercase;">${trimmedLine.substring(2)}</h2>`;
    } else if (trimmedLine.startsWith('## ')) {
      html += `<h3 style="color: #facc15; font-size: 22px; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid rgba(250, 204, 21, 0.3); padding-bottom: 8px;">${trimmedLine.substring(3)}</h3>`;
    } else if (trimmedLine.startsWith('### ')) {
      html += `<h4 style="color: #facc15; font-size: 19px; margin-top: 25px; margin-bottom: 12px;">${trimmedLine.substring(4)}</h4>`;
    } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      html += `<div style="margin-left: 20px; margin-bottom: 10px; display: flex; align-items: flex-start;">
                <span style="color: #facc15; margin-right: 10px;">✦</span>
                <span>${trimmedLine.substring(2)}</span>
              </div>`;
    } else if (trimmedLine.match(/^\d+\./)) {
      html += `<div style="margin-left: 20px; margin-bottom: 10px; display: flex; align-items: flex-start;">
                <span style="color: #facc15; margin-right: 10px; font-weight: bold;">${trimmedLine.split('.')[0]}.</span>
                <span>${trimmedLine.substring(trimmedLine.indexOf('.') + 1).trim()}</span>
              </div>`;
    } else if (trimmedLine === '') {
      html += '<div style="height: 15px;"></div>';
    } else {
      // Handle bold
      let processedLine = trimmedLine.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #facc15;">$1</strong>');
      // Handle italic
      processedLine = processedLine.replace(/\*(.*?)\*/g, '<em style="color: #d1d5db;">$1</em>');
      html += `<p style="margin-bottom: 15px; text-indent: 0;">${processedLine}</p>`;
    }
  }

  // If file ends with a table
  if (inTable) {
    html += renderTableHtml(tableRows);
  }

  return html;
};

const renderTableHtml = (rows: string[][]) => {
  if (rows.length === 0) return '';
  
  let tableHtml = '<table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 1px solid rgba(250, 204, 21, 0.2); font-size: 14px;">';
  
  rows.forEach((row, rowIndex) => {
    tableHtml += `<tr style="${rowIndex === 0 ? 'background-color: rgba(250, 204, 21, 0.1);' : ''}">`;
    row.forEach(cell => {
      const cellStyle = `padding: 12px; border: 1px solid rgba(250, 204, 21, 0.2); ${rowIndex === 0 ? 'color: #facc15; font-weight: bold; text-transform: uppercase;' : 'color: #e5e7eb;'}`;
      tableHtml += `<${rowIndex === 0 ? 'th' : 'td'} style="${cellStyle}">${cell}</${rowIndex === 0 ? 'th' : 'td'}>`;
    });
    tableHtml += '</tr>';
  });
  
  tableHtml += '</table>';
  return tableHtml;
};

const createResourcesHtml = (resources: PDFResource[]) => {
  if (resources.length === 0) return '';
  return `
    <div style="margin-bottom: 60px; text-align: center;">
      <h3 style="color: #facc15; font-size: 22px; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 35px; border-bottom: 1px solid rgba(250, 204, 21, 0.2); padding-bottom: 15px; display: inline-block;">Tài nguyên luận giải</h3>
      <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 30px;">
        ${resources.map(res => {
          if (res.type === 'image') {
            return `
              <div style="text-align: center; max-width: 240px;">
                <div style="background-color: #1a1a24; padding: 10px; border-radius: 16px; border: 2px solid #facc15; box-shadow: 0 15px 40px rgba(0,0,0,0.6);">
                  <img src="${res.content}" style="width: 100%; height: auto; border-radius: 8px;" crossorigin="anonymous" />
                </div>
                ${res.label ? `<p style="color: #facc15; margin-top: 15px; font-size: 15px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">${res.label}</p>` : ''}
              </div>
            `;
          }
          return '';
        }).join('')}
      </div>
    </div>
  `;
};

const createPDFTemplate = (title: string, userData: UserData, resources: PDFResource[], mainContent: string, preRenderedContent?: string) => {
  const container = document.createElement('div');
  container.style.width = '850px';
  container.style.padding = '70px';
  container.style.backgroundColor = '#121218';
  container.style.color = '#e5e7eb';
  container.style.fontFamily = "'Times New Roman', serif";
  container.style.lineHeight = '1.7';
  container.style.border = '15px solid #1a1a24';
  container.style.boxSizing = 'border-box';

  // Header
  const header = `
    <div style="text-align: center; border-bottom: 3px double #facc15; padding-bottom: 35px; margin-bottom: 45px; position: relative;">
      <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-size: 24px; color: #facc15; opacity: 0.5;">✧ ✧ ✧</div>
      <h1 style="color: #facc15; margin: 0; font-size: 42px; text-transform: uppercase; letter-spacing: 6px; font-weight: 900; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">Huyền Tướng Học</h1>
      <p style="color: #facc15; margin: 12px 0 0; font-size: 16px; letter-spacing: 8px; opacity: 0.9; font-weight: 300;">NỀN TẢNG HUYỀN HỌC AI TỐI TÂN</p>
    </div>
  `;

  // User Info
  const userInfo = `
    <div style="margin-bottom: 45px; background: linear-gradient(135deg, #1a1a24 0%, #121218 100%); padding: 35px; border-radius: 24px; border: 1px solid rgba(250, 204, 21, 0.3); box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
      <h3 style="color: #facc15; margin-top: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 25px; border-left: 4px solid #facc15; padding-left: 15px;">Thông tin đương chủ</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <p style="margin: 0; font-size: 16px;"><strong style="color: #facc15;">Họ tên:</strong> ${userData.fullName || 'N/A'}</p>
        <p style="margin: 0; font-size: 16px;"><strong style="color: #facc15;">Số điện thoại:</strong> ${userData.phone || 'N/A'}</p>
        <p style="margin: 0; font-size: 16px;"><strong style="color: #facc15;">Email:</strong> ${userData.email || 'N/A'}</p>
        <p style="margin: 0; font-size: 16px;"><strong style="color: #facc15;">Thời khắc:</strong> ${new Date().toLocaleString('vi-VN')}</p>
      </div>
    </div>
  `;

  if (preRenderedContent) {
    const contentImg = `<img src="${preRenderedContent}" style="width: 100%; height: auto; border-radius: 16px; box-shadow: 0 20px 50px rgba(0,0,0,0.5);" />`;
    const footer = `
      <div style="text-align: center; border-top: 2px solid rgba(250, 204, 21, 0.2); padding-top: 35px; margin-top: 70px; color: #9ca3af; font-size: 14px; font-style: italic;">
        <p style="margin-bottom: 8px; color: #facc15; opacity: 0.8;">✧ Lời nhắn từ vũ trụ ✧</p>
        <p style="margin-bottom: 5px;">Bản quyền thuộc về Huyền Tướng Học. Thông tin chỉ mang tính chất tham khảo và chiêm nghiệm.</p>
        <p style="font-size: 12px; opacity: 0.6;">© ${new Date().getFullYear()} Huyền Tướng Học AI Platform</p>
      </div>
    `;
    container.innerHTML = header + userInfo + contentImg + footer;
    return container;
  }

  const resourcesHtml = createResourcesHtml(resources);
  const formattedContent = formatMainContent(mainContent);

  const content = `
    <div style="margin-bottom: 60px;">
      <h2 style="color: #facc15; text-align: center; font-size: 32px; text-transform: uppercase; letter-spacing: 4px; margin-bottom: 50px; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">${title}</h2>
      <div style="font-size: 18px; color: #f3f4f6; text-align: justify; padding: 0 20px;">
        ${formattedContent}
      </div>
    </div>
  `;

  const footer = `
    <div style="text-align: center; border-top: 2px solid rgba(250, 204, 21, 0.2); padding-top: 35px; margin-top: 70px; color: #9ca3af; font-size: 14px; font-style: italic;">
      <p style="margin-bottom: 8px; color: #facc15; opacity: 0.8;">✧ Lời nhắn từ vũ trụ ✧</p>
      <p style="margin-bottom: 5px;">Bản quyền thuộc về Huyền Tướng Học. Thông tin chỉ mang tính chất tham khảo và chiêm nghiệm.</p>
      <p style="font-size: 12px; opacity: 0.6;">© ${new Date().getFullYear()} Huyền Tướng Học AI Platform</p>
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
  preRenderedContent?: string
) => {
  const tempContainer = createPDFTemplate(title, userData, resources, mainContent, preRenderedContent);
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  tempContainer.style.top = '0';
  document.body.appendChild(tempContainer);

  // Wait for images to load
  const images = tempContainer.getElementsByTagName('img');
  const imagePromises = Array.from(images).map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise(resolve => {
      img.onload = resolve;
      img.onerror = resolve;
    });
  });
  await Promise.all(imagePromises);

  try {
    const canvas = await html2canvas(tempContainer, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#121218',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.9);
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
export const downloadTarotPDF = (userData: UserData, result: string, cards: { name: string, image: string }[], aiImage?: string, preRenderedContent?: string) => {
  const resources: PDFResource[] = cards.map(card => ({
    type: 'image',
    content: card.image,
    label: card.name
  }));
  if (aiImage) {
    resources.push({ type: 'image', content: aiImage, label: 'Hình ảnh linh hồn (AI)' });
  }
  return downloadPDF('Luận Giải Bài Tarot', 'tarot-luan-giai.pdf', userData, result, resources, preRenderedContent);
};

export const downloadNumerologyPDF = (userData: UserData, result: string, aiImage?: string, preRenderedContent?: string) => {
  const resources: PDFResource[] = [];
  if (aiImage) {
    resources.push({ type: 'image', content: aiImage, label: 'Bản đồ linh hồn (AI)' });
  }
  return downloadPDF('Luận Giải Thần Số Học', 'than-so-hoc.pdf', userData, result, resources, preRenderedContent);
};

export const downloadPhysiognomyPDF = (userData: UserData, result: string, userImage: string, aiImage?: string, preRenderedContent?: string) => {
  const resources: PDFResource[] = [
    { type: 'image', content: userImage, label: 'Hình ảnh phân tích' }
  ];
  if (aiImage) {
    resources.push({ type: 'image', content: aiImage, label: 'Hình ảnh linh hồn (AI)' });
  }
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

export const downloadDivinationPDF = (userData: UserData, result: string, coins?: string[], aiImage?: string, preRenderedContent?: string) => {
  const resources: PDFResource[] = [];
  if (coins && coins.length > 0) {
    coins.forEach((side, i) => {
      resources.push({
        type: 'image',
        content: side === 'head' 
          ? "https://img.icons8.com/fluency/240/sun.png" 
          : "https://img.icons8.com/fluency/240/full-moon.png",
        label: `Đồng xu ${i + 1}: ${side === 'head' ? 'Ngửa' : 'Sấp'}`
      });
    });
  }
  if (aiImage) {
    resources.push({ type: 'image', content: aiImage, label: 'Hình ảnh linh hồn (AI)' });
  }
  return downloadPDF('Luận Giải Gieo Quẻ Âm Dương', 'gieo-que.pdf', userData, result, resources, preRenderedContent);
};

export const preRenderPDFContent = async (
  title: string,
  mainContent: string,
  resources: PDFResource[] = []
): Promise<string> => {
  const container = document.createElement('div');
  container.style.width = '850px';
  container.style.padding = '70px';
  container.style.backgroundColor = '#121218';
  container.style.color = '#e5e7eb';
  container.style.fontFamily = "'Times New Roman', serif";
  container.style.lineHeight = '1.7';
  container.style.border = '15px solid #1a1a24';
  container.style.boxSizing = 'border-box';

  const resourcesHtml = createResourcesHtml(resources);
  const formattedContent = formatMainContent(mainContent);

  const content = `
    <div style="margin-bottom: 60px;">
      <h2 style="color: #facc15; text-align: center; font-size: 32px; text-transform: uppercase; letter-spacing: 4px; margin-bottom: 50px; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">${title}</h2>
      <div style="font-size: 18px; color: #f3f4f6; text-align: justify; padding: 0 20px;">
        ${formattedContent}
      </div>
    </div>
  `;

  container.innerHTML = resourcesHtml + content;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  document.body.appendChild(container);

  // Wait for images to load
  const images = container.getElementsByTagName('img');
  const imagePromises = Array.from(images).map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise(resolve => {
      img.onload = resolve;
      img.onerror = resolve;
    });
  });
  await Promise.all(imagePromises);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#121218',
      logging: false,
    });
    return canvas.toDataURL('image/jpeg', 0.9);
  } finally {
    document.body.removeChild(container);
  }
};
