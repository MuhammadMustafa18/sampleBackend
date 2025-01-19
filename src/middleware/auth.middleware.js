import  jwt  from "jsonwebtoken";
import { asyncHandler } from "../controllers/asyncHandler.js";
import { ApiError } from "../util/ApiError.js";
import { User } from "../models/user.model.js";

// if cookies have tokens then store his info in req.user
export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        // next means ye karke yahan lejao
        const token = req.cookies?.accessToken || // given in app.js, accessToken given in controller
          req.header("Authorization")?.replace("Bearer ", "") // agar auth header main "bearer " milay to replace with empty space 
          // how is the token stored: bearer <token>, bearer space hataya to token bacha
        console.log(token);
        if(!token){
            throw new ApiError(401, "unauthorized request")
        }
        // if token then decode the info from it
        const decodedToken =  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken") // jwt sign main hai ._id
        if(!user){
            throw new ApiError(401, "invalid access token");
        }
        // id agaya
        req.user = user; // what this access leliya tha tokens ka right before logout, to be used in logout functionality
        next()
        // how to use middleware(in routes)
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid access token");
    }
})
