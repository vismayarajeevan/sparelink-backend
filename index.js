const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
dotenv.config()

const router = require('./routes/router')
require('./database/db')

const app =express()
app.use(cors())
app.use(express.json())
app.use(router)

const PORT = process.env.PORT || 3000
app.listen(PORT,(req,res)=>{
    console.log(`Server is running in port ${PORT}`);
    
})



