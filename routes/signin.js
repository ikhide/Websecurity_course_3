const express = require("express");
const { authenticate } = require("../services/database");

const router = express.Router();

router.post("/", async (req, res) => {
  const { username, password } = req.body;

  const isAuthenticated = await authenticate(username, password);

  if (!isAuthenticated) {
    return res.json({
      success: false,
      message: "Invalid username or password.",
    });
  }

  req.createSession(username);

  res.json({ success: true });
});

module.exports = router;
