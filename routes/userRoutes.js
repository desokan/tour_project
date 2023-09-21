import express from "express";
import * as authController from "../controllers/authController.js";
import * as userController from "../controllers/userController.js";

const router = express.Router();

router.route("/signup").post(authController.signup);
router.route("/login").post(authController.login);

router.route("/").get(userController.getAllUsers);

export default router;
