const users = require('../model/userModel')
const nodemailer = require('nodemailer')


// nodemailer
const transporter = nodemailer.createTransport({
    service:"gmail",
    auth:{
        user : process.env.NodemailerMail,
        pass: process.env.NodemailerPassword
    }
})

// register
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


            }

        }else{
            // check phone number is registered with another verified user
            const phoneNumberExists = await users.findOne({phoneNumber})

            if(phoneNumberExists && phoneNumber.verified){
                return res.status(400).json({message:'Phone number already registered with a verified user'})
            }

            // if both email and phone number are unique , , create a new unverified user
            const newUser = new users({
                userName,
                email,
                phoneNumber,
                password,
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