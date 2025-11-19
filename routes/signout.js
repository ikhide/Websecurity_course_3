const express = require("express");

const router = express.Router();

router.post("/", (req, res) => {
  req.destroySession();
  res.json(true);
});

module.exports = router;