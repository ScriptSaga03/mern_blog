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
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: {
        type: String,
        select: false
    },
    emailVerificationExpires: {
        type: Date,
        select: false
    }
},{
    timestamps:true
});

// // CREATE INDEX
// userSchema.index({email:1});


const User = mongoose.model("User", userSchema);

export default User;