const mongoose = require("mongoose");

const gigSchema = new mongoose.Schema({
  companyName: {
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
  skillsRequired: {
    type: [String],
    required: true,
  },
  pay: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});

const Gig = mongoose.model("Gig", gigSchema);

module.exports = Gig;
