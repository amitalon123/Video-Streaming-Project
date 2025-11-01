const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["movie", "series"],
      default: "movie",
    },
    description: {
      type: String,
      required: true,
    },
    releaseYear: {
      type: Number,
      required: true,
    },
    genres: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Genre",
      },
    ],
    rating: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    duration: {
      type: Number, // Duration in minutes (for movies)
      default: null,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    trailerUrl: {
      type: String,
      default: "",
    },
    videoUrl: {
      type: String,
      default: "",
    },
    cast: [
      {
        name: {
          type: String,
          required: true,
        },
        role: String,
        wikipediaLink: String,
      },
    ],
    director: {
      type: String,
    },
    producers: [String],
    likes: {
      type: Number,
      default: 0,
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

// Virtual field for episodes (only for series)
contentSchema.virtual("episodes", {
  ref: "Episode",
  localField: "_id",
  foreignField: "content",
});

// Index for improved performance on common queries
contentSchema.index({ title: "text", description: "text" });
contentSchema.index({ releaseYear: -1 });
contentSchema.index({ likes: -1 });
contentSchema.index({ views: -1 });
contentSchema.index({ type: 1 });

module.exports = mongoose.model("Content", contentSchema);
