const mongoose = require("mongoose");

const episodeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    seasonNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    episodeNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, // Duration in minutes
      required: true,
    },
    releaseDate: {
      type: Date,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    videoUrl: {
      type: String,
      default: "",
    },
    content: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content",
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique episodes per season per content
episodeSchema.index(
  { content: 1, seasonNumber: 1, episodeNumber: 1 },
  { unique: true }
);

// Index for improved performance on common queries
episodeSchema.index({ content: 1, seasonNumber: 1 });
episodeSchema.index({ views: -1 });

module.exports = mongoose.model("Episode", episodeSchema);
