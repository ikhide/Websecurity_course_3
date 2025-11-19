const express = require("express");
const fs = require("fs");

const router = express.Router();

router.post("/", (req, res) => {
  if (!req.session) {
    return res.status(401).send("Unauthorized");
  }

  const squeaks = JSON.parse(fs.readFileSync("squeaks.json", "utf8"));
  squeaks.unshift({
    username: req.session.username,
    text: req.body.text,
    time: Date.now(),
  });

  fs.writeFileSync("squeaks.json", JSON.stringify(squeaks, null, 2));

  res.redirect("/");
});

module.exports = router;
