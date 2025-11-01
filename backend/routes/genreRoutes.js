const express = require("express");
const router = express.Router();
const genreController = require("../controllers/genreController");

// נתיבים בסיסיים לז'אנרים
router
  .route("/")
  .get(genreController.getAllGenres) // קבלת כל הז'אנרים
  .post(genreController.createGenre); // יצירת ז'אנר חדש

router
  .route("/:id")
  .get(genreController.getGenreById) // קבלת ז'אנר ספציפי לפי ID
  .put(genreController.updateGenre) // עדכון ז'אנר
  .delete(genreController.deleteGenre); // מחיקת ז'אנר

// נתיב לקבלת תכנים לפי ז'אנר
router.get("/:id/content", genreController.getContentByGenre);

module.exports = router;
