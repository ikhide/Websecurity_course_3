const express = require("express");
const { addSqueak } = require("../services/database");

const router = express.Router();

router.post("/", async (req, res) => {
  if (!req.session) {
    return res.status(401).send("Unauthorized");
  }

  const username = req.session.username;
  const recipient = req.body.recipient || "all";
  const text = req.body.text;
  await addSqueak(username, recipient, text);

  res.redirect("/");
});

module.exports = router;
