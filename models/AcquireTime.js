const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AcquireTime = new Schema({
    date:{
        type:String,
        required: true
    }, 
    minutes: {
        type:String,
        required:true
    }, 
    day: {
        type:String,
        required:true
    },
    class: {
        type:String
    },
    user: {
        type: String, 
        required: true
    }
})

mongoose.model('acquireTime', AcquireTime)