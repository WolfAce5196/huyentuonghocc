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

// Google Sheets logging
async function logToGoogleSheet(data: any) {
  try {
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;
    if (!privateKey) {
      console.error("GOOGLE_PRIVATE_KEY is missing from environment variables.");
      return false;
    }

    // Handle escaped newlines
    privateKey = privateKey.replace(/\\n/g, "\n");
    
    // Remove quotes if present
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.substring(1, privateKey.length - 1);
    }

    privateKey = privateKey.trim();
    
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
    let spreadsheetId = (process.env.GOOGLE_SHEET_ID || "1znCqg3MUjJGNwskz-1zkP71Ovnju9-AgWijvO_jHPcA").trim();
    
    // If user pasted the full URL, extract the ID
    if (spreadsheetId.includes("docs.google.com/spreadsheets/d/")) {
      const matches = spreadsheetId.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (matches && matches[1]) {
        spreadsheetId = matches[1];
      }
    }

    if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
      console.warn("GOOGLE_PRIVATE_KEY might be missing the standard header/footer.");
    }

    console.log("Attempting to connect to Google Sheets API...");
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    console.log("Successfully connected to Spreadsheet:", spreadsheet.data.properties?.title);
    
    const sheetName = "Data";
    const sheetExists = spreadsheet.data.sheets?.some(s => s.properties?.title === sheetName);
    
    if (!sheetExists) {
      console.error(`Sheet named "${sheetName}" not found in spreadsheet. Available sheets:`, 
        spreadsheet.data.sheets?.map(s => s.properties?.title).join(", "));
      return false;
    }

    // Wrap sheet name in single quotes to handle spaces or special characters
    const range = `'${sheetName}'!A:I`;

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
  } catch (error: any) {
    console.error("Error logging to Google Sheets:");
    let errorMsg = error.message || "Unknown error";
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
      errorMsg = `Google API Error: ${error.response.data.error?.message || error.response.statusText}`;
    } else {
      console.error("Message:", error.message);
    }
    return errorMsg;
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

  if (success === true) {
    res.json({ status: "ok" });
  } else {
    res.status(500).json({ error: success || "Failed to log to Google Sheets" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom", // Changed to custom to handle HTML manually
    });
    app.use(vite.middlewares);

    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      // Skip API routes
      if (url.startsWith("/api/")) {
        return next();
      }

      try {
        let template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static("dist"));
    // Catch-all route for SPA in production
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
