const mongoose = require("mongoose");

const viewingProgressSchema = new mongoose.Schema(
  {
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
      index: true,
    },
    content: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content",
      required: true,
      index: true,
    },
    episode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Episode",
      default: null,
    },
    positionSeconds: { type: Number, required: true, min: 0 },
    durationSeconds: { type: Number, required: true, min: 0 },
    isCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

viewingProgressSchema.index(
  { profile: 1, content: 1, episode: 1 },
  { unique: true, partialFilterExpression: { profile: { $type: "objectId" }, content: { $type: "objectId" } } }
);

module.exports = mongoose.model("ViewingProgress", viewingProgressSchema);


