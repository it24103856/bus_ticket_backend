const express = require("express");
const { register, login, getUsers, updateUser, deleteUser, updateProfile } = require("../controllers/authController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.patch("/profile", protect, updateProfile);
router.get("/users", protect, adminOnly, getUsers);
router.patch("/users/:id", protect, adminOnly, updateUser);
router.delete("/users/:id", protect, adminOnly, deleteUser);

module.exports = router;