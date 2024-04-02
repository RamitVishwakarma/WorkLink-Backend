const mongoose = require("mongoose");

const startupSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
  },
  companyEmail: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  workSector: {
    type: String,
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
    required: true,
    default: "https://i.postimg.cc/c15MbgrZ/pngwing-com.png",
  },
});

const Startup = mongoose.model("StartUp", startupSchema);

module.exports = Startup;
