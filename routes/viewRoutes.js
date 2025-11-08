const express = require("express");
const router = express.Router();

// Root route - redirect to feed
router.get("/", (req, res) => {
  res.redirect("/feed");
});

// Feed page
router.get("/feed", (req, res) => {
  res.render("content/feed");
});

// Genre page
router.get("/genre", (req, res) => {
  res.render("content/genre");
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

module.exports = router;

