const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    email: {
        type: String,
        required: true,
    },
    username: {
            type: String,
            required: true,
    },
    password: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        default: "pending",
    },
    location: {
        type: String,
    },
    age: {
        type: Number,
    },
    work : {
        type: String,
    },
    dob : {
        type : Date,
    },
    description: {
        type: String,
    },
    verified: {
        type: Boolean,
        default: false,
    }, 
    

    });

module.exports = mongoose.model("User", userSchema);
