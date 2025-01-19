import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true, // for search
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  fullname: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  avatar: {
    type: String, // cloudinary
    required: true,
  },
  coverImage: {
    type: String, // cloudinary
  },
  watchHistory: [
    // array hai
    {
        type: Schema.Types.ObjectId,
        ref: "Video"
    }
  ],
  password: {
    type: String,
    required: [true, "Password is required"]
  },
  refreshToken: {
    // env se ayega - sessions cookies kuch hai
    type:String
  }
},
{
    timestamps:true
}

);
// step 1, get access of user data, dont do this cuz this ka access nahi hai call back ke paas, function ke paas hoga
// userSchema.pre("save", () => {

// })
// step 2: next ka access, ab next kya hai?
// next makes sure next function or middleware is executed once this is done
userSchema.pre("save", async function(next){
    if(this.isModified("password")){
        // agar password change hua hai
        this.password = await bcrypt.hash(this.password, 10) // 10 rounds
    }
    // baar baar save pe baar baar password hash hojayege,  [picture save pe bhi encryption lag gayi to ye na karo]

    next() // next middleware
    // database main encrypted store hua
    // but user ne to ye mustafa123 daala
})

userSchema.methods.isPasswordCorrect = async function(password){
    // own function to check
    return await bcrypt.compare(password, this.password) // bheja hua aur encrypted wala
}

userSchema.methods.generateAccessToken = function(){
  console.log("generateAccessToken called");
    const token = jwt.sign(
      // data(payload)
      {
        _id: this._id, // from mongo
        email: this.email,
        username: this.username,
        fullname: this.fullname,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
      }
    );
     console.log("Access Token:", token);
     return token;
}
userSchema.methods.generateRefreshToken = function () {
  console.log("generateAccessToken called");
    const token = jwt.sign(
      // data(payload)
      {
        _id: this._id, // from mongo
        
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
      }
    );
    console.log("refresh Token:", token);
    return token;
};

export const User = mongoose.model("User", userSchema);
