const express = require("express");
const fs = require("fs");
const crypto = require("crypto");
const util = require("util");

const pbkdf2 = util.promisify(crypto.pbkdf2);

const router = express.Router();

router.post("/", async (req, res) => {
  const { username, password } = req.body;
  const users = JSON.parse(fs.readFileSync("passwd", "utf8"));

  const user = users[username];
  if (!user) {
    return res.json({
      success: false,
      message: "Invalid username or password.",
    });
  }

  const hash = (
    await pbkdf2(password, user.salt, 100000, 64, "sha512")
  ).toString("hex");

  if (hash !== user.hash) {
    return res.json({
      success: false,
      message: "Invalid username or password.",
    });
  }

  req.createSession(username);

  res.json({ success: true });
});

module.exports = router;
