import { asyncHandler } from "./asyncHandler.js"; // extention rakho
// registeruser is assigned the value returned by our async handler which takes a 
// function as an input, which we have defined, the function itselftakes a request and 
// a response and sets it true and sends ok message, error handling in async handler, no regstration YET
import {User} from "../models/user.model.js"
import {ApiError} from "../util/ApiError.js"
import {uploadCloudinary} from "../util/cloudinary.js"
import { ApiResponse } from "../util/ApiResponse.js";
import cookieParser from "cookie-parser"
import jwt from "jsonwebtoken"
const generateAccessAndRefreshTokens = async(userId) => {
    try {
      // process is keys(used for encoding), then signing(for data) - keys used here, token generated
      //  as soon as signed in, and sent to client(browser maybe)
      // The client receives the JWT token from the server and includes it in subsequent requests to access protected resources.
      //console.log(userId)
      const user = await User.findById(userId);

      const accessToken = user.generateAccessToken();
      
      const refreshToken = user.generateRefreshToken();
      user.refreshToken = refreshToken;
      // await user.save({ validateBeforeSave });
      await user.save({  });

      return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, error?.message)
    }
}


const registerUser = asyncHandler(async (req,res) => {
    // res.status(200).json({
    //     message:"ok"
    // })

    // get user data
    const {fullname, email, username, password}= req.body // sara data from body(url/form ke liye diff)
    console.log("email ", email) // testing via postman, raw post, json
    // validation
        // if(fullname === ""){
        //     throw new ApiError(400,"fullname is required") // error, message
        // }
        // better way
        if(
            [fullname, email, username, password].some((field) => 
            field?.trim() === ""))
            {
                throw new ApiError(400,"fullname is required")
            }
    
    // already existing account
    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if(existedUser){
        throw new ApiError(409, "user already exists");
    }
    // check for images
    // [0] means first property
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if (
      req.files &&
      Array.isArray(req.files.coverImage) &&
      req.files.coverImage.length() > 0
    ){
        coverImageLocalPath = req.files?.coverImage[0]?.path;
    }
      if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is needed");
      }
    // uplaod images
    const avatar = await uploadCloudinary(avatarLocalPath);
    const coverImage = await uploadCloudinary(coverImageLocalPath);
    
    if(!avatar){
        throw new ApiError(400, "Avatar was not uploaded");
    }
    
    // creater user object for mongoDB 
    const user = await User.create(
        {
            fullname,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase()
            // watch history daalenge, abhi nahi
        }
    )
    // if(!user){
    //     throw new ApiError(400, "User was not created");

    // }
    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken" //  created user wont have these two
    );
    if(!createdUser){
        throw new ApiError(500, "user was not created");
    }
    
    // remove password and refresh token from response
    // check for user creation
    // return res
    return res.status(200).json(
        new ApiResponse(200, createdUser, "user was created/registered")
    );
    // return ApiResponse
})

const loginUser = asyncHandler(async(req,res) => {
    // data lao
    // console.log("yo")
    const {email, username, password} = req.body // how do they differ??
    if(!username && !email){
        throw new ApiError(400, "username or email is required")
    }
    // username/email
    const user = await User.findOne( // mongomethod
        {  
           $or: [{username}, {email}]
        }
    )
    if(!user){
        throw new ApiError(404, "user doesnt exist");
    }
    // user exists
    // humaare methods on user, which was returned by mongo
    // mongo ke methods on User
    const isPasswrodValid = await user.isPasswordCorrect(password)
    // notice they dontsend anything when not correct
    if (!isPasswrodValid) {
      throw new ApiError(404, "user doesnt exist");
    }
    // passcheck
    // access and refresh token
    // console.log("function to be called");
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)
    // console.log("function called")
    // send cookies
    const  loggedInUser= await User.findById(user._id).select("-password -refreshToken")
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
    .cookie("accessToken", accessToken, options) // sets cookies 
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, {user: loggedInUser, accessToken, refreshToken}, "User Logged in successfulyy") 
        // send a response to client in json format, new instance of a response so that in proper format
    )
})
// RUN KAB HO? ROUTES HANDLES THAT
const logoutUser = asyncHandler(async(req,res) => {
    User.findByIdAndUpdate(
        req.user._id, // query
        { // kya kya update karna hai is dealt by set operator
            $set: {
                refreshToken: undefined // didnt really understand the refresh and access thing usage
            }
        },
        {
            new: true
        }
    )
    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, "Logged out"))
})

const refreshAccessToken = asyncHandler(async(req, res) => {
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
        if(!incomingRefreshToken){
            throw new ApiError(401, "unauthorized request")
        }
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id)
        // .select();
        if(!user){
            throw new ApiError(401, "invalid refresh token")
        }
        if (user?.refreshToken !== incomingRefreshToken) {
          throw new ApiError(401, "invalid refresh token or expired");
        }
        const options = {
            httpOnly:true,
            secure:true
        }
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
        return res
          .status(200)
          .cookie("accessToken", accessToken, options)
          .cookie("refreshToken", newRefreshToken, options)
          .json(
            new ApiResponse(200, {
                accessToken, refreshToken
            }, "Access Token Refreshed"
        )
          )
    } catch (error) {
        throw new ApiError(401, error?.message)
    }
}
)
const changeCurrentPassword = asyncHandler(async(req,res) => {
    const {oldPassword, newPassword} = req.body
    const user = await User.findById(req.user?.id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password")
    }
    user.password = newPassword
    // pre hook chalega and would hash it before saving
    await user.save({validateBeforeSave: false})
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {},
          "Password changed Successfully"
        )
      );
})
const getCurrentUser = asyncHandler(async(req,res) => {
    return res.status(200).json(200,req.user, "current user fetched successfully")
})
const updateUserAvatar = asyncHandler(async(req,res) => {
    // req.files multiple files(avatar and coverimage)
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(401, "Avatar file is missing, ", error?.message)
    }
    const avatar  = await uploadCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(401, "Avatar file is not uploaded on cloudinary, ", error?.message);
    }
    const user = User.findByIdAndUpdate(
        req.user._id,
        {
            
                $set:{
                    avatar: avatar.url // both avatars diff, first is our User's prop and other is the uploaded one
                }
            
        },
        {new: true},


    ).select("-password") // cuz we return the user and we dont want the passowrd be returned

    return res
          .status(200)
          
          .json(
            new ApiResponse(200, 
                user
            , "Avatar is updated"
        ))
})
const getUserChannelProfile = asyncHandler(async(req,res) => {
    const {username} = req.params
    if(!username?.trim()){
        throw new ApiError(400, "username is missing")
    }
    // User.find({username})
    const channel = await User.aggregate([
      {
        $match: {
          username: username?.toLowerCase(),
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers",
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "subscriber",
          as: "subscribedTo",
        },
      },
      {
        $addFields: {
          // additional fields
          subscribersCount: {
            $size: "$subscribers",
          },
          subscribedToCount: {
            $size: "$subscribedTo",
          },
          isSubscribed: {
            $cond: {
               if: {$in: [req.user?._id, "$subscribers.subscriber"]},
               then: true,
               else: false
            }
          },
        },
      },
      // project these extra
      {
        $project: {
            fullname: 1,
            username: 1,
            subscribersCount: 1,
            subscribedToCount:1,
            isSubscribed: 1,
            avatar: 1,
            coverImage,
            email: 1
        }
      }
    ]);
    if(!channel?.length){
        throw new ApiError(404, "channel not exists")
    }
    return res.status(200).json(new ApiResponse(200,channel[0], "channel fetched successfully"))
})
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserAvatar,
}; // same naam ka with brackets, no exprot default