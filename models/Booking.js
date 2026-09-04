const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    schedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Schedule",
      required: true,
    },
    seats: {
      type: [Number],
      required: true,
      validate: {
        validator: (value) => value.length > 0,
        message: "At least one seat is required.",
      },
    },
  },
  { timestamps: true }
);

bookingSchema.index({ user: 1, schedule: 1 }, { unique: true });

module.exports = mongoose.model("Booking", bookingSchema);