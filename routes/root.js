const express = require("express");
const fs = require("fs");
const { createOneTimeToken } = require("../middleware/csrf");

const router = express.Router();

router.get("/", (req, res) => {
  if (req.session) {
    const squeaks = JSON.parse(fs.readFileSync("squeaks.json", "utf8"));
    res.render("main", {
      username: req.session.username,
      squeaks: squeaks.map((squeak) => ({
        ...squeak,
        time: new Date(squeak.time).toLocaleString(),
      })),
      csrfToken: req.session.csrfToken,
    });
  } else {
    const oneTimeToken = createOneTimeToken();
    res.render("login", { csrfToken: oneTimeToken });
  }
});

module.exports = router;
