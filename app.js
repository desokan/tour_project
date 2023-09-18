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

app.all("*", (req, res, next) => {
  const err = new Error(`Me, I Can't find ${req.originalUrl} on this server!`);
  err.status = "fail";
  err.statusCode = 404;
  next(err);
});

app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
});

export default app;
