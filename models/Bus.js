const mongoose = require("mongoose");

const busSchema = new mongoose.Schema(
  {
    busNumber: {
      type: String,
      required: [true, "Bus number is required"],
      unique: true,
      trim: true,
    },

    routeNumber: {
      type: String,
      required: [true, "Route number is required"],
      trim: true,
    },

    from: {
      type: String,
      required: [true, "Starting location is required"],
      trim: true,
    },

    to: {
      type: String,
      required: [true, "Destination is required"],
      trim: true,
    },

    capacity: {
      type: Number,
      required: [true, "Bus capacity is required"],
      min: [1, "Capacity must be at least 1"],
    },

    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Bus", busSchema);