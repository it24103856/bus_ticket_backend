const express = require("express");

const {
  createSchedule,
  getSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
  bookSchedule,
  getBookedSeats,
} = require("../controllers/scheduleController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, adminOnly, createSchedule);

router.get("/", getSchedules);

router.get("/:id", getScheduleById);
router.post("/:id/book", protect, bookSchedule);
router.get("/:id/booked-seats", protect, getBookedSeats);

router.put("/:id", protect, adminOnly, updateSchedule);

router.delete("/:id", protect, adminOnly, deleteSchedule);

module.exports = router;