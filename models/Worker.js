const mongoose = require("mongoose");

const workerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  skills: {
    type: [String],
    required: true,
  },
  location: {
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
  },
  profilePicture: {
    type: String,
    default: "https://i.postimg.cc/c15MbgrZ/pngwing-com.png",
  },
});

const Worker = mongoose.model("Worker", workerSchema);

module.exports = Worker;
