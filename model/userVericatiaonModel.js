const mongoose = require('mongoose');
const userVerficationSchema=mongoose.Schema({
    userId: String,
    uniqueString: String,
    createdAt: Date,
    expiresAt: Date,
})
module.exports=mongoose.model("verfication",userVerficationSchema)