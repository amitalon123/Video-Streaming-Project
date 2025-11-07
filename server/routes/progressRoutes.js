const express = require("express");
const router = express.Router();
const controller = require("../controllers/progressController");

router.post("/", controller.upsertProgress);
router.get("/:episodeId", controller.getProgress);

module.exports = router;


