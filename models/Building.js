const mongoose = require("mongoose");

const BuildingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  location: {
    address: {
      type: String,
    },
    city: {
      type: String,
    },
    zipcode: {
      type: Number,
    },
    neighborhood: {
      type: String,
    },
  },
  website: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = Building = mongoose.model("building", BuildingSchema);
