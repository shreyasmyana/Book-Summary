import express from "express";
import multer from "multer";
import * as dotenv from "dotenv";
import { pipeline } from "@huggingface/transformers";
import fs from "fs";
import path from "path";
import PDFParser from "pdf2json";
import { fork } from "child_process";
import cors from "cors";

const pdfParser = new PDFParser(this, 1);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/";

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

app.use(express.static("public"));

app.use(
  cors({
    origin: "http://localhost:3000", // Allow requests from this origin
  })
);

app.get("/service-health", (req, res) => {
  res.json({ status: "success", message: "Server is running" });
});

app.post("/book-summary", upload.single("pdfFile"), async (req, res) => {
  try {
    const dataBuffer = fs.readFileSync(req.file.path);
    console.log(dataBuffer);
    const filename = req.file.path;
    pdfParser.loadPDF(filename);

    pdfParser.on("pdfParser_dataError", (errData) =>
      console.error(errData.parserError)
    );
    pdfParser.on("pdfParser_dataReady", async (pdfData) => {
      console.log({ textContent: pdfParser.getRawTextContent() });

      const textContent = pdfParser.getRawTextContent();

      const summarizer = await pipeline(
        "summarization",
        "Xenova/bart-large-cnn"
      );
      const summary = await summarizer(textContent, {
        max_length: 10000,
        min_length: 30,
        do_sample: false,
        length_penalty: 1.5,
      });

      res.json({ summary: summary[0].summary_text });

      fs.unlink(filename, (err) => {
        if (err) {
          console.error(`Error deleting file: ${filename}`, err);
        } else {
          console.log(`Successfully deleted file: ${filename}`);
        }
      });

      restartServer();
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred during processing." });
  }
});

function restartServer() {
  const server = fork(process.argv[1]);
  server.on("exit", () => {
    console.log("Server has restarted");
  });

  process.exit();
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
