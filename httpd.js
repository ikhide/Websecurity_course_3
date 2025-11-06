const express = require("express");
const fs = require("fs");
const crypto = require("crypto");
const util = require("util");

const pbkdf2 = util.promisify(crypto.pbkdf2);

const app = express();
const port = 8000;

app.use(express.static("public"));
app.use(express.json());

const sessions = {};
const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes

function generateSessionId() {
  return crypto.randomBytes(16).toString("hex");
}

function createSession(username) {
  const sessionId = generateSessionId();
  sessions[sessionId] = {
    username,
    createdAt: Date.now(),
    lastActive: Date.now(),
  };
  return sessionId;
}

function isSessionValid(sessionId) {
  const session = sessions[sessionId];
  if (!session) return false;

  const now = Date.now();
  if (now - session.lastActive > SESSION_TIMEOUT) {
    delete sessions[sessionId];
    return false;
  }

  session.lastActive = now; // refresh activity
  return true;
}

app.use((req, res, next) => {
  const cookies = req.headers.cookie;
  req.cookies = {};
  if (cookies) {
    cookies.split(";").forEach((cookie) => {
      const parts = cookie.split("=");
      req.cookies[parts.shift().trim()] = decodeURI(parts.join("="));
    });
  }
  next();
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  if (!username || username.length < 4) {
    return res.json({ success: false, errorType: "username" });
  }

  if (!password || password.length < 8 || password.includes(username)) {
    return res.json({ success: false, errorType: "password" });
  }

  const users = JSON.parse(fs.readFileSync("passwd", "utf8"));

  if (users[username]) {
    return res.json({ success: false, errorType: "username" });
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const hash = (await pbkdf2(password, salt, 100000, 64, "sha512")).toString(
    "hex"
  );

  users[username] = { salt, hash };

  fs.writeFileSync("passwd", JSON.stringify(users, null, 2));

  res.json({ success: true });
});

app.post("/signin", async (req, res) => {
  const { username, password } = req.body;
  const users = JSON.parse(fs.readFileSync("passwd", "utf8"));

  const user = users[username];
  if (!user) {
    return res.json(false);
  }

  const hash = (
    await pbkdf2(password, user.salt, 100000, 64, "sha512")
  ).toString("hex");

  if (hash !== user.hash) {
    return res.json(false);
  }

  const sessionId = createSession(username);

  res.setHeader(
    "Set-Cookie",
    `squeak-session=${JSON.stringify({ sessionId, username })}; HttpOnly`
  );

  res.json(true);
});

app.post("/signout", (req, res) => {
  const cookie = req.cookies["squeak-session"];
  if (cookie) {
    const { sessionId } = JSON.parse(cookie);
    delete sessions[sessionId];
  }
  res.setHeader("Set-Cookie", "squeak-session=; HttpOnly; Max-Age=0");
  res.json(true);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
