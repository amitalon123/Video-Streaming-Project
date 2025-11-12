const express = require("express");
const router = express.Router();
const profileController = require("../../controllers/profileController");

// Profiles collection for a user
router
  .route("/:userId")
  .get(profileController.getProfiles)
  .post(profileController.createProfile);

// Specific profile operations
router
  .route("/:userId/:profileId")
  .put(profileController.updateProfile)
  .delete(profileController.deleteProfile);

module.exports = router;



