const express = require('express');
const router = express.Router();
const { login, debugUsers } = require('../controllers/authController');

router.post('/login', login);
router.get('/debug', debugUsers);

module.exports = router;