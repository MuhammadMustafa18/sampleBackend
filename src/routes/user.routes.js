import { Router } from "express";
import { loginUser, logoutUser, registerUser, refreshAccessToken} from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
const router = Router()
// step 2, /users/register (by istelf - no user types)
router.route("/register").post(
  upload.fields([ // middleware, jaane se pehle ye karke jaana when a req is mode on the /register page
    {
      name: "avatar", // frontend main bhi avatar hi ho name
      maxCount: 1,
    },
    {
      name: "coverImage", // frontend main bhi avatar hi ho name
      maxCount: 1,
    },
  ]),
  registerUser
); // takes to controller the actual stuff
// router.route("/login").post(login);

router.route("/login").post(loginUser)
// pehle middleware  phir logout
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);

export default router // marzi ka naam when export default