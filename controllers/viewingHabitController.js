const ViewingHabit = require("../models/viewingHabit");
const Content = require("../models/content");

// List viewing habits with filters (by user/content/episode)
exports.getAllViewings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.user) filter.user = req.query.user;
    if (req.query.content) filter.content = req.query.content;
    if (req.query.episode) filter.episode = req.query.episode;
    if (req.query.completed != null) filter.completed = req.query.completed === "true";
    if (req.query.liked != null) filter.liked = req.query.liked === "true";

    let sort = { lastWatchedAt: -1 };
    if (req.query.sort) {
      const [field, order] = req.query.sort.split(":");
      sort = { [field]: order === "-1" ? -1 : 1 };
    }

    const [items, total] = await Promise.all([
      ViewingHabit.find(filter)
        .populate("user", "name email")
        .populate("content", "title type")
        .populate("episode", "title seasonNumber episodeNumber")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      ViewingHabit.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: items.length,
      total,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        limit,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
      data: items,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get single viewing habit by ID
exports.getViewingById = async (req, res) => {
  try {
    const item = await ViewingHabit.findById(req.params.id)
      .populate("user", "name email")
      .populate("content", "title type")
      .populate("episode", "title seasonNumber episodeNumber");
    if (!item) return res.status(404).json({ success: false, error: "Viewing habit not found" });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Create viewing habit
exports.createViewing = async (req, res) => {
  try {
    const item = await ViewingHabit.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Update viewing habit
exports.updateViewing = async (req, res) => {
  try {
    const item = await ViewingHabit.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ success: false, error: "Viewing habit not found" });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Delete viewing habit
exports.deleteViewing = async (req, res) => {
  try {
    const item = await ViewingHabit.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: "Viewing habit not found" });
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Upsert progress for a user/content(/episode)
exports.upsertProgress = async (req, res) => {
  try {
    const {
      user,
      content,
      episode = null,
      lastPositionSec = 0,
      durationSec = 0,
    } = req.body;

    if (!user || !content) {
      return res.status(400).json({ success: false, error: "user and content are required" });
    }

    const completed = durationSec > 0 && lastPositionSec / durationSec >= 0.95;

    const update = {
      lastPositionSec,
      durationSec,
      completed,
      lastWatchedAt: new Date(),
    };

    const item = await ViewingHabit.findOneAndUpdate(
      { user, content, episode: episode || null },
      { $set: update, $inc: { timesWatched: completed ? 1 : 0 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Toggle like for a viewing habit entry (or create if missing)
exports.toggleLike = async (req, res) => {
  try {
    const { user, content, episode = null, liked } = req.body;
    if (typeof liked !== "boolean" || !user || !content) {
      return res.status(400).json({ success: false, error: "user, content and liked(boolean) are required" });
    }

    // Get the previous like status to determine if we need to update content.likes
    const previousItem = await ViewingHabit.findOne({ user, content, episode: episode || null });
    const previousLiked = previousItem ? previousItem.liked : false;

    // Update or create viewing habit entry
    const item = await ViewingHabit.findOneAndUpdate(
      { user, content, episode: episode || null },
      { $set: { liked, lastWatchedAt: new Date() } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Update content.likes count only if the like status actually changed
    // and only for content (not episodes)
    if (episode === null && previousLiked !== liked) {
      const contentDoc = await Content.findById(content);
      if (contentDoc) {
        if (liked && !previousLiked) {
          // User liked the content
          contentDoc.likes += 1;
        } else if (!liked && previousLiked) {
          // User unliked the content
          contentDoc.likes = Math.max(0, contentDoc.likes - 1);
        }
        await contentDoc.save();
      }
    }

    res.json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Set rating for a viewing habit
exports.setRating = async (req, res) => {
  try {
    const { user, content, episode = null, rating } = req.body;
    if (rating == null || !user || !content) {
      return res.status(400).json({ success: false, error: "user, content and rating are required" });
    }

    const item = await ViewingHabit.findOneAndUpdate(
      { user, content, episode: episode || null },
      { $set: { rating, lastWatchedAt: new Date() } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};


