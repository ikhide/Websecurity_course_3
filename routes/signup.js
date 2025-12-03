const express = require("express");
const { addUser, getCollections } = require("../services/database");

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

  const { credentials } = getCollections();
  const existingUser = await credentials.findOne({ username: username });

  if (existingUser) {
    return res.json({
      success: false,
      errorType: "username",
      message: "Username is already taken.",
    });
  }

  await addUser(username, password);

  res.json({ success: true });
});

module.exports = router;
