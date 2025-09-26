import fs from "node:fs/promises";
import path from "node:path";

import puppeteer, { PuppeteerLaunchOptions } from "puppeteer";

interface GenerateQuotePdfOptions {
  shareId: string;
  quoteId: string;
  baseUrl: string;
}

export async function generateQuotePdf({ shareId, quoteId, baseUrl }: GenerateQuotePdfOptions) {
  const receiptsDir = path.join(process.cwd(), "public", "receipts");
  await fs.mkdir(receiptsDir, { recursive: true });

  const fileName = `${quoteId}-${Date.now()}.pdf`;
  const filePath = path.join(receiptsDir, fileName);
  const publicUrl = `/receipts/${fileName}`;

  const targetUrl = new URL(`/proposals/${shareId}/receipt`, baseUrl).toString();

  const launchOptions: PuppeteerLaunchOptions = {
    headless: "new",
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
    await fs.writeFile(filePath, buffer);
    return { pdfUrl: publicUrl, filePath };
  } finally {
    await browser.close();
  }
}
