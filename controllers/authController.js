const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const createToken = (user) =>
  jwt.sign(
    { id: user._id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET || "development-secret",
    { expiresIn: "1d" }
  );

const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, address, telephone, profileImage } = req.body;

    if (!name?.trim() || !email?.trim() || !password || !address?.trim() || !telephone?.trim()) {
      return res.status(400).json({ message: "Name, email, address, telephone and password are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      address: address.trim(),
      telephone: telephone.trim(),
      profileImage: profileImage || "",
      password: await bcrypt.hash(password, 12),
      role: "customer",
    });

    res.status(201).json({ message: "Registration successful.", user: { id: user._id, name: user.name, email: user.email, address: user.address, telephone: user.telephone, profileImage: user.profileImage, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: "Registration failed.", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.trim().toLowerCase() });

    if (!user || !(await bcrypt.compare(password || "", user.password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "This account has been blocked." });
    }

    res.json({
      message: "Login successful.",
      token: createToken(user),
      user: { id: user._id, name: user.name, email: user.email, address: user.address, telephone: user.telephone, profileImage: user.profileImage, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed.", error: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users.", error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { address, telephone } = req.body;
    if (!address?.trim() || !telephone?.trim()) {
      return res.status(400).json({ message: "Address and telephone are required." });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { address: address.trim(), telephone: telephone.trim() },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ message: "Profile updated successfully.", user });
  } catch (error) {
    res.status(500).json({ message: "Failed to update profile.", error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { role, isBlocked } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found." });
    if (req.user.id === user._id.toString() && (role !== "admin" || isBlocked === true)) {
      return res.status(400).json({ message: "You cannot block or remove your own admin access." });
    }
    if (role && !["customer", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid account role." });
    }

    if (role) user.role = role;
    if (typeof isBlocked === "boolean") user.isBlocked = isBlocked;
    await user.save();
    res.json({ message: "User updated successfully.", user: { id: user._id, name: user.name, email: user.email, role: user.role, isBlocked: user.isBlocked } });
  } catch (error) {
    res.status(500).json({ message: "Failed to update user.", error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json({ message: "You cannot delete your own admin account." });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ message: "User deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete user.", error: error.message });
  }
};

module.exports = { register, login, getUsers, updateUser, deleteUser, updateProfile };