import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { UserData } from '../components/DownloadModal';

export const downloadAsPDF = async (elementId: string, filename: string, userData: UserData) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Element not found:', elementId);
    return;
  }

  try {
    // Create a temporary container for the PDF content to ensure it looks professional
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '800px'; // Standard width for A4
    tempContainer.style.padding = '40px';
    tempContainer.style.backgroundColor = '#0a0502'; // Match app background
    tempContainer.style.color = '#ffffff';
    tempContainer.style.fontFamily = 'serif';

    // Header
    const header = document.createElement('div');
    header.innerHTML = `
      <div style="text-align: center; border-bottom: 2px solid #facc15; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="color: #facc15; margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 2px; font-family: serif;">Huyền Tướng Học</h1>
        <p style="color: #facc15; margin: 5px 0 0; font-size: 12px; letter-spacing: 4px; opacity: 0.8;">AI MYSTIC PLATFORM</p>
      </div>
      <div style="margin-bottom: 30px; background-color: #1a1a1f; padding: 20px; border-radius: 10px; border: 1px solid #facc15;">
        <h3 style="color: #facc15; margin-top: 0; font-size: 16px; font-family: serif;">Thông tin người nhận:</h3>
        <p style="margin: 5px 0; font-size: 14px; color: #ffffff;"><strong>Họ tên:</strong> ${userData.fullName}</p>
        <p style="margin: 5px 0; font-size: 14px; color: #ffffff;"><strong>Số điện thoại:</strong> ${userData.phone}</p>
        <p style="margin: 5px 0; font-size: 14px; color: #ffffff;"><strong>Email:</strong> ${userData.email}</p>
        <p style="margin: 5px 0; font-size: 14px; color: #ffffff;"><strong>Ngày tải:</strong> ${new Date().toLocaleString('vi-VN')}</p>
      </div>
    `;
    tempContainer.appendChild(header);

    // Clone the content
    const contentClone = element.cloneNode(true) as HTMLElement;
    
    // Clean up content clone (remove buttons, etc.)
    const buttons = contentClone.querySelectorAll('button');
    buttons.forEach(btn => btn.remove());
    
    // Remove backdrop-filter and other advanced CSS that might cause issues with html2canvas
    const allElements = contentClone.querySelectorAll('*');
    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      
      // 1. Remove backdrop-filter (always problematic for html2canvas)
      htmlEl.style.backdropFilter = 'none';
      (htmlEl.style as any).webkitBackdropFilter = 'none';
      
      // 2. Get computed style to check for oklab/oklch
      // We check the original element's computed style
      const originalEl = document.getElementById(el.id) || el; 
      const computed = window.getComputedStyle(originalEl as Element);
      
      // Fix color
      if (computed.color && (computed.color.includes('oklch') || computed.color.includes('oklab'))) {
        htmlEl.style.color = '#ffffff';
      }
      
      // Fix background
      if (computed.backgroundColor && (computed.backgroundColor.includes('oklch') || computed.backgroundColor.includes('oklab'))) {
        htmlEl.style.backgroundColor = 'transparent';
      }
      
      // Fix border
      if (computed.borderColor && (computed.borderColor.includes('oklch') || computed.borderColor.includes('oklab'))) {
        htmlEl.style.borderColor = '#333333';
      }
      
      // Fix fill/stroke for SVGs
      if (el.tagName.toLowerCase() === 'svg') {
        if (computed.fill && (computed.fill.includes('oklch') || computed.fill.includes('oklab'))) {
          htmlEl.style.fill = '#facc15';
        }
        if (computed.stroke && (computed.stroke.includes('oklch') || computed.stroke.includes('oklab'))) {
          htmlEl.style.stroke = '#facc15';
        }
      }
    });

    // Ensure text is visible in PDF
    contentClone.style.color = '#ffffff';
    contentClone.style.backgroundColor = 'transparent';
    contentClone.style.backgroundImage = 'none';
    contentClone.style.backdropFilter = 'none';
    
    tempContainer.appendChild(contentClone);

    // Footer
    const footer = document.createElement('div');
    footer.innerHTML = `
      <div style="text-align: center; border-top: 1px solid #333333; padding-top: 20px; margin-top: 40px; color: #888888; font-size: 12px; font-style: italic;">
        <p>Bản quyền thuộc về Huyền Tướng Học - Nền tảng huyền học AI hàng đầu.</p>
        <p>Thông tin chỉ mang tính chất tham khảo và chiêm nghiệm.</p>
      </div>
    `;
    tempContainer.appendChild(footer);

    document.body.appendChild(tempContainer);

    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#0a0a0f',
      logging: false,
      onclone: (clonedDoc) => {
        // Final safety check on the cloned document
        const clonedElements = clonedDoc.querySelectorAll('*');
        clonedElements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          
          // Aggressively override any problematic styles in the cloned document
          // This is the most important part as html2canvas uses this document
          
          const style = htmlEl.style;
          
          // Remove filters
          style.backdropFilter = 'none';
          (style as any).webkitBackdropFilter = 'none';
          style.filter = 'none';
          
          // If we detect any okl colors in the inline style (which we might have set above)
          // or if we just want to be safe for all elements
          const computed = window.getComputedStyle(el);
          
          if (computed.color.includes('okl')) {
            style.setProperty('color', '#ffffff', 'important');
          }
          if (computed.backgroundColor.includes('okl')) {
            style.setProperty('background-color', 'transparent', 'important');
          }
          if (computed.borderColor.includes('okl')) {
            style.setProperty('border-color', '#333333', 'important');
          }
          if (computed.fill.includes('okl')) {
            style.setProperty('fill', '#facc15', 'important');
          }
          if (computed.stroke.includes('okl')) {
            style.setProperty('stroke', '#facc15', 'important');
          }
        });
      }
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    // Handle multi-page if content is too long
    let heightLeft = pdfHeight;
    let position = 0;
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);

    document.body.removeChild(tempContainer);
  } catch (error) {
    console.error('PDF generation failed:', error);
  }
};
