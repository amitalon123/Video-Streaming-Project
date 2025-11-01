const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Serve static files from public directory
app.use(express.static("public"));

// Database connection
mongoose
  .connect(process.env.DB_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Video Streaming API" });
});

// Import routes
app.use("/api/content", require("./routes/contentRoutes"));
app.use("/api/genres", require("./routes/genreRoutes"));
app.use("/api/episodes", require("./routes/episodeRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
// app.use('/api/profiles', require('./routes/profileRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Something went wrong on the server",
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
