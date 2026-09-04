const Bus = require("../models/Bus");
const Schedule = require("../models/Schedule");

// CREATE BUS
const createBus = async (req, res) => {
  try {
    const { busNumber, routeNumber, from, to, capacity, imageUrl } = req.body;

    if (
      !busNumber?.trim() ||
      !routeNumber?.trim() ||
      !from?.trim() ||
      !to?.trim() ||
      capacity === undefined ||
      capacity === ""
    ) {
      return res.status(400).json({
        message: "Bus number, route, locations and capacity are required.",
      });
    }

    if (!Number.isFinite(Number(capacity)) || Number(capacity) <= 0) {
      return res.status(400).json({
        message: "Capacity must be a number greater than 0.",
      });
    }

    const existingBus = await Bus.findOne({
      busNumber: busNumber.trim(),
    });

    if (existingBus) {
      return res.status(409).json({
        message: "This bus number is already registered.",
      });
    }

    const bus = await Bus.create({
      busNumber: busNumber.trim(),
      routeNumber: routeNumber.trim(),
      from: from.trim(),
      to: to.trim(),
      capacity,
      imageUrl: imageUrl || "",
    });

    res.status(201).json({
      message: "Bus registered successfully.",
      bus,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to register bus.",
      error: error.message,
    });
  }
};

// GET ALL BUSES
const getBuses = async (req, res) => {
  try {
    const { search } = req.query;

    let filter = {};

    if (search) {
      filter = {
        $or: [
          { busNumber: { $regex: search, $options: "i" } },
          { routeNumber: { $regex: search, $options: "i" } },
          { from: { $regex: search, $options: "i" } },
          { to: { $regex: search, $options: "i" } },
        ],
      };
    }

    const buses = await Bus.find(filter).sort({
      routeNumber: 1,
      busNumber: 1,
    });

    res.json(buses);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch buses.",
      error: error.message,
    });
  }
};

// GET SINGLE BUS
const getBusById = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);

    if (!bus) {
      return res.status(404).json({
        message: "Bus not found.",
      });
    }

    res.json(bus);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch bus.",
      error: error.message,
    });
  }
};

// UPDATE BUS
const updateBus = async (req, res) => {
  try {
    const { busNumber, routeNumber, from, to, capacity, imageUrl } = req.body;

    const bus = await Bus.findById(req.params.id);

    if (!bus) {
      return res.status(404).json({
        message: "Bus not found.",
      });
    }

    if (
      !busNumber?.trim() ||
      !routeNumber?.trim() ||
      !from?.trim() ||
      !to?.trim() ||
      capacity === undefined ||
      capacity === ""
    ) {
      return res.status(400).json({
        message: "Bus number, route, locations and capacity are required.",
      });
    }

    if (!Number.isFinite(Number(capacity)) || Number(capacity) <= 0) {
      return res.status(400).json({
        message: "Capacity must be a number greater than 0.",
      });
    }

    const duplicateBus = await Bus.findOne({
      busNumber: busNumber.trim(),
      _id: { $ne: req.params.id },
    });

    if (duplicateBus) {
      return res.status(400).json({
        message: "Another bus already uses this bus number.",
      });
    }

    bus.busNumber = busNumber.trim();
    bus.routeNumber = routeNumber.trim();
    bus.from = from.trim();
    bus.to = to.trim();
    bus.capacity = capacity;
    bus.imageUrl = imageUrl || "";

    await bus.save();

    res.json({
      message: "Bus updated successfully.",
      bus,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update bus.",
      error: error.message,
    });
  }
};

// DELETE BUS
const deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);

    if (!bus) {
      return res.status(404).json({
        message: "Bus not found.",
      });
    }

    // Delete schedules belonging to this bus
    await Schedule.deleteMany({
      bus: req.params.id,
    });

    await Bus.findByIdAndDelete(req.params.id);

    res.json({
      message: "Bus and related schedules deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete bus.",
      error: error.message,
    });
  }
};

module.exports = {
  createBus,
  getBuses,
  getBusById,
  updateBus,
  deleteBus,
};