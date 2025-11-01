const express = require("express");
const router = express.Router();
const statisticsController = require("../controllers/statisticsController");

// Basic genre routes
router.route("/genre").get(statisticsController.sumPopularityByGenre); // Get all genres popularties

module.exports = router;
