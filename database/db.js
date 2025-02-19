const mongoose = require('mongoose')


// 2. get connection string
const connectionString = process.env.DATABASEURL
console.log(connectionString);


// 4. connect with mongodb
mongoose.connect(connectionString).then(res=>{
    console.log('Mongodb atlas connected successfully with pf server');
    
}).catch(err=>{
    console.log('Mongodb atlas connection failed');
    console.log(err);
    
})

