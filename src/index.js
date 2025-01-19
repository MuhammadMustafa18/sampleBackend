//require('dotenv').config({path: "./env"})

import connectDB from "./db/index.js";
import dotenv from "dotenv"
dotenv.config({ path: "./env" });
import { app } from "./app.js";
// import express from "express"
// //iffys

connectDB().then(() => { // the connect's consoles didnt work why?
    app.listen(process.env.PORT || 8000)
    console.log(`Mongodb connection successful ${process.env.PORT}`);
}).catch((err) => {
    console.log("Mongodb connection failed", err)
})


// const app = express()
// ;( async () => {
//  try {
//     mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
//     app.on("error", (error)=>{
//         console.log("error", error)
//         throw error
//     })
//     app.listen(process.env.PORT, () => {
//         console.log(`app is listening on port ${process.env.PORT}`)
//     })
//  } catch (error) {
//     console.error("ERROR: ",error)
//     throw error
//  }
// })()
