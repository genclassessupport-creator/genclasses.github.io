// Publishes the site into _site/ with every script minified, so visitors never
// receive the readable source. Used as the Cloudflare Pages build command:
//   npm install && npm run build      (output directory: _site)
// The repository itself keeps the normal, editable files.
import { minify } from "terser";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "_site");

// Never published: source tooling, the Android project, server code, repo metadata.
const SKIP_DIRS = new Set([".git", ".github", "node_modules", "_site", "_build", "tools", "content", "android-app", "workers"]);
const SKIP_FILES = new Set(["README.md", "package.json", "package-lock.json", ".gitignore", "CNAME", ".nojekyll"]);

const SECURITY_HEADERS = `
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
`;

const stats = { files: 0, js: 0, inline: 0, kept: 0, before: 0, after: 0 };

async function min(code, module) {
  const r = await minify(code, {
    module,
    compress: { passes: 2 },
    mangle: true,            // local names only: globals shared between files stay intact
    format: { comments: false },
  });
  if (!r.code && code.trim()) throw new Error("empty output");
  return r.code;
}

const JS_TYPE = /^(|text\/javascript|application\/javascript|module)$/i;

async function minifyHtml(html, file) {
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let out = "", last = 0, m;
  while ((m = re.exec(html))) {
    const [whole, attrs, body] = m;
    out += html.slice(last, m.index);
    last = m.index + whole.length;
    const type = (/\btype\s*=\s*["']?([^"'\s>]*)/i.exec(attrs) || [, ""])[1];
    if (/\bsrc\s*=/i.test(attrs) || !JS_TYPE.test(type) || !body.trim()) { out += whole; continue; }
    try {
      const code = await min(body, /module/i.test(type));
      // a closing tag inside a string would end the block early
      out += `<script${attrs}>${code.replace(/<\/script/gi, "<\\/script")}</script>`;
      stats.inline++;
    } catch (e) {
      out += whole; stats.kept++;
      console.warn(`  kept as-is (inline script in ${file}): ${String(e.message).slice(0, 90)}`);
    }
  }
  return out + html.slice(last);
}

async function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const src = path.join(dir, name);
    const rel = path.relative(ROOT, src).split(path.sep).join("/");
    const st = fs.statSync(src);
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name) && dir === ROOT) continue;
      if (name === "node_modules" || name === "__pycache__") continue;
      await walk(src);
      continue;
    }
    if (dir === ROOT && (SKIP_FILES.has(name) || name.startsWith("_shot-"))) continue;
    const dst = path.join(OUT, rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    stats.files++;
    const ext = path.extname(name).toLowerCase();
    if (ext === ".js" || ext === ".mjs") {
      const code = fs.readFileSync(src, "utf8");
      try {
        // files loaded with type="module" often keep the .js extension
        const isModule = ext === ".mjs" || /^\s*(import|export)\b/m.test(code);
        const res = await min(code, isModule);
        fs.writeFileSync(dst, res); stats.js++;
        stats.before += code.length; stats.after += res.length;
      } catch (e) {
        fs.copyFileSync(src, dst); stats.kept++;
        console.warn(`  kept as-is (${rel}): ${String(e.message).slice(0, 90)}`);
      }
    } else if (ext === ".html" || ext === ".htm") {
      const html = fs.readFileSync(src, "utf8");
      const res = await minifyHtml(html, rel);
      fs.writeFileSync(dst, res);
      stats.before += html.length; stats.after += res.length;
    } else {
      fs.copyFileSync(src, dst);
    }
  }
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT);
await walk(ROOT);

const headersFile = path.join(OUT, "_headers");
const existing = fs.existsSync(headersFile) ? fs.readFileSync(headersFile, "utf8").trimEnd() + "\n" : "";
fs.writeFileSync(headersFile, existing + SECURITY_HEADERS);

console.log(`built ${stats.files} files → _site/ | js files ${stats.js}, inline scripts ${stats.inline}, kept as-is ${stats.kept} | ` +
  `text ${(stats.before / 1e6).toFixed(1)} MB → ${(stats.after / 1e6).toFixed(1)} MB`);
if (stats.kept > 0) process.exitCode = 0;
