const express = require('express');
const router = express.Router();
const { login, resetAdminPassword } = require('../controllers/authController');

router.post('/login', login);
router.get('/reset-admin-emergency', resetAdminPassword);

module.exports = router;