const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const app = express();

// Set EJS as view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

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

// Root route will be handled by viewRoutes (redirects to /feed)

// Import API routes
app.use("/api/content", require("./routes/contentRoutes"));
app.use("/api/genres", require("./routes/genreRoutes"));
app.use("/api/episodes", require("./routes/episodeRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/stats", require("./routes/statisticsRoutes"));
// app.use('/api/profiles', require('./routes/profileRoutes'));

// Import view routes (EJS pages)
app.use("/", require("./routes/viewRoutes"));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    error: "NotFoundError",
    message: `Route ${req.method} ${req.url} not found`,
  });
});

// Global Error Handling Middleware
const errorHandler = require("./middleware/errorHandleMiddleware");
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
