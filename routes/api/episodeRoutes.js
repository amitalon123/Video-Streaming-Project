const express = require("express");
const router = express.Router();
const episodeController = require("../../controllers/episodeController");
const { isAuthenticated, isAdmin } = require("../../middleware/authMiddleware");

// נתיבים בסיסיים לפרקים
router
  .route("/")
  .get(episodeController.getAllEpisodes) // קבלת כל הפרקים (עם אפשרות לסינון)
  .post(isAuthenticated, isAdmin, episodeController.createEpisode); // יצירת פרק חדש (admin only)

router
  .route("/:id")
  .get(episodeController.getEpisodeById) // קבלת פרק ספציפי לפי ID
  .put(isAuthenticated, isAdmin, episodeController.updateEpisode) // עדכון פרק (admin only)
  .delete(isAuthenticated, isAdmin, episodeController.deleteEpisode); // מחיקת פרק (admin only)

// עדכון מספר צפיות בפרק
router.put("/:id/views", episodeController.updateEpisodeViews);

// קבלת כל הפרקים לתוכן מסוים
router.get("/content/:contentId", episodeController.getEpisodesByContent);

module.exports = router;
