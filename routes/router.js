const express = require('express')

const authController = require('../controller/authController')
const router = new express.Router()

router.post('/register',authController.registerController)

module.exports = router