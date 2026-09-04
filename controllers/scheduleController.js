const Schedule = require("../models/Schedule");
const Bus = require("../models/Bus");
const Booking = require("../models/Booking");

// CREATE SCHEDULE
const createSchedule = async (req, res) => {
  try {
    const {
      bus,
      routeNumber,
      departureTime,
      arrivalTime,
      crowdLevel,
      availableSeats,
    } = req.body;

    // Basic validation
    if (
      !bus ||
      !routeNumber ||
      !departureTime ||
      !arrivalTime ||
      availableSeats === undefined
    ) {
      return res.status(400).json({
        message: "Please fill all required fields.",
      });
    }

    const departure = new Date(departureTime);
    const arrival = new Date(arrivalTime);

    if (isNaN(departure.getTime()) || isNaN(arrival.getTime())) {
      return res.status(400).json({
        message: "Invalid departure or arrival time.",
      });
    }

    if (arrival <= departure) {
      return res.status(400).json({
        message: "Arrival time must be after departure time.",
      });
    }

    // Check bus exists
    const existingBus = await Bus.findById(bus);

    if (!existingBus) {
      return res.status(404).json({
        message: "Selected bus was not found.",
      });
    }

    // Available seats cannot exceed capacity
    if (Number(availableSeats) > existingBus.capacity) {
      return res.status(400).json({
        message: `Available seats cannot exceed bus capacity of ${existingBus.capacity}.`,
      });
    }

    if (Number(availableSeats) < 0) {
      return res.status(400).json({
        message: "Available seats cannot be negative.",
      });
    }

    // IMPORTANT:
    // Check overlapping schedule for same bus
    const overlappingSchedule = await Schedule.findOne({
      bus,
      departureTime: { $lt: arrival },
      arrivalTime: { $gt: departure },
    });

    if (overlappingSchedule) {
      return res.status(400).json({
        message:
          "This bus already has another schedule during this time. Please select a different time.",
      });
    }

    const schedule = await Schedule.create({
      bus,
      routeNumber,
      departureTime: departure,
      arrivalTime: arrival,
      crowdLevel: crowdLevel || "Low",
      availableSeats: Number(availableSeats),
    });

    const populatedSchedule = await Schedule.findById(schedule._id).populate(
      "bus"
    );

    res.status(201).json({
      message: "Schedule created successfully.",
      schedule: populatedSchedule,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create schedule.",
      error: error.message,
    });
  }
};

// GET ALL SCHEDULES
const getSchedules = async (req, res) => {
  try {
    const { search, crowdLevel } = req.query;

    let filter = {};

    if (crowdLevel && crowdLevel !== "All") {
      filter.crowdLevel = crowdLevel;
    }

    let schedules = await Schedule.find(filter)
      .populate("bus")
      .sort({ departureTime: 1 });

    // Search after populate
    if (search) {
      const searchText = search.toLowerCase();

      schedules = schedules.filter((schedule) => {
        if (!schedule.bus) return false;

        return (
          schedule.routeNumber.toLowerCase().includes(searchText) ||
          schedule.bus.busNumber.toLowerCase().includes(searchText) ||
          schedule.bus.from.toLowerCase().includes(searchText) ||
          schedule.bus.to.toLowerCase().includes(searchText)
        );
      });
    }

    const scheduleIds = schedules.map((schedule) => schedule._id);
    const bookings = await Booking.find({ schedule: { $in: scheduleIds } }).select("schedule seats -_id");
    const bookedSeatsBySchedule = bookings.reduce((result, booking) => {
      const key = booking.schedule.toString();
      if (!result[key]) result[key] = [];
      if (Array.isArray(booking.seats)) result[key].push(...booking.seats);
      return result;
    }, {});

    res.json(schedules.map((schedule) => ({
      ...schedule.toObject(),
      bookedSeats: bookedSeatsBySchedule[schedule._id.toString()] || [],
    })));
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch schedules.",
      error: error.message,
    });
  }
};

// GET SINGLE SCHEDULE
const getScheduleById = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id).populate("bus");

    if (!schedule) {
      return res.status(404).json({
        message: "Schedule not found.",
      });
    }

    res.json(schedule);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch schedule.",
      error: error.message,
    });
  }
};

// UPDATE SCHEDULE
const updateSchedule = async (req, res) => {
  try {
    const {
      bus,
      routeNumber,
      departureTime,
      arrivalTime,
      crowdLevel,
      availableSeats,
    } = req.body;

    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        message: "Schedule not found.",
      });
    }

    if (
      !bus ||
      !routeNumber ||
      !departureTime ||
      !arrivalTime ||
      availableSeats === undefined
    ) {
      return res.status(400).json({
        message: "Please fill all required fields.",
      });
    }

    const departure = new Date(departureTime);
    const arrival = new Date(arrivalTime);

    if (isNaN(departure.getTime()) || isNaN(arrival.getTime())) {
      return res.status(400).json({
        message: "Invalid departure or arrival time.",
      });
    }

    if (arrival <= departure) {
      return res.status(400).json({
        message: "Arrival time must be after departure time.",
      });
    }

    const existingBus = await Bus.findById(bus);

    if (!existingBus) {
      return res.status(404).json({
        message: "Selected bus was not found.",
      });
    }

    if (Number(availableSeats) > existingBus.capacity) {
      return res.status(400).json({
        message: `Available seats cannot exceed bus capacity of ${existingBus.capacity}.`,
      });
    }

    if (Number(availableSeats) < 0) {
      return res.status(400).json({
        message: "Available seats cannot be negative.",
      });
    }

    // Check overlapping schedules
    const overlappingSchedule = await Schedule.findOne({
      _id: { $ne: req.params.id },
      bus,
      departureTime: { $lt: arrival },
      arrivalTime: { $gt: departure },
    });

    if (overlappingSchedule) {
      return res.status(400).json({
        message:
          "This bus already has another schedule during this time.",
      });
    }

    schedule.bus = bus;
    schedule.routeNumber = routeNumber.trim();
    schedule.departureTime = departure;
    schedule.arrivalTime = arrival;
    schedule.crowdLevel = crowdLevel || "Low";
    schedule.availableSeats = Number(availableSeats);

    await schedule.save();

    const updatedSchedule = await Schedule.findById(
      schedule._id
    ).populate("bus");

    res.json({
      message: "Schedule updated successfully.",
      schedule: updatedSchedule,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update schedule.",
      error: error.message,
    });
  }
};

// DELETE SCHEDULE
const deleteSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        message: "Schedule not found.",
      });
    }

    await Schedule.findByIdAndDelete(req.params.id);

    res.json({
      message: "Schedule deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete schedule.",
      error: error.message,
    });
  }
};

const bookSchedule = async (req, res) => {
  try {
    const seats = Array.isArray(req.body.seats)
      ? [...new Set(req.body.seats.map(Number))]
      : [];

    if (!seats.length || seats.some((seat) => !Number.isInteger(seat) || seat < 1))
      return res.status(400).json({ message: "Choose at least one valid seat." });

    const originalSchedule = await Schedule.findById(req.params.id).populate("bus");
    if (!originalSchedule) return res.status(404).json({ message: "Schedule not found." });
    if (originalSchedule.departureTime <= new Date()) return res.status(400).json({ message: "This schedule has already departed." });
    if (seats.some((seat) => seat > originalSchedule.bus.capacity)) return res.status(400).json({ message: "One or more selected seats do not exist." });

    const existingBookings = await Booking.find({ schedule: req.params.id });
    const bookedSeats = existingBookings.flatMap((booking) => Array.isArray(booking.seats) ? booking.seats : []);
    if (seats.some((seat) => bookedSeats.includes(seat))) return res.status(409).json({ message: "One or more selected seats are already booked." });

    const schedule = await Schedule.findOneAndUpdate(
      {
        _id: req.params.id,
        departureTime: { $gt: new Date() },
        availableSeats: { $gte: seats.length },
      },
      { $inc: { availableSeats: -seats.length } },
      { new: true }
    ).populate("bus");

    if (!schedule) {
      return res.status(400).json({ message: "This schedule has departed or has no seats available." });
    }

    try {
      await Booking.findOneAndUpdate(
        { user: req.user.id, schedule: schedule._id },
        { $addToSet: { seats: { $each: seats } } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (error) {
      await Schedule.findByIdAndUpdate(schedule._id, { $inc: { availableSeats: seats.length } });
      if (error.code === 11000) {
        return res.status(409).json({ message: "Unable to update your booking. Please try again." });
      }
      throw error;
    }

    res.status(201).json({ message: "Seat booked successfully.", schedule });
  } catch (error) {
    res.status(500).json({ message: "Failed to book seat.", error: error.message });
  }
};

const getBookedSeats = async (req, res) => {
  try {
    const bookings = await Booking.find({ schedule: req.params.id }).select("seats -_id");
    res.json(bookings.flatMap((booking) => Array.isArray(booking.seats) ? booking.seats : []));
  } catch (error) {
    res.status(500).json({ message: "Failed to load booked seats.", error: error.message });
  }
};

module.exports = { createSchedule, getSchedules, getScheduleById, updateSchedule, deleteSchedule, bookSchedule, getBookedSeats };