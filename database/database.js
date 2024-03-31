const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const connectdb = (DATABASE_URL) => {
  return mongoose
    .connect(DATABASE_URL)
    .then(() => {
      console.log("database connected!");
    })
    .catch((error) => {
      console.log(DATABASE_URL);
      console.log("database not connected");
      console.log(error);
    });
};
module.exports = connectdb;
