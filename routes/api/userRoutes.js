const express = require("express");
const router = express.Router();
const userController = require("../../controllers/userController");
const profileController = require("../../controllers/profileController");

router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route("/:userId/profiles")
  .get(profileController.getProfiles)
  .post(profileController.createProfile);

router
  .route("/:userId/profiles/:profileId")
  .put(profileController.updateProfile)
  .delete(profileController.deleteProfile);

router
  .route("/:id")
  .get(userController.getUserById)
  .put(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;


