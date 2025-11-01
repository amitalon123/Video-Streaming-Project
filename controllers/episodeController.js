const Episode = require("../models/episode");
const Content = require("../models/content");

// קבלת כל הפרקים (עם אפשרות לסינון לפי תוכן)
exports.getAllEpisodes = async (req, res) => {
  try {
    const filter = {};

    // אם נשלח פרמטר של תוכן ספציפי, מסננים לפיו
    if (req.query.content) {
      filter.content = req.query.content;
    }

    // אם נשלח פרמטר של עונה ספציפית, מסננים לפיה
    if (req.query.season) {
      filter.seasonNumber = parseInt(req.query.season);
    }

    const episodes = await Episode.find(filter)
      .populate("content", "title type")
      .sort({ seasonNumber: 1, episodeNumber: 1 });

    res.json({ success: true, count: episodes.length, data: episodes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// קבלת פרק בודד לפי ID
exports.getEpisodeById = async (req, res) => {
  try {
    const episode = await Episode.findById(req.params.id).populate(
      "content",
      "title type"
    );

    if (!episode) {
      return res
        .status(404)
        .json({ success: false, error: "Episode not found" });
    }

    res.json({ success: true, data: episode });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// יצירת פרק חדש
exports.createEpisode = async (req, res) => {
  try {
    // בדיקה שהתוכן קיים ומסוג סדרה
    const content = await Content.findById(req.body.content);
    if (!content) {
      return res
        .status(404)
        .json({ success: false, error: "Content not found" });
    }

    if (content.type !== "series") {
      return res.status(400).json({
        success: false,
        error: "Episodes can only be added to series, not movies",
      });
    }

    // יצירת הפרק
    const episode = await Episode.create(req.body);

    res.status(201).json({ success: true, data: episode });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// עדכון פרק קיים
exports.updateEpisode = async (req, res) => {
  try {
    const episode = await Episode.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!episode) {
      return res
        .status(404)
        .json({ success: false, error: "Episode not found" });
    }

    res.json({ success: true, data: episode });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// מחיקת פרק
exports.deleteEpisode = async (req, res) => {
  try {
    const episode = await Episode.findByIdAndDelete(req.params.id);

    if (!episode) {
      return res
        .status(404)
        .json({ success: false, error: "Episode not found" });
    }

    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// קבלת כל הפרקים לתוכן מסוים, מסודרים לפי עונה ומספר פרק
exports.getEpisodesByContent = async (req, res) => {
  try {
    const contentId = req.params.contentId;

    // בדיקה שהתוכן קיים
    const content = await Content.findById(contentId);
    if (!content) {
      return res
        .status(404)
        .json({ success: false, error: "Content not found" });
    }

    // אם זה סרט, אין פרקים
    if (content.type === "movie") {
      return res.status(400).json({
        success: false,
        error: "Movies don't have episodes",
      });
    }

    // קבלת כל הפרקים מסודרים
    const episodes = await Episode.find({ content: contentId }).sort({
      seasonNumber: 1,
      episodeNumber: 1,
    });

    // ארגון הפרקים לפי עונות
    const seasonMap = {};
    episodes.forEach((episode) => {
      const season = episode.seasonNumber.toString();
      if (!seasonMap[season]) {
        seasonMap[season] = [];
      }
      seasonMap[season].push(episode);
    });

    res.json({
      success: true,
      content: content.title,
      seasons: Object.keys(seasonMap).length,
      episodeCount: episodes.length,
      data: seasonMap,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// עדכון מספר צפיות בפרק
exports.updateEpisodeViews = async (req, res) => {
  try {
    const episode = await Episode.findById(req.params.id);

    if (!episode) {
      return res
        .status(404)
        .json({ success: false, error: "Episode not found" });
    }

    // הגדלת מספר הצפיות ב-1
    episode.views += 1;
    await episode.save();

    res.json({
      success: true,
      message: "View count updated",
      views: episode.views,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
