const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  const token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.split(" ")[1]
    : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "development-secret");
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token." });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required." });
  }

  next();
};

const customerOnly = (req, res, next) => {
  if (req.user?.role !== "customer") {
    return res.status(403).json({ message: "Customer access required." });
  }

  next();
};

module.exports = { protect, adminOnly, customerOnly };