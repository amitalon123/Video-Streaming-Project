const express = require("express");
const router = express.Router();
const episodeController = require("../controllers/episodeController");

// נתיבים בסיסיים לפרקים
router
  .route("/")
  .get(episodeController.getAllEpisodes) // קבלת כל הפרקים (עם אפשרות לסינון)
  .post(episodeController.createEpisode); // יצירת פרק חדש

router
  .route("/:id")
  .get(episodeController.getEpisodeById) // קבלת פרק ספציפי לפי ID
  .put(episodeController.updateEpisode) // עדכון פרק
  .delete(episodeController.deleteEpisode); // מחיקת פרק

// עדכון מספר צפיות בפרק
router.put("/:id/views", episodeController.updateEpisodeViews);

// קבלת כל הפרקים לתוכן מסוים
router.get("/content/:contentId", episodeController.getEpisodesByContent);

module.exports = router;
