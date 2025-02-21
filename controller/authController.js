const users = require('../model/userModel')
const nodemailer = require('nodemailer') //for otp
const cryptojs = require('crypto-js')



// nodemailer
const transporter = nodemailer.createTransport({
    service:"gmail",
    auth:{
        user : process.env.NodemailerMail,
        pass: process.env.NodemailerPassword
    }
})

//1. register
exports.registerController = async(req,res)=>{
    try {
        // take alll input field values using destructuring
        const {userName,email,phoneNumber,password} = req.body

        // check all fields are filled or not
        if(!userName || !email || !phoneNumber || !password){
            res.status(400).json({message:"All fields are required"})
        }

        // validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if(!emailRegex.test(email)){
            res.status(400).json({message:'Invalid email format'})
        }

        // encrypted the password
        const encryptedPassword = cryptojs.AES.encrypt(password, process.env.PASSWORD_SECRET_KEY).toString();



        // generate random 6 digit otp
        const otp = Math.floor(100000 + Math.random() *900000)

        // Sets an expiry time for the OTP (2 minutes and 20 seconds).

        const otpExpiry = Date.now() + 140000

        // check user is already exists in the database or not using email
        const user = await users.findOne({email})
        if(user){
            // check user email is exist but verified using otp or not
            if(user.verified){
                return res.status(400).json({ message: 'User already registered and verified with this email' })
            }else{
                // email is exist user not verified, resend otp and update password
                user.otp = otp
                user.otpExpiry= otpExpiry
                user.password = encryptedPassword
            }
        

        }else{
          
            // if  email unique , , create a new unverified user
            const newUser = new users({
                userName,
                email,
                phoneNumber,
                password:encryptedPassword,
                verified:false,
                otp,
                otpExpiry,

            })
            // save user to mongodb
        await newUser.save()
        }
        

        // send an otp to verify user
        // call nodemailer
         await transporter.sendMail({
             from:process.env.NodemailerMail,
             to: email,
             subject: "OTP Verification",
             text: `Your OTP for verification is: ${otp}`
         })
         res.status(200).json({ message: 'OTP sent successfully' })
        
    } catch (error) {

        // Log error to help identify the problem
    console.error('Error during user registration:', error);
        
     // Return a more specific error message
     res.status(500).json({ message: 'Failed to send OTP', error: error.message });

    }
}


// 2.verify otp

exports.verifyOtpController = async(req,res)=>{
    try {
        const {email, otp} = req.body

        const user = await users.findOne({email})

        // check existing user or not
        if(!user) {
            return res.status(404).json({message:"User not found"})
        }
        console.log(user.otp,otp);
        

        // check otp is correct or not
        if(user.otp !==otp){
            return res.status(400).json({message: 'Invalid OTP'})
        }

        if(Date.now() > user.otpExpiry){
            return res.status(400).json({message:"OTP expired"})
        }

        // mark user as verified
        user.verified = true
        user.otp=''
        user.otpExpiry =null
        await user.save()

        res.status(200).json({message:"User verified successfully"})
        
    } catch (error) {
        res.status(500).json({message:'Failed to verify OTP'})
    }
}

// 3. Resend otp
exports.resendOtpRegController = async(req,res)=>{
    try {
        const {email} = req.body
        
        const user = await users.findOne({email})
        if(!user){
            return res.status(400).json({ message: 'User not found' })
        }
        if(user.verified){
            res.status(400).json({message: 'User already verified'})
        }

        // user is present and not verified , create new otp
        const otp = Math.floor(100000 + Math.random()* 900000)
        const otpExpiry = Date.now()+140000

        user.otp = otp
        user.otpExpiry= otpExpiry

        await user.save()

        // sens otp via nodemailer
        await transporter.sendMail({
             from:process.env.NodemailerMail,
             to: email,
             subject: "Resend OTP Verification",
             text: `Your OTP for verification is: ${otp}`
        })
        res.status(200).json({message: 'OTP resent successfully'})
        
    } catch (error) {
        res.status(500).json({ message: 'Failed to resend OTP' })
    }
}


// Login 
exports.loginController= async(req,res)=>{
    try {
        // user entered values
        const {email, password} = req.body
        console.log(req.body);
        

        const loginUser = await users.findOne({email})
        console.log(loginUser);
        
        if(!loginUser || !loginUser.verified){
            return res.status(401).json({ message: "User not found or not verified" })
        }

        // descrypt user password to check password is correct or not
        const decryptedPassword = cryptojs.AES.decrypt(loginUser.password,process.env.PASSWORD_SECRET_KEY).toString(cryptojs.enc.Utf8);
        console.log(decryptedPassword);
        

        // check user entered password and password in the mongodb are same
        if(decryptedPassword !== password){
            return res.status(401).json({ message: "Incorrect password" })
        }
        
        res.status(200).json(loginUser)
    } catch (error) {
        res.status(500).json({ message: "Failed to log in" })
    }
}