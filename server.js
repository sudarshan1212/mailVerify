const express = require("express");
const app = express();
require("dotenv").config();
const bodyParser = require("body-parser");
// const bodyParser = require("body-parser");
const cors = require("cors");
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
//DATABASE CONNECTIONS
const dbConnection = require("./config/dbConnection");
dbConnection();
//PORT
const port = process.env.PORT || 5000;

//ROUTER
app.use("/", require("./userRouter"));

//ERROR HANDLER
app.use((req, res, next) => {
  const error = new Error("not found");
  error.status = 400;
  next(error);
});
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    error: {
      message: err.message,
    },
  });
});
//ROUTER
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
