const express = require("express");
const router = express.Router();
const contentController = require("../controllers/contentController");

// Basic content routes
router
  .route("/")
  .get(contentController.getAllContent) // Get all content
  .post(contentController.createContent); // Create new content

// Routes for specific content
router
  .route("/:id")
  .get(contentController.getContentById) // Get specific content by ID
  .put(contentController.updateContent) // Update content
  .delete(contentController.deleteContent); // Delete content

// View count and likes update
router.put("/:id/views", contentController.updateViews); // Increment view count
router.put("/:id/likes", contentController.toggleLike); // Add/remove like

// Routes for content by categories
router.get("/popular/all", contentController.getPopularContent); // Popular content
router.get("/newest/genre/:genreId", contentController.getNewestByGenre); // Newest content by genre
router.post("/recommendations", contentController.getRecommendations); // Personalized content recommendations

module.exports = router;
