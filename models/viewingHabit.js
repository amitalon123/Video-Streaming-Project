const mongoose = require("mongoose");

const viewingHabitSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content",
      required: true,
    },
    episode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Episode",
      default: null,
    },
    lastPositionSec: {
      type: Number,
      default: 0,
      min: 0,
    },
    durationSec: {
      type: Number,
      default: 0,
      min: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    liked: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      min: 0,
      max: 10,
    },
    timesWatched: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastWatchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common query patterns
viewingHabitSchema.index({ user: 1, content: 1 });
viewingHabitSchema.index({ user: 1, episode: 1 });
viewingHabitSchema.index({ user: 1, lastWatchedAt: -1 });

module.exports = mongoose.model("ViewingHabit", viewingHabitSchema);


