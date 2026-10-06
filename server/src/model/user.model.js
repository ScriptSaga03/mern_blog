import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true,
        minLength:3,
        maxlength: 50
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true
    },
    password:{
        type:String,
        required:true,
        select:false,  // Iska matlab normal query mein password automatically nahi aayega
        minLength:8
    },
    role:{
        type:String,
        enum:["user","admin"],
        default:"user"
    }
},{
    timestamps:true
});


const User = mongoose.model("User", userSchema);

export default User;