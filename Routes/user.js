const express = require('express');
const { handleUserSignup } = require('../Controllers/user');
const router = express.Router();
router.post("/signup", handleUserSignup);
module.exports = router;