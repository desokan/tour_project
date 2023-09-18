# ERROR HANDLING

## TOPIC INTRO

- Let's see how we can use Express and environment variables to build a robust error-handling workflow.

- Node Debugger (NDB) tools
  resume script execution (play icon)
  step into next function call (downward arrow with dot)
  step out of current function (upward arrow with dot)
  step (right arrow with dot)
  step over next function call (curved arrow with dot)
  deactivate breakpoint (thick arrrow with diagonal cross)
  pause on exception

## 112. xxx HANDLING UNHANDLED ROUTES

- Let's write a handler for `undefined` routes or routes that we didn't assign any handler.
- This is for all the routes that are not caught by our routers.
- We will do this inside `app.js` file.
- Remember that all the middleware functions are executed in the order they are in the code.
- So, any request that makes it to this point were not caught by all our routes.
- We will add the middleware right after all our defined routers.
- In Express, we can use `app.all()`. That will run for all the HTTP methods.
- We use `*` to handle all the URLs that were not handled.
- We use `req.originalUrl` which is a property that we have on the `req`. This is the URL that was requested.

```js => app.js
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);

app.all("*", (req, res, next) => {
  // 002
  res.status(404).json({
    status: "fail",
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});
```

- You can test this in Postman by sending any request to any endpoint that doesn't exist in our code.

## 113. xxx AN OVERVIEW OF ERROR HANDLING

- Two types of errors that can occur: `Operational` errors and `Programming` errors.
- `Operational` errors are problems that we can predict will inevitably happen at some point in the future.
- And so we just need to handle them in advance. They depend on the user, or the system, or the network.
- E.g., accessing an invalid route, inputting invalid data, or an application failing to connect to the database.
- `Programming` errors are simply bugs that developers introduce into our code.
- Like, to read properties from an undefined variable, using await without async etc.

- So, when we're talking about error handling with Express, we mainly just mean `operational` errors.
- And Express actually comes with error handling out of the box.
- So, all we have to do is to write a `global express error handling middleware`.
- This will then catch errors coming from all over the application.
- This allows for a nice separation of concerns.
- We don't have to worry about error handling in our model, controllers, or really anywhere in our application.

## 114. xxx IMPLEMENTING A GLOBAL ERROR HANDLING MIDDLEWARE

- The goal is to write a middleware function, which is going to be able to handle operational errors.
- Like when we send res.status(404) inside the `app.all()` route. The goal is to do that in one central place.
- At present, all over the place we have `res.status()` snippets, which handle the errors.
- We also have `try-catch` block. We want to get rid of all of these and handle the error in one central middleware.

- To define an error handling middleware, we need to give the middleware function `four arguments`.
- And Express will then automatically recognise it as an error handling middleware.
- And therefore, only call it when there is an error.
- The arguments are: `err, req, res, next`.
- This middleware function is an error first function, which means that the first argument is the `error`.

- In general, there are two steps, `first` we create the middleware.
- Then, `second`, we will create an error so that this function will get called.
- So all we really want to do in order to handle this error is to send back a response to the client.
- We want to read the `statusCode and status` from the `error object` and also set the `status`. I also define a default.
- The `500` error code means, internal server error. We do the same for `err.status`. The `400` status code, means `fail`.
- We can then use `err.statusCode`, and then send some json. The `message` will be coming from the `err.message`.

```js => First step = 001
app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
    })
})
```

- In the second step, we will use the unhandled route we created before.
- We throw a new error by using the built in error constructor. We save this in the `err` variable.
- And now we can pass in a string and that will then be the `err.message` property.
- Along with the error, we also can set the `status` and `statusCode` properties on the `err` objects.

- We then use the `next()` in a special way to read that next step. We need to pass that `err` into next => `next(err)`.
- Now, if the next function receives an argument, no matter what it is, and where it happens
- Express will automatically know that there was an error.
- And it will then skip all the other middlewares in the middleware stack.
- And sent the error that we passed in to our global error handling middleware, which will then be executed.

```js => second step
app.all("*", (req, res, next) => {
  const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  err.status = "fail";
  err.statusCode = 404;
  next(err);
});
```

```js => app.js
import express from "express";
import morgan from "morgan";
import tourRouter from "./routes/tourRoutes.js";

const app = express();

app.use(express.static(`${__dirname}/public`));

// MIDDLEWARES
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
app.use(express.json());
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// ROUTES
app.use("/api/v1/tours", tourRouter);

app.all('*', (req, res, next) => {
    const err = new Error(`Can't find ${req.originalUrl} on this server!`);
    err.status = 'fail';
    err.statusCode = 404;
    next(err);
});

app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
    })
}
```

- Test this in postman by trying to access `127.0.0.1:3000/api/tours`, without the `v1`.
- We could now go ahead and try to implement this kind of stuff everywhere in all our handlers.
- For example, in `tourController.js`. So replacing `res.status()` with the type error we just created.

But what I want to do for now is to create our own error class. So that we don't have to write all of this code and instead have a more like streamlined class. So that's a common practice, and so let's do that in the next video.

```js => app.js
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);

// 001
app.all("*", (req, res, next) => {
  // 002
  res.status(404).json({
    status: "fail",
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});
```

## 115. xxx BETTER ERRORS AND REFACTORING

Let's now create a better and more useful error `class`, LAnd starting with that error class, let's create a new file in our `util` folder and call it `appError.js`.

`001` Create class `AppError`, and inherit from the built-in `Error`. What we're going to pass into a new object created from the `AppError` class is going to be the `message` and the `statusCode`. We pass these into the `constructor`. Remember the constructor method is called each time that we create a new object out of this class.

`002` When we `extend` a parent class, we must call `super` in order to call the parent `constructor`, and we do that with `message` because the `message` is actually the only parameter that the built-in Error accepts.

`003` Remember the status can either be `fail` or `error`. When the statusCode is a `400`, then the `status` will be `fail`, and if it's a `500`, then it's going to be an `error`.

`004` Now next up, all the errors that we will create in this class will all be `operational` errors. So, errors that we can predict will happen in some point in the future. I will also create a `isOperational` property, and set it to `true`. So all of our errors will get this property set to true, and I'm doing that so that later we can then test for this property and only send error messages back to the client for these operational errors that we created using this class.

`005` We will add this line of code here, which is `Error.capturestackTrace`, and at first we need to specify the current object, which is `this`, and then the `AppError` class itself, which is going to be `this.constructor`. And so this way when a new object is created, and a constructor function is called, then that function call is not going to appear in the `stack trace`, and will not pollute it. Remember to export AppError.

```js => appError.js
// 001
class AppError extends Error {
  constructor(message, statusCode) {
    super(message); // 002
    this.statusCode = statusCode; // 003
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true; // 004
    Error.captureStackTrace(this, this.constructor); // 005
  }
}
module.exports = AppError;
```

`001` We also need to capture the `stack trace`. Now, what do I mean by `stack trace`? I will log it here to the console. So each and every error gets this stack. So `err.stack` will basically show us where the error happened.

So let me run this here now in Postman and send a request from `127.0.0.1:3000/api/tours`. In the terminal, we see the error and then also where it happened. So, in this case, of course, in `app.js`. So, that's where we created this error, and so it's now in our stack trace, and it also shows us the entire call stack, which in the end originated in this error. So we kind of want to preserve that and also at the same time not add this class, to that stack track.

```js => app.js
app.use((err, req, res, next) => {
  console.log(err.stack); // 001
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
});
```

Great, just one question that you might have is 'Why didn't I set `this.message` equal to `message` in the `AppError`?' Well, that's just because, I called the parent class `super(message)`, and the parent class is `Error`, and whatever we pass into it is going to be the `message` property. And so, basically, in here by doing this parent call we already set the `message` property to our incoming message. And in `app.js` we're just going to import it. And so now let's actually go ahead and use it.

`001` I will now create the error right here inside of `next()`. So, `new AppError`, and then the `message`, and the `status code`. Right, and the `fail`, will then automatically be figured out.

```js => app.js
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404)); // 001

  // You could also break it into two steps.
  // const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404)
  // next(err);
});
```

And finally I also want to export the `app.use((err, req, res, next) => {}` middleware. So basically, the handler, because throughout the rest of the section, we're going to build a couple of different functions for handling different types of errors, and so I want all of these functions to be all in the same file. Let's now actually create an `errorController.js` file in our controller folder.

`001` And here I wanted to paste that middleware function. Now, I will cut the callback function => `app.use((err, req, res, next) => {}` in `app.js` and paste it here. 'm going to export it here as the `module.exports` because the other handler functions that we're going to create later on, I will not export them from here. So they are just going to be helpers.

```js => errorController.js
// 001
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};
```

`001` And now back into our `app.js` file, we of course now need to plug in that middleware function here. First, we import or require from the `errorController`. So each and every error gets this stack. So `err.stack` will basically show us where the error happened.

Let's test it again from `127.0.0.1:3000/api/tours` in Postman. It should still work as before.

```js => app.js
const globalErrorHandler = require("./controllers/errorController");
app.use(globalErrorHandler); // 001.
```

FINAL CODE

```js => AppError.js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
```

```js => errorController.js
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};
```

```js => app.js
const express = require("express");
const morgan = require("morgan");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");

const app = express();
app.use(express.static(`${__dirname}/public`));

// MIDDLEWARES
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(express.json());

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// ROUTES
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
app.use(globalErrorHandler);

module.exports = app;
```

## 116. xxx CATCHING ERRORS IN ASYNC FUNCTION

In this lecture, let's implement a better way of catching errors in all our `async` functions. So right now, in all our async functions in the `tourController.js`, we have `try-catch` blocks. And so all of them are async functions and that's how we usually catch the errors inside of an asynchronous function. So using a `try-catch` block. Now that really makes our code look messy and unfocused.

Also, we have a lot of duplicate code in the `catch` blocks in each of the handlers. All we're doing is to send the response, and that response would actually not even be sent here but instead in our `global error handling middleware`. And the solution is to basically take the `try-catch` block out of here and put it on a higher level in another function.

`001` Using the `createTour` as an example, we will create a `catchAsync` function, and then wrap the `async` function into that function. Into this `catchAsync` function, we will pass in a `fn` function. And that function is the `async()` function of the `createTour` handlers. Let's also go ahead and remove the entire `catch` block from our code and then the `try` keyword.

`002` Now, in the `createTour` handler, we will call the `catchAsync` function and pass the `async` function into it. We do this because this is where we want to catch the asynchronous errors. The `async` function now will have `next` because, we need the `next` function in order to pass the error into it so that that error can then be handled in the global `error handling middleware`.

`003` Next up, we then call the same `async` which is now the `fn` function. And the function is an `async` function that return promises. Now, when there is an error, that basically means that the promise gets rejected. We can then chain the `catch()` to the `fn()`, instead of catching it in the try catch block. Our error is now being handled inside the `catchAsync`.

```js => tourController.js
// 001
const catchAsync = (fn) => {
  // 003.
  fn(req, res, next).catch((err) => next(err));
};

// 002
exports.createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);
  res.status(201).json({
    status: "success",
    data: {
      tour: newTour,
    },
  });
});
```

Now there are actually two issues with the way that this is implemented right now which will make it not work. First one, in `003` above, the `fn` function call has no way of knowing `req`, `res`, and `next`. We did not pass them directly into `catchAsync` as arguments.

Second, in `002` above, we are actually calling the `catchAsync()` function using the parentheses. And then inside of `catchAsync` in `001`, we are also then right away calling the `fn` function, and that's not how it is supposed to work. The `createTour` in `002` should really be a function but not the result of calling a function. It should just sit here and wait until `express` calls it. And express will of course call it as soon as someone hits the route that needs the `createTour` control function.

`001` And so the solution to that is to basically make the `catchAsync` function return another function which is then going to be assigned to `createTour` and so that function can then later be called when necessary. So let's `return` an `anonymous` function and so this is now the function that express is going to call. And so here is where we then specify `req, res, and next`. That's our `catchAsync` function.

`002` We could simplify this because in JavaScript by simply passing the function, and it will then be called automatically with the parameter that this callback receives. So, `(err) => next(err)`, is the same as writing `next`.

```js => tourController.js
const catchAsync = (fn) => {
  // 001
  return (req, res, next) => {
    // 002
    // fn(req, res, next).catch((err) => next(err));
    fn(req, res, next).catch(next);
  };
};

exports.createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);
  res.status(201).json({
    status: "success",
    data: {
      tour: newTour,
    },
  });
});
```

So this here, `fn(req, res, next).catch(next)`, is where all the error catching magic happens, and this is, in fact, what allows us to get rid of the catch block that we had previously. Now anyway, if we now create a new tour and some error happens, for example, from an invalid input, then that error should of course be catched here in the `catch` function, and will then be propagated to our `global error handling middleware` and so that one will then send back the error response that we're expected to receive.

And so let's now actually test this out by simply creating a new tour in Postman. In the body of the route, get rid of one of the required filed, like the name, duration fields. And so that should trigger an error. Now here, you see a `500` Internal Server Error, which is simply due to the fact that right now the error that was propagated to the error handling middleware did not have any status code specified and so remember our default is `500` and so that's the one that was then sent back. And of course, we need to fix that and we will do that in a later lecture in this course.

Now let's go ahead and export this catch function `const catchAsync = (fn) => {}` into its own file. Inside the `util` folder, create a new file and name it `catchAsync.js`.

```js => catchAsync.js
module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
```

Back in our `tourController.js` file we now need to `import` this function. And now all we need to do is to get rid of all the other `catch` blocks and wrap all the handlers into the `catchAsync`.

```js => tourController.js
// First, getAllTour
exports.getAllTours = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const tours = await features.query;

  // SEND RESPONSE
  res.status(200).json({
    status: "success",
    results: tours.length,
    data: {
      tours,
    },
  });
});

// Next, getTour
exports.getTour = catchAsync(async (req, res) => {
  const tour = await Tour.findById(req.params.id);
  // Tour.findOne({ _id: req.params.id })
  res.status(200).json({
    status: "success",
    data: {
      tour,
    },
  });
});

// Next, createTour
exports.createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);
  res.status(201).json({
    status: "success",
    data: {
      tour: newTour,
    },
  });
});

// Next, updateTour
exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      tour,
    },
  });
});

// Next, deleteTour
exports.deleteTour = catchAsync(async (req, res, next) => {
  await Tour.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});
```

We can test the different handlers individually. Let's try to get one tour using the Get Tour route in Postman with an invalid id, e.g. 127.0.0.1:3000/api/v1/tours/qwert. And indeed, we get our error message and again with the `500` status code, which is not correct. We're going to take care of that later.

So right now, let me show you that the `500` comes from `errorController.js` because right now there's no status code inside of the error that we get because these errors, they actually come from Mongoose and so we have no way of adding a status code to these errors. Or actually, of course, we could do it, but that would just be even more confusing and so we're going to find another way later in this section.

## 117. xxx ADDING 404 NOT FOUND ERRORS

When we tried to get a tour for a a weird looking `id` that does not exist, the error that we got is that Mongoose could not convert the `id` string into a valid ID for MongoDB.

But what happens when we actually use a valid MongoDB ID but that still doesn't exist? When we try to get a tour with this id, our result is null. All right, and so, that's not really what we want. What we want is to show a `404` status code and say that this tour was not found. Let's now use our `AppError` class in order to implement that. Keep in mind that the tour that we get back is `null`. So, `null` that we can now test for.

`001` So, if we go to our `getTour` handler, let's now implement if there is no tour and in that case we will create a `new AppError` error which we pass inside a `next()`. So, in order to jump straight into oUr error and linked middleware. Also, `return` this function immediately and not move on to the next line.

```js => tourController.js
const AppError = require("./../utils/appError");

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);
  // Tour.findOne({ _id: req.params.id })

  //001
  if (!tour) {
    return next(new AppError("No tour found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      tour,
    },
  });
});
```

So, we created an error and we then pass that error into `next` and as soon as `next` receives something, it assumes that it is an error and it will jump straight into the `global error handling middleware` which will then send the response for us.

So, let's copy the `if()` and put it in `updateTour`, `deleteTour` handlers. In `delete` tour, you should assign `await Tour.findByIdAndDelete(req.params.id)` to a value.

Now maybe you noticed that I did not add this `404` error here in this `getAllTour` handler. When there is zero results found, for example, there are no results matching for a filter, or because the page was requested that doesn't exist, then of course we could consider sending a `404` error and saying that the data was not found but in my opinion and also the opinion of other developers, that is not entirely correct in this request because there was not really an error.

I mean, the request was correctly received. The database correctly searched for the tours and found exactly zero records and so, these zero records are exactly what we're goint to send back along with the 200 HTTP code.

FINAL CODE

```js => tourController.js
const Tour = require("./../models/tourModel");
const APIFeatures = require("./../utils/apiFeatures");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const tours = await features.query;

  // SEND RESPONSE
  res.status(200).json({
    status: "success",
    results: tours.length,
    data: {
      tours,
    },
  });
});

// GET ONE DOCUMENT
exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);
  // Tour.findOne({ _id: req.params.id })

  if (!tour) {
    return next(new AppError("No tour found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      tour,
    },
  });
});

// CREATE DOCUMENT
exports.createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);
  res.status(201).json({
    status: "success",
    data: {
      tour: newTour,
    },
  });
});

// UPDATE A DOCUMENT
exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!tour) {
    return next(new AppError("No tour found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      tour,
    },
  });
});

// DELETE DOCUMENT
exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    return next(new AppError("No tour found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: "$difficulty" },
        numTours: { $sum: 1 },
        numRatings: { $sum: "$ratingsQuantity" },
        avgRating: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // 2021

  const plan = await Tour.aggregate([
    {
      $unwind: "$startDates",
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$startDates" },
        numTourStarts: { $sum: 1 },
        tours: { $push: "$name" },
      },
    },
    {
      $addFields: { month: "$_id" },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      plan,
    },
  });
});
```

## 118. ERRORS DURING DEVELOPMENT VS PRODUCTION

In this video, we're going to implement some logic in order to send different error messages for the `development` and `production` environment. The idea is that in production, we want to leak as little info about our errors to the client as possible.

We could log that error info also to the console, but I think it's way more useful to have that info right in Postman, in this case. So, we already know how to distinguish between the development and the production environment. And so, let's do that.

```js => errorController.js
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else if (process.env.NODE_ENV === "production") {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
};
```

This here looks kind of messy, so let's export these into their own functions and also because we're actually going to add a lot more code in this else branch. We will create `sendErrorDev` and `sendErrorProd`. The function should then receive the `error`, and we also need to pass in the `response` subject. That is because that's how we can actually send the response. So we need the `response subject` in order to be able to run this code.

```js => errorController.js
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    sendErrorProd(err, res);
  }
};
```

Let's now take it to the next level and talk about `operational` errors again. In the `appError.js` class, remember that we mark all the errors that we create, using AppError `isOperational` set to `true`. In fact, it's only these operational errors for which we want to send the error message down to the client. At least in `production`.

So when we, on the other hand, have a `programming` error, or some other `unknown` error that comes, for example, from a third party package, we do not want to send any error message about that to the client in production. And so let's now use the `isOperational` property in our error controller.

```js => errorController.js
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

    // Programming or other unknown error: don't leak error details
  } else {
    // Log error. We'll first log the error for ourselves. Now there are real logging libraries on mpm, that we could use here instead of just having this simple console.error, but just logging the error to the console will make it visible in the logs on the hosting platform that you're using.
    console.error("ERROR 💥", err);

    // Send generic message. If error.isOperational only in that case we actually want to send this error here. So let's say, res.status and we're simply going to send a generic `500` code and then json. The status will be error.
    res.status(500).json({
      status: "error",
      message: "Something went very wrong!",
    });
  }
};
```

Now in order for this to work, there is something really, really important that we need to do. Right now there are errors that are, for example, coming from MongoDB, which we do not mark as `operational`. In this case, they would right now simply be handled using this generic error message in the `else` block. For example, a `validation` error

Again, they are right now not marked as operational, but we of course need to mark them as operational so that we can then send the appropriate error message back to the client. There are two or three other errors that we need to mark as operational ourselves. So we will do that over the next couple of lectures.

## 119. HANDLING INVALID DATABASE IDS

There are three types of errors that might be created by Mongoose in which we need to mark as operational errors so that we can send back meaningful error messages to clients in production. So the first one is when we try an `invalid ID`. Mongoose will not be able to convert this into a MongoDB ID.

The other Mongoose errors that we also will have to mark as `operational` occurs when we violate the `unique` validation rules. This will generate duplicate key error. The third type also relates to validation. It's to do with the `max` and `min` validation and this returns ValidationError. We only want to do this in production.

`001` It's not a good practice at all to override the arguments of a function. I will actually create a hard copy of that `err` object, So I'm using let, and not const, and we destructure the original error. And so, from now on, we will use `error` instead of err.

`002` Let's say if `error.name` is equal to `CastError`, and so that's how we're going to identify this type of error here that we just talked about, because it has the name of `CastError`. So if error.name is CastError, well then we're going to call a special function that we're going to create in a second, which is called `handleCastErrorDB`.

We're going to pass the `error` that Mongoose created into this function, so just like this, and this will then return a new error created with our `AppError` class. That error will then be marked as `operational`, because remember, all our `AppErrors` have the `isOperational` properties set to `true` automatically. So this will return our AppError, and so, let's save that, And so were saving that in err.

And so, right now, if our `error` is `CastError`, we will then pass the `error` into the handleCastErrorDB function which will return an `error`, so the one we are saving into `error`, and that is the one that will then be sent to the client using our `sendErrorProd`.

`004` Let's now create the `handleCastErrorDB` function here. This receives an `err`. The error object in Postman has the `path` and the `value`, The `path` is the name of the field for which the input data is in the wrong format. And the value is the value we passed as the id.

`005` We then require `AppError` and then return a new instance of the `AppError`. Into our AppError, we pass in our `message`, and the `400` status code, which stands for `Bad Request`. And so just like this, we transform the weird error that we were getting from Mongoose into an operational error with a nice friendly message that an actual human can read.

```js => errorController.js
const AppError = require("./../utils/appError");

// 004
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  // 005
  return new AppError(message, 400);
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    // 001
    let error = { ...err };

    // 002
    if (error.name === "CastError") error = handleCastErrorDB(error);

    sendErrorProd(error, res);
  }
};
```

And so, let's now actually try that. So here, in our `package.json`, run `npm run start:prod` script. This will start a process in production mode, basically.

Let's now try this again in Postman. So, send a request from 127.0.0.1:3000/api/v1/tours/xxxxxxxxxxx. So, if you're now doing this request, we should get back the error message that we just created. If your Postman is hanging then open `package.json` and change the value of `start:prod` to `SET NODE_ENV=production&& nodemon server.js`.

Restart the process in the terminal and it should be fine. This one is now handled. In the next lecture, we will then take care of the next one, which is for `duplicate` field names. Stop the server and you may need to start it in `development` mode by running `npm start`.

## 120. HANDLING DUPLICATE DATABASE FIELDS

Let's now handle the error that occurs when we try to create duplicate fields for fields that are actually supposed to be unique. The error we get in this case doesn't have a `name` property. And that's because it is actually not an error that is caused by a Mongoose. And so, what we're going to do to identify this error is use the value of the code property which is returned as part of the error. It is `11000` in this case.

`001` We do this by simply using an if check for `error.code === 11000`.

`002` In the function, we will send a message with the duplicate value they are trying to add. We're going to use a regular expression to, basically find the text that is between quotes in the error message in Postman that is part of the `errmsg` property. Using Google, I would simply search for regular expression match text between quotes. Note that `error.errmsg` is the name of the property. If we log `value`, it is an array. But what we're interested in is actually the string with the tour name with element zero.

`003` And now, let's actually go ahead and return our new AppError, so new AppError, paste in the message, and again the 400 status code for a bad request. And so let's now try that again by sending a new create tour request.

```js => errorController.js
const AppError = require("./../utils/appError");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  // 002
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  console.log(value);

  const message = `Duplicate field value: ${value}. Please use another value!`;
  // 003
  return new AppError(message, 400);
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };

    if (error.name === "CastError") error = handleCastErrorDB(error);
    // 001
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);

    sendErrorProd(error, res);
  }
};
```

## 121. HANDLING MONGOOSE VALIDATION ERRORS

Finally, let's now handle Mongoose's validation errors. So remember how we tried to update a tour with some invalid data. Inside our error, we get an error properties. And that property itself is an object which has a lot of objects in there, and each of them is for one of the fields that has an error. Each of these actually has a nice error message. So basically the one that we defined in our Mongoose schema.

`001` And so now we want to extract all the messages from within the error, and put them all into one string. I'm going to start by creating the conditional. This `error.name`, is an error created by Mongoose. I want that the error should be equal to `handleValidationErrorDB`, and send in the error.

`002` Now let's create `handleValidationErrorDB` function. Now in order to create one big string out of all the strings from all the errors, we have to loop over all of these error objects, and then extract all the error messages into a new array. And in JavaScript, we use `Object.values` in order to basically loop over an object.

Let's create a variable called `errors`, which again will be an array of all the error messages for now. And so we want the values of `err.errors`. And now loop over them using a map. In each iteration, we are simply going to return the error message. And so now all we have to do in order to extract the message, is to say value.message.

`003` Again, let's simply start by creating our message. And now we simply `join` all of them together into one string using period and then space. And then let's also `return` the error.

```js => errorController.js
const AppError = require("./../utils/appError");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  console.log(value);

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  // 002
  const errors = Object.values(err.errors).map((el) => el.message);

  // 003
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };

    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);

    // 001
    if (error.name === "ValidationError")
      error = handleValidationErrorDB(error);

    sendErrorProd(error, res);
  }
};
```

To test this, let's switch back to production by running `npm run start:prod` in the terminal and then execute a create or patch method in Postman.

So, we're basically done here. Now we could've made this handling error, a lot more complete still. For example, we could define different error severity levels like saying, this error is not so important, this error is medium important, and this error is very important or even critical. And we could also then email some administrator about critical errors. And really, there's a lot of stuff that we could implement.

Now if we were ever to find another error that we want to mark as operational, then of course all we would have to do is something similar to what we have here. So basically implement another function for that one, and then return our own operational error so that the send error production can then actually send that operational error to the client.

There are still some other errors that we need to handle which are completely outside of Mongo or even of Express.

## 122. ERRORS OUTSIDE EXPRESS: UNHANDLED REJECTIONS

In this video, let's talk about something that we have in node.js called `unhandled rejections` and then learn how we can actually handle them.

There might also occur errors outside of express and a good example for that in our current application is the mongodb database connection. The database could be down. They are errors that we have to handle as well. But they didn't occur inside of our express application and so, of course, our error handler that we implemented will not catch this errors.

And so just to test what happens, let's go ahead and change our mongodb password in the config.env Because that way, we're not going to be able to connect to the database. We will get an unhandled promise rejection.

An unhandled promise rejection means that somewhere in our code, there is a promise that got rejected. But that rejection has not been handled anywhere. And down here, you also see a deprecation warning which says that in the future unhandled rejections will simply exit the node program that's running, which may not always be what you want. So let's fix this problem and get rid of this unhandled promise rejection.

`001` Now, in this simple example here, it would be actually quite easy to handle that rejection. All we'll have to do would be to go to `server.js` where our connection is actually done and then, add a catch handler, and then in here, we could handle that rejection and would then no longer get this error. Let me just quickly show that to you.

So try it again. And so now, you get error which is of course, the result of this log here, but of course, we get no unhandled promise rejection, again, because we actually handled it here.

```js => server.js
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log("DB Connection Successful"))
  // 001
  .catch((err) => console.log("ERROR"));
```

So this would work, of course, but I really want to show you how to globally handle unhandled rejected promises, because in a bigger application, it can become a bit more difficult to always keep track of all the promises that might become rejected at some point.

And remember how in one of the first section of the course, we talked about `events` and `event listeners`. And so now, it's time to actually use that knowledge. So each time that there is an unhandled rejection somewhere in our application, the `process object` will `emit` an object called `unhandled rejection` and so we can `subscribe` to that event just like this.

`001` So `process.on`, and then the name of the event, `unhandledRejection`, and then the `callback` function here receives an `error`, and so let's actually go ahead and log the error to the console. So let's use `err.name` and `err.message`. So these are kind of some defaults that we have on all errors in node.js.

Save and in the terminal, we get the `name` of the error and also the error `message`. And so right now, the unhandled promise rejection is now actually handled. And of course, not just the one from this failed connection but any other promise rejection that we might not catch somewhere in the application is handled here.

`002` Now, if we really have like some problem with the database connection, like we have in this example, then our application is not going to work at all. And so all we can really do here is to shut down our application.For that, we use `process.exit` and then pass a code. And the code `0` stands for a `success` and `1` stands for `uncaught exception`.

```js => server.js
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log("DB Connection Successful"));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// 001
process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");

  // 002
  process.exit(1);
});
```

Now, there is just one problem with the way we implemented it right now. It is a very abrupt way of ending the program because this will just immediately abort all the requests that are currently still running or pending and so that might not be a good idea. And so usually, what we do is to `shutdown gracefully` where we first close the server and only then, we shut down the application.

`001` Before we do that, we need to save the server here basically to a variable. And so the result of calling app.listen is a server

`002` And on that server, we can then say `server.close` which will close the server and then after that's done, it will run the callback function that we passed into it and so it's only here, where we then shut down the server.

```js => server.js
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log("DB Connection Successful"));

const port = process.env.PORT || 3000;

// 001
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  // 002
  server.close(() => {
    process.exit(1);
  });
});
```

And so bysaying `server.clo`se, we give the server, basically time to finish all the request that are still pending or being handled at the time, and only after that, the server is then basically killed. So when we give it a save, it's not going to look exactly the same because, we're like the only ones that really is accessing this application but in the real world scenario, we should always do it like this.

And of course, that's not really ideal that the application crashed. Because right now, the app is not working at all. And so usually, in a production app on a web server, we will usually have some tool in place that restarts the application right after it crashes, or also some of the platforms that host node.js will automatically do that on their own.

And so basically, this is how you handle unhandled rejected promises. But now, you might ask, what about the synchronous code? Where are we going to handle that? And the answer to that lies, as you can imagine, in the next video.

## 123. CATCHING UNCAUGHT EXCEPTIONS

And now to finish this section, let's learn how to catch `uncaught exceptions`. They are bugs, that occur in our `synchronous` code but are not handled anywhere. For example, if we log a variable `x` that does not exist, we get, `x is not defined`. This is an example.

`001` To fix this, is very similar to doing the unhandled rejections. So again, we're listening to an event, this time it's called `uncaughtException`. And then just like before, we pass in our `callback` function. So we want to log the error to the console so that it then shows up in the logs in our server. So, giving us a way of then fixing the problem. And then we want to gracefully shut down the server.

```js => server.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const app = require("./app");

// 001
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

console.log(x);
```

Now while in the `unhandledRejection`, crashing the application like we did here is optional. When there is an `uncaught exception`, we really, really need to crash our application because after there was an uncaught exception, the entire node process is in a so-called `unclean state`. And so to fix that, the process need to terminate and then to be restarted. And again, in production, we should then have a tool in place which will restart the application after crashing. And many hosting services already do that out of the box.

Now, in Node.js, it's not really a good practice to just blindly rely on these two error handlers that we just implemented here. So ideally errors should really be handled right where they occur. So for example, in the problem connecting to the database, we should of course add a catch handler there and not just simply rely on the `unhandled rejection` callback that we have in the `unhandledRejection`.

`001` Now actually this uncaughtException handler here should be at the very top of our code. Or at least before any other code is really executed. Because watch what happens if I move the console.log(x); error line of code before the `uncaughtException` handler. You actually see that our handler does not catch this exception. And so that's because only here at the end we actually start listening for an uncaught exception.

```js => server.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// 001
console.log(x);

dotenv.config({ path: "./config.env" });
const app = require("./app");

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// console.log(x);
```

And so we should ideally put it here, right at the top, again before any other code executes. Especially the one in our application.

`001` So let's put it actually right here. Now the problem here will be that the server is not defined at this point. But that's not a problem, because actually we don't need the server here at all. And that's because these errors, so these `uncaught exceptions`, they are not going to happen asynchronously. So they are not going to have anything to do with the server actually. We can just add it here before we actually `require` our main application.

```js => server.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
// 001
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

console.log(x);

dotenv.config({ path: "./config.env" });
const app = require("./app");
```

And so if we now have an error, so you see that now we're back to actually catching it in our error handler. But if we now had the console.log(x) error code, for example inside of `app.js`, and if we now run this, well then you see that we're still catching that exception in our error handler, which before would not be the case.

And now just for an experiment, what do you think if we put this code right here in this middleware function?

`001` What do you think is going to happen when we save this file now? So `x` is still not defined anywhere, but let's take a look at what happens when we now run this code. And so now we actually have no error. And why is that? Well, it's because this middleware function here of course is only called as soon as there actually is a request. And so let's see what happens when we do a request. And so let's do a Get All Tours request.

```js => app.js
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // 001
  console.log(x);
  next();
});
```

You see the error. And so that's what happens when there is an error inside of any Express middleware. So Express, when there is an error, will automatically go to the error-handling middleware with that error. And so that's why when we get an error here in any of our middleware function, it will immediately go here into the `module.exports = (err, req, res, next) => {}` handler in the `errorController.js` file.

And since we're in production, it will enter the production block, but since it's not a `CastError`, and not this error, and not a `ValidationError`, then as soon as the error is actually sent by calling `sendErrorProd(error, res)`, we then enter the `else` block inside the `sendErrorProd()` function block. And again, that's why we send this generic error. Let's now actually exit this mode here and go back to our normal `npm start`. And so right now, our error will be sent like this. So send development error will give us all the details about the error that is happening.
