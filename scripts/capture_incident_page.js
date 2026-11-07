import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve(__dirname, '../screenshots');

function getFirstIncidentId() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:5000/api/v1/incidents?limit=1', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.data[0]._id);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  try {
    const incId = await getFirstIncidentId();
    console.log(`First incident ID: ${incId}`);

    const pages = [
      { name: 'incident-detail.png', url: `http://localhost:5173/incidents/${incId}` },
      { name: 'login.png', url: `http://localhost:5173/login` }
    ];

    for (const page of pages) {
      const outFile = path.join(outDir, page.name);
      await new Promise(resolve => {
        execFile(chromePath, [
          '--headless=new',
          '--disable-gpu',
          '--window-size=1440,900',
          `--screenshot=${outFile}`,
          page.url
        ], () => {
          console.log(`Saved ${outFile}`);
          resolve();
        });
      });
      await new Promise(r => setTimeout(r, 1000));
    }
  } catch (err) {
    console.error(err);
  }
}

run();

