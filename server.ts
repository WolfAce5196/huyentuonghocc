import express from "express";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

console.log("Server starting with updated code...");
console.log("GOOGLE_SERVICE_ACCOUNT_EMAIL:", process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? "Present" : "Missing");
console.log("GOOGLE_SHEET_ID:", process.env.GOOGLE_SHEET_ID || "Using default");

app.use(express.json());

// Google Sheets logging
async function logToGoogleSheet(data: any) {
  try {
    let privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    
    // Remove quotes if present (common in .env files)
    if (privateKey?.startsWith('"') && privateKey?.endsWith('"')) {
      privateKey = privateKey.substring(1, privateKey.length - 1);
    }
    
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
    
    if (!clientEmail || !privateKey) {
      console.error("Missing Google Service Account credentials. EMAIL:", !!clientEmail, "KEY:", !!privateKey);
      return false;
    }

    console.log("Private Key starts with:", privateKey.substring(0, 30), "...");
    console.log("Private Key length:", privateKey.length);
    console.log("Service Account Email:", clientEmail);

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = (process.env.GOOGLE_SHEET_ID || "1znCqg3MUjJGNwskz-1zkP71Ovnju9-AgWijvO_jHPcA").trim();

    if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
      console.warn("GOOGLE_PRIVATE_KEY might be missing the standard header/footer.");
    }

    console.log("Attempting to connect to Google Sheets API...");
    // Try to get the first sheet name dynamically to be safe
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    console.log("Successfully connected to Spreadsheet:", spreadsheet.data.properties?.title);
    
    const sheetName = spreadsheet.data.sheets?.[0]?.properties?.title || "Sheet1";
    const range = `${sheetName}!A:I`;

    console.log(`Appending data to sheet: ${sheetName} (Range: ${range})`);

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
    console.log("Successfully appended data to Google Sheets:", response.statusText);
    return true;
  } catch (error) {
    console.error("Error logging to Google Sheets:", error);
    return false;
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
    fullName: userData.fullName,
    phone: userData.phone,
    email: userData.email,
    category,
    summary,
    pdfLink: "Tải trực tiếp từ trình duyệt",
    ttGmail: "Chưa Gửi",
    ttZalo: "Chưa Gửi",
  };

  const success = await logToGoogleSheet(logData);

  if (success) {
    res.json({ status: "ok" });
  } else {
    res.status(500).json({ error: "Failed to log to Google Sheets" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
