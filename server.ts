import express from "express";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = 3000;

console.log("Server starting with updated code...");
console.log("GOOGLE_SERVICE_ACCOUNT_EMAIL:", process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? "Present" : "Missing");
console.log("GOOGLE_SHEET_ID:", process.env.GOOGLE_SHEET_ID || "Using default");

app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV || "development" });
});

// Google Sheets logging
async function logToGoogleSheet(data: any) {
  try {
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
    
    if (!clientEmail || !privateKey) {
      console.error("Missing Google Service Account credentials. EMAIL:", !!clientEmail, "KEY:", !!privateKey);
      return "Chưa cấu hình Google Service Account (Email hoặc Private Key).";
    }

    // Handle escaped newlines
    privateKey = privateKey.replace(/\\n/g, "\n");
    
    // Remove quotes if present
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.substring(1, privateKey.length - 1);
    }

    privateKey = privateKey.trim();
    
    if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
      console.warn("GOOGLE_PRIVATE_KEY missing standard header. Attempting to wrap it.");
      // If it's just the raw key, we might need to wrap it, but usually it should be provided correctly.
      // For now, just warn.
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    let spreadsheetId = (process.env.GOOGLE_SHEET_ID || "1znCqg3MUjJGNwskz-1zkP71Ovnju9-AgWijvO_jHPcA").trim();
    
    // If user pasted the full URL, extract the ID
    if (spreadsheetId.includes("docs.google.com/spreadsheets/d/")) {
      const matches = spreadsheetId.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (matches && matches[1]) {
        spreadsheetId = matches[1];
      }
    }

    console.log("Attempting to connect to Google Sheets API with ID:", spreadsheetId);
    
    let spreadsheet;
    try {
      spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    } catch (connError: any) {
      console.error("Failed to connect to spreadsheet:", connError.message);
      if (connError.message?.includes("not found")) {
        return "Không tìm thấy Spreadsheet ID. Vui lòng kiểm tra lại GOOGLE_SHEET_ID.";
      }
      if (connError.message?.includes("permission") || connError.code === 403) {
        return "Lỗi phân quyền. Hãy đảm bảo bạn đã chia sẻ Spreadsheet cho Email Service Account: " + clientEmail;
      }
      throw connError;
    }

    console.log("Successfully connected to Spreadsheet:", spreadsheet.data.properties?.title);
    
    const sheetName = "Data";
    const sheetExists = spreadsheet.data.sheets?.some(s => s.properties?.title === sheetName);
    
    if (!sheetExists) {
      console.error(`Sheet named "${sheetName}" not found. Creating it...`);
      try {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{
              addSheet: {
                properties: { title: sheetName }
              }
            }]
          }
        });
        // Add headers
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `'${sheetName}'!A1:I1`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [["Thời gian", "Họ tên", "Số điện thoại", "Email", "Danh mục", "Tóm tắt", "Link PDF", "TT Gmail", "TT Zalo"]]
          }
        });
      } catch (createError: any) {
        console.error("Failed to create sheet 'Data':", createError.message);
        return "Không tìm thấy sheet 'Data' và không thể tự động tạo. Hãy tạo sheet tên 'Data' thủ công.";
      }
    }

    const range = `'${sheetName}'!A:I`;
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range, 
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            data.time,
            data.fullName,
            data.phone,
            data.email,
            data.category,
            data.summary,
            data.pdfLink,
            data.ttGmail,
            data.ttZalo,
          ],
        ],
      },
    });
    console.log("Successfully appended data to Google Sheets");
    return true;
  } catch (error: any) {
    console.error("Error logging to Google Sheets:", error.message);
    return error.message || "Lỗi không xác định khi ghi vào Google Sheets.";
  }
}

// API Routes
app.post("/api/log-submission", async (req, res) => {
  const { userData, category, summary } = req.body;

  if (!userData || !category || !summary) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const time = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

  const logData = {
    time,
    fullName: userData.fullName || "N/A",
    phone: userData.phone || "N/A",
    email: userData.email || "N/A",
    category: category || "N/A",
    summary: summary || "N/A",
    pdfLink: "Tải trực tiếp từ trình duyệt",
    ttGmail: "Chưa Gửi",
    ttZalo: "Chưa Gửi",
  };

  console.log("Logging submission to Google Sheets:", JSON.stringify(logData, null, 2));
  const success = await logToGoogleSheet(logData);

  if (success === true) {
    res.json({ status: "ok" });
  } else {
    res.status(500).json({ error: success || "Failed to log to Google Sheets" });
  }
});

async function startServer() {
  let vite: any;

  if (process.env.NODE_ENV !== "production") {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("[Server] Vite middleware loaded (Development)");
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
    console.log("[Server] Static middleware loaded (Production)");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running on http://0.0.0.0:${PORT}`);
    console.log(`[Server] NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
