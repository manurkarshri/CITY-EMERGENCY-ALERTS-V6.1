import fs from "node:fs";

function assert(condition, message) { if (!condition) throw new Error(message); }

const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
const expected = [
  ["assets/icons/icon-192.png", "192x192", "any"],
  ["assets/icons/icon-512.png", "512x512", "any"],
  ["assets/icons/icon-maskable-512.png", "512x512", "maskable"]
];

for (const [src, sizes, purpose] of expected) {
  const icon = manifest.icons.find(item => item.src === src);
  assert(icon?.sizes === sizes && icon?.type === "image/png" && icon?.purpose === purpose, `${src} must be correctly declared in the web app manifest`);
  assert(fs.existsSync(src) && fs.statSync(src).size > 1000, `${src} must be a non-empty production icon`);
}

const html = fs.readFileSync("index.html", "utf8");
assert(html.includes('rel="apple-touch-icon"') && html.includes("apple-touch-icon.png"), "iOS home-screen icon must be declared");
assert(html.includes('rel="icon"') && html.includes("favicon-32.png"), "Browser favicon must be declared");

const serviceWorker = fs.readFileSync("sw.js", "utf8");
for (const [src] of expected) assert(serviceWorker.includes(`./${src}`), `${src} must be cached for offline PWA use`);

console.log("PWA home-screen icon tests passed.");
