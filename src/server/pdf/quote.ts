import puppeteer, { LaunchOptions } from "puppeteer";
import { put } from "@vercel/blob";

interface GenerateQuotePdfOptions {
  shareId: string;
  quoteId: string;
  baseUrl: string;
}

export async function generateQuotePdf({ shareId, quoteId, baseUrl }: GenerateQuotePdfOptions) {
  const fileName = `${quoteId}-${Date.now()}.pdf`;

  const targetUrl = new URL(`/proposals/${shareId}/receipt`, baseUrl).toString();

  const launchOptions: LaunchOptions = {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  };

  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const browser = await puppeteer.launch(launchOptions);

  try {
    const page = await browser.newPage();
    await page.goto(targetUrl, { waitUntil: "networkidle0" });
    const buffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "24px",
        right: "24px",
        bottom: "24px",
        left: "24px",
      },
    });
    const pdfBuffer = Buffer.from(buffer);
    const blob = await put(`receipts/${fileName}`, pdfBuffer, {
      access: "public",
      contentType: "application/pdf"
    });
    return { pdfUrl: blob.url, fileName, buffer: pdfBuffer };
  } finally {
    await browser.close();
  }
}
