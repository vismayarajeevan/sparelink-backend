const express = require('express')

const authController = require('../controller/authController')
const router = new express.Router()

// register
router.post('/register',authController.registerController)

// verify otp for register
router.post('/verifyOtpReg',authController.verifyOtpController)

// reset otp for register
router.post('/resetOtpReg',authController.resendOtpRegController)


module.exports = router