const mongoose = require("mongoose");

const CardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  name: {
    type: String,
    default: "Magellen Rewards Card",
    required: true,
  },
  date: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = Card = mongoose.model("card", CardSchema);
