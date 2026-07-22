// Submits every sitemap URL to IndexNow (Bing/Yandex/Naver). Run after each deploy.
import { readdirSync, readFileSync } from 'node:fs';

const HOST = 'vexxx.co';
// eslint-disable-next-line no-undef
const publicDir = new URL('../public/', import.meta.url);
const keyFile = readdirSync(publicDir).find((file) => /^[0-9a-f]{32}\.txt$/.test(file));
if (!keyFile) throw new Error('IndexNow key file missing from public/');
// eslint-disable-next-line no-undef
const key = readFileSync(new URL(keyFile, publicDir), 'utf8').trim();

// eslint-disable-next-line no-undef
const sitemap = await (await fetch(`https://${HOST}/sitemap-0.xml`)).text();
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (urlList.length === 0) throw new Error('No URLs found in live sitemap');

// eslint-disable-next-line no-undef
const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key, keyLocation: `https://${HOST}/${keyFile}`, urlList }),
});
// eslint-disable-next-line no-undef
console.log(`IndexNow: ${response.status} for ${urlList.length} URLs`);
// eslint-disable-next-line no-undef
if (response.status !== 200 && response.status !== 202) process.exit(1);
