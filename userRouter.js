const express = require("express");
const router = express.Router();
const {
  signupUser,
  loginUser,
  getUser,
  verifiedUser,
} = require("./controllers/userController");

router.get("/verified", verifiedUser);
router.post("/signup", signupUser);
router.post("/login", loginUser);
router.get("/user/verify/:userId/:uniqueString", getUser);
module.exports = router;
