const express = require("express");
const fs = require("fs");
const crypto = require("crypto");
const util = require("util");

const pbkdf2 = util.promisify(crypto.pbkdf2);

const router = express.Router();

router.post("/", async (req, res) => {
  const { username, password } = req.body;

  if (!username || username.length < 4) {
    return res.json({
      success: false,
      errorType: "username",
      message: "Username must be at least 4 characters long.",
    });
  }

  if (!password || password.length < 8) {
    return res.json({
      success: false,
      errorType: "password",
      message: "Password must be at least 8 characters long.",
    });
  }

  const validPassword = !password
    .toLowerCase()
    .includes(username.toLowerCase());

  if (!validPassword) {
    return res.json({
      success: false,
      errorType: "password",
      message: "Password cannot contain username.",
    });
  }

  const users = JSON.parse(fs.readFileSync("passwd", "utf8"));

  if (users[username]) {
    return res.json({
      success: false,
      errorType: "username",
      message: "Username is already taken.",
    });
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const hash = (await pbkdf2(password, salt, 100000, 64, "sha512")).toString(
    "hex"
  );

  users[username] = { salt, hash };

  fs.writeFileSync("passwd", JSON.stringify(users, null, 2));

  res.json({ success: true });
});

module.exports = router;
