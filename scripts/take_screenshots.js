import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve(__dirname, '../screenshots');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const pages = [
  { name: 'home.png', url: 'http://localhost:5173/' },
  { name: 'map.png', url: 'http://localhost:5173/map' },
  { name: 'report.png', url: 'http://localhost:5173/report' },
  { name: 'analytics.png', url: 'http://localhost:5173/analytics' },
  { name: 'track.png', url: 'http://localhost:5173/track' }
];

async function capture() {
  for (const page of pages) {
    const outFile = path.join(outDir, page.name);
    console.log(`Capturing ${page.url} -> ${page.name}...`);
    
    await new Promise((resolve) => {
      const args = [
        '--headless=new',
        '--disable-gpu',
        '--window-size=1440,900',
        `--screenshot=${outFile}`,
        page.url
      ];

      execFile(chromePath, args, (err, stdout, stderr) => {
        if (err) {
          console.error(`Error capturing ${page.name}:`, err.message);
        } else {
          console.log(`Saved ${outFile}`);
        }
        resolve();
      });
    });
    
    // Short pause between captures
    await new Promise(r => setTimeout(r, 1200));
  }
}

capture();

