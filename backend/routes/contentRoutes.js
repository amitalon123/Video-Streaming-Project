const express = require("express");
const router = express.Router();
const contentController = require("../controllers/contentController");

// נתיבים בסיסיים לתוכן
router
  .route("/")
  .get(contentController.getAllContent) // קבלת כל התכנים
  .post(contentController.createContent); // יצירת תוכן חדש

// נתיבים ספציפיים לתוכן מסוים
router
  .route("/:id")
  .get(contentController.getContentById) // קבלת תוכן ספציפי לפי ID
  .put(contentController.updateContent) // עדכון תוכן
  .delete(contentController.deleteContent); // מחיקת תוכן

// עדכון צפיות ולייקים
router.put("/:id/views", contentController.updateViews); // הגדלת מספר צפיות
router.put("/:id/likes", contentController.toggleLike); // הוספה/הסרת לייק

// נתיבים לקבלת תכנים לפי קטגוריות
router.get("/popular/all", contentController.getPopularContent); // תכנים פופולריים
router.get("/newest/genre/:genreId", contentController.getNewestByGenre); // תכנים חדשים לפי ז'אנר
router.post("/recommendations", contentController.getRecommendations); // המלצות תוכן מותאמות אישית

module.exports = router;
