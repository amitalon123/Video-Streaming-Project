const express = require("express");
const router = express.Router();
const { isAuthenticated, isAdmin } = require("../../middleware/authMiddleware");
const Genre = require("../../models/genre");

// GET - Admin Content Management Page
router.get("/", async (req, res) => {
  try {
    // Fetch all active genres for the dropdown
    const genres = await Genre.find({ isActive: true }).sort("name");

    res.render("admin/add-content", {
      user: req.user,
      genres: genres,
    });
  } catch (error) {
    console.error("Error loading admin content page:", error);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
