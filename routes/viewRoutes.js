const express = require("express");
const router = express.Router();

// Feed page
router.get("/feed", (req, res) => {
  res.render("content/feed");
});

// Genre page with query parameter
router.get("/genre", (req, res) => {
  res.render("content/genre", { genreId: req.query.id });
});

// Content detail page
router.get("/content/:id", (req, res) => {
  res.render("content/content-detail", { contentId: req.params.id });
});

// Login page
router.get("/login", (req, res) => {
  res.render("auth/login");
});

// Profiles page
router.get("/profiles", (req, res) => {
  res.render("auth/profiles");
});

// Root redirect to feed
router.get("/", (req, res) => {
  res.redirect("/feed");
});

module.exports = router;
