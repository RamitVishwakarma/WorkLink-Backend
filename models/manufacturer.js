const mongoose = require("mongoose");

const manufacturerSchema = new mongoose.Schema({
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
  machines: [
    {
      name: {
        type: String,
        required: true,
      },
      isAvailable: {
        type: Boolean,
        default: true,
      },
    },
  ],
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
  gigs: {
    type: [String],
  },
});

const Manufacturer = mongoose.model("Manufacturer", manufacturerSchema);

module.exports = Manufacturer;
