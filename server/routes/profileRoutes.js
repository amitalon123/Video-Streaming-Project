const express = require("express");
const router = express.Router();
const controller = require("../controllers/profileController");

router.get("/", controller.listProfiles);
router.patch("/:id", controller.updateProfile);

module.exports = router;


