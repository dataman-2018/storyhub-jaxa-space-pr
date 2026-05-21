const fs = require("node:fs");
const path = require("node:path");

const USERNAME = "storyhub";
const PASSWORD = "ensemble";

const ROUTES = {
  "/": "index.html",
};

const pages = {};
const loadErrors = {};
for (const [route, file] of Object.entries(ROUTES)) {
  const candidates = [
    path.resolve(__dirname, "..", file),
    path.resolve(process.cwd(), file),
    path.resolve(__dirname, file),
    path.resolve("/var/task", file),
  ];
  let loaded = null;
  let lastErr = null;
  for (const p of candidates) {
    try {
      loaded = fs.readFileSync(p, "utf8");
      break;
    } catch (e) {
      lastErr = `${p}: ${e.code || e.message}`;
    }
  }
  pages[route] = loaded;
  if (!loaded) loadErrors[route] = lastErr;
}

function unauthorized(res) {
  res.setHeader("WWW-Authenticate", 'Basic realm="StoryHub Proposal"');
  res.setHeader("Cache-Control", "no-store");
  return res.status(401).send("Authentication required.");
}

module.exports = function handler(req, res) {
  const authorization = req.headers.authorization;
  const expected = `Basic ${Buffer.from(`${USERNAME}:${PASSWORD}`).toString("base64")}`;

  if (!authorization || authorization !== expected) {
    return unauthorized(res);
  }

  const rawRoute = req.url.split("?")[0].replace(/\/+$/, "") || "/";
  const route = pages[rawRoute] ? rawRoute : "/";
  const html = pages[route];

  if (!html) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.status(404).send(`Not Found\n__dirname=${__dirname}\ncwd=${process.cwd()}\nerrors=${JSON.stringify(loadErrors, null, 2)}`);
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
  return res.status(200).send(html);
};
