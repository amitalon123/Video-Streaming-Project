const express = require("express");
const router = express.Router();
const genreController = require("../controllers/genreController");

// Basic genre routes
router
  .route("/")
  .get(genreController.getAllGenres) // Get all genres
  .post(genreController.createGenre); // Create new genre

router
  .route("/:id")
  .get(genreController.getGenreById) // Get specific genre by ID
  .put(genreController.updateGenre) // Update genre
  .delete(genreController.deleteGenre); // Delete genre

// Route to get content by genre
router.get("/:id/content", genreController.getContentByGenre);

module.exports = router;
