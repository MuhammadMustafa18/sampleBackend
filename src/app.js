import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser"
const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN, //urls that can make requests
    credentials: true // allows client sides to request cookies, auth
}
)) 

app.use(express.json({limit:"16kb"})) //json acceptable(middleware related)

app.use(express.urlencoded({extended: true, limit:"16kb"})) // space = %20,allow

app.use(express.static("public")) // folder in backend, for assets

app.use(cookieParser()) // user's cookies in our server, server can perform crud

import userRouter from "./routes/user.routes.js" // marzi ka naam, router import
// routes declare
// app.get step 1 /user aate hi goes that file
// app.use("/users", userRouter) // goes in our projects router file, what happens is defined there
 
app.use("/api/v1/users", userRouter);  // we're actually making a api not just some page


export {app}