import express from "express";
import morgan from "morgan";
import { requestTime } from "./middleware/reqMiddleware.js";
import tourRouter from "./routes/tourRoutes.js";
import { getPublicPath } from "./utils/pathUtils.js";

const app = express();

// MIDDLEWARES
app.use(express.static(getPublicPath()));
app.use(express.json());
app.use(requestTime);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ROUTES
app.use("/api/v1/tours", tourRouter);

export default app;
