const mongoose = require("mongoose");

function connectDatabase() {
  const connectionString = process.env.DB_URL;

  if (!connectionString) {
    console.error("Missing DB_URL environment variable");
    process.exit(1);
  }

  mongoose
    .connect(connectionString)
    .then(() => console.log("MongoDB connected (server/ config)"))
    .catch((err) => {
      console.error("MongoDB connection error:", err);
      process.exit(1);
    });
}

module.exports = { connectDatabase };


