const express = require("express");
const router = express.Router();

const rootRouter = require("./root");
const squeakRouter = require("./squeak");
const signupRouter = require("./signup");
const signinRouter = require("./signin");
const signoutRouter = require("./signout");

router.use("/squeak", squeakRouter);
router.use("/signup", signupRouter);
router.use("/signin", signinRouter);
router.use("/signout", signoutRouter);
router.use("/", rootRouter);

module.exports = router;
