import { chromium, Browser, Page } from "playwright";
import { sleep } from "@/utils/helpers";
import { logger } from "@/config/logger";
import path from "path";

export class PlaywrightService {
  private browser: Browser | null = null;

  async launchBrowser() {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: true });
    }
    return this.browser;
  }

  async renderAndRecord(projectId: string, htmlContent: string, interactions: any[], outputPath: string) {
    const browser = await this.launchBrowser();
    
    // Create context with video recording enabled
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      recordVideo: {
        dir: path.dirname(outputPath),
        size: { width: 1280, height: 720 }
      }
    });

    const page = await context.newPage();
    
    // Load HTML content
    await page.setContent(htmlContent, { waitUntil: "networkidle" });
    
    // Extra sleep to ensure UI settles before interactions
    await sleep(2000);

    // Run interactions
    for (const action of interactions) {
      try {
        if (action.type === "click") {
          await page.click(action.selector, { timeout: 5000 });
        } else if (action.type === "type") {
          await page.type(action.selector, action.text, { delay: 100 });
        }
        
        if (action.delay) {
          await sleep(action.delay);
        }
      } catch (err: any) {
        logger.error(err, `Interaction error [${action.type}] on [${action.selector}]`);
      }
    }

    // Wait a bit at the end
    await sleep(2000);

    // Closing context saves the video
    await context.close();

    // Get the path to the video file and move it to the intended outputPath
    const videoObj = await page.video();
    if (videoObj) {
      const videoPath = await videoObj.path();
      const fs = await import("fs/promises");
      await fs.rename(videoPath, outputPath);
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export const playwrightService = new PlaywrightService();
