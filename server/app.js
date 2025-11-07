const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const { connectDatabase } = require("./config/database");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

connectDatabase();

app.get("/", (req, res) => {
  res.json({ ok: true, service: "server", hint: "Use /health for health check" });
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// APIs
app.use("/api/profiles", require("./routes/profileRoutes"));
app.use("/api/progress", require("./routes/progressRoutes"));

const PORT = process.env.SERVER_PORT || process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server (server/) running on port ${PORT}`);
});

module.exports = app;


