const express = require("express");

const router = express.Router();

router.post("/", async (req, res) => {
  await req.destroySession();
  res.json(true);
});

module.exports = router;
