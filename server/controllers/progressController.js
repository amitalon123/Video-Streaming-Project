const ViewingProgress = require("../models/ViewingProgress");

exports.upsertProgress = async (req, res) => {
  try {
    const { profileId, contentId, episodeId, positionSeconds, durationSeconds, isCompleted } = req.body || {};
    if (!profileId || !contentId) {
      return res.status(400).json({ success: false, error: "profileId and contentId are required" });
    }

    const filter = { profile: profileId, content: contentId, episode: episodeId || null };
    const update = {
      $set: {
        positionSeconds: Math.max(0, Math.floor(positionSeconds || 0)),
        durationSeconds: Math.max(0, Math.floor(durationSeconds || 0)),
        isCompleted: Boolean(isCompleted),
      },
    };

    const doc = await ViewingProgress.findOneAndUpdate(filter, update, { new: true, upsert: true, setDefaultsOnInsert: true });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getProgress = async (req, res) => {
  try {
    const { episodeId } = req.params;
    const { profileId, contentId } = req.query;
    if (!profileId || !contentId) {
      return res.status(400).json({ success: false, error: "profileId and contentId are required" });
    }

    const doc = await ViewingProgress.findOne({ profile: profileId, content: contentId, episode: episodeId || null }).lean();
    res.json({ success: true, data: doc || null });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};


