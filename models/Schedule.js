const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema(
  {
    bus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bus",
      required: [true, "Bus is required"],
    },

    routeNumber: {
      type: String,
      required: [true, "Route number is required"],
      trim: true,
    },

    departureTime: {
      type: Date,
      required: [true, "Departure time is required"],
    },

    arrivalTime: {
      type: Date,
      required: [true, "Arrival time is required"],
    },

    crowdLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low",
    },

    availableSeats: {
      type: Number,
      required: [true, "Available seats are required"],
      min: [0, "Available seats cannot be negative"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Schedule", scheduleSchema);