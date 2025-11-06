const express = require("express");
const fs = require("fs");
const crypto = require("crypto");
const util = require("util");
const sessionMiddleware = require("./middleware/session");

const pbkdf2 = util.promisify(crypto.pbkdf2);

const app = express();
const port = 8000;

app.use(express.static("public"));
app.use(express.json());
app.use(sessionMiddleware);

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

  req.createSession(username);

  res.json(true);
});

app.post("/signout", (req, res) => {
  req.destroySession();
  res.json(true);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
