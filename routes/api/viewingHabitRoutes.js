const express = require("express");
const router = express.Router();
const viewingController = require("../../controllers/viewingHabitController");

router
  .route("/")
  .get(viewingController.getAllViewings)
  .post(viewingController.createViewing);

router
  .route("/:id")
  .get(viewingController.getViewingById)
  .put(viewingController.updateViewing)
  .delete(viewingController.deleteViewing);

// Utility endpoints
router.put("/progress/upsert", viewingController.upsertProgress);
router.put("/like/toggle", viewingController.toggleLike);
router.put("/rating/set", viewingController.setRating);

module.exports = router;


