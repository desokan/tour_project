import Review from './../models/reviewModel.js'
import { catchAsync } from "./../utils/catchAsync.js";

export const getAllReviews = catchAsync(async (req, res, next) => {
  const review = await Review.find();

  res.status(200).json({
    status: "success",
    results: review.length,
    data: {
      data: review,
    },
  });
});

export const createReview = catchAsync(async (req, res, next) => {
  const newReview = await Review.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      review: newReview,
    },
  });
});