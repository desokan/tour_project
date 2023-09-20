import User from "../models/userModel";
import { catchAsync } from "../utils/catchAsync.js";

import User from "../models/userModel";
import { catchAsync } from "../utils/catchAsync.js";

export const signup = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;
  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
  });

  res.status(201).json({
    status: "success",
    data: {
      user: newUser,
    },
  });
});
