const fs = require("node:fs");
const path = require("node:path");

const USERNAME = "storyhub";
const PASSWORD = "ensemble";

const ROUTES = {
  "/": "index.html",
};

const pages = {};
for (const [route, file] of Object.entries(ROUTES)) {
  const filePath = path.resolve(__dirname, "..", file);
  try {
    pages[route] = fs.readFileSync(filePath, "utf8");
  } catch (e) {
    pages[route] = null;
  }
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

  const route = req.url.split("?")[0].replace(/\/+$/, "") || "/";
  const html = pages[route];

  if (!html) {
    return res.status(404).send("Not Found");
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
  return res.status(200).send(html);
};
