const express = require("express");
const { createOneTimeToken } = require("../middleware/csrf");
const { getUsers, getSqueaks, getSqueals } = require("../services/database");

const router = express.Router();

router.get("/", async (req, res) => {
  if (req.session) {
    const username = req.session.username;

    const [users, squeaks, squeals] = await Promise.all([
      getUsers(), // All usernames for recipient dropdown
      getSqueaks("all"), // Public squeaks (recipient = "all")
      getSqueals(username), // Private squeals for current user
    ]);

    res.render("main", {
      username: username,
      users: users,
      squeaks: squeaks,
      squeals: squeals,
      csrfToken: req.session.csrfToken,
    });
  } else {
    const oneTimeToken = createOneTimeToken();
    res.render("login", { csrfToken: oneTimeToken });
  }
});

module.exports = router;
