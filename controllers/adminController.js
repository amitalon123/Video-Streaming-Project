const Content = require("../models/content");
const mongoose = require("mongoose");
const imdb = require("imdb-api");
const configs = require("../config/config");

exports.createContent = async (req, res) => {
  try {
    let imdbRating = req.body.rating || 0;
    let imdbError = null;

    // Try to get IMDb rating
    try {
      const imdbReview = await imdb.get(
        { name: req.body.title },
        { apiKey: process.env.IMDB_API_KEY, timeout: configs.IMDB_TIMEOUT }
      );

      if (imdbReview && imdbReview.ratings && imdbReview.ratings.length > 0) {
        const ratingValue = imdbReview.ratings[0].value;
        if (ratingValue) {
          imdbRating = parseFloat(ratingValue);
        }
      }
    } catch (imdbErr) {
      // Store error but don't fail the request
      imdbError = imdbErr.message;
      console.warn("IMDb API error:", imdbError);

      // Check for specific IMDb errors to provide better feedback
      if (
        imdbErr.message &&
        imdbErr.message.toLowerCase().includes("not found")
      ) {
        return res.status(400).json({
          success: false,
          error: `The movie/show "${req.body.title}" was not found on IMDb. Please check the spelling or ensure that it exists on IMDb.`,
          message: `The movie/show "${req.body.title}" was not found on IMDb. Please check the spelling or ensure that it exists on IMDb.`,
        });
      } else if (
        imdbErr.message &&
        (imdbErr.message.toLowerCase().includes("timeout") ||
          imdbErr.message.toLowerCase().includes("timed out"))
      ) {
        return res.status(408).json({
          success: false,
          error: "IMDb server is not responding. Please try again shortly.",
          message: "IMDb server is not responding. Please try again shortly.",
        });
      } else if (
        imdbErr.message &&
        imdbErr.message.toLowerCase().includes("rate limit")
      ) {
        return res.status(429).json({
          success: false,
          error:
            "You have exceeded the request limit for IMDb. Please wait a moment and try again.",
          message:
            "You have exceeded the request limit for IMDb. Please wait a moment and try again.",
        });
      }
      // For other IMDb errors, continue without rating
    }

    const data = {
      rating: imdbRating,
      ...req.body,
    };

    const content = await Content.create(data);

    // Return success response with IMDb info
    const response = {
      success: true,
      data: content,
      imdbRatingUpdated: imdbRating > 0 && !imdbError,
      message: imdbError
        ? `Content added successfully! Note: IMDb rating could not be updated: ${imdbError}`
        : `Content added successfully!${
            imdbRating > 0 ? ` IMDb rating updated to ${imdbRating}/10.` : ""
          }`,
    };

    res.status(201).json(response);
  } catch (err) {
    // Handle validation errors
    if (err.name === "ValidationError") {
      const validationErrors = Object.values(err.errors)
        .map((e) => e.message)
        .join(", ");
      return res.status(400).json({
        success: false,
        error: `Validation error: ${validationErrors}`,
        message: `Validation error: ${validationErrors}`,
      });
    }

    // Handle duplicate key errors
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Content with this name already exists in the system.",
        message: "Content with this name already exists in the system.",
      });
    }

    // Handle other errors
    res.status(400).json({
      success: false,
      error: err.message || "An error occurred while creating the content",
      message: err.message || "An error occurred while creating the content",
    });
  }
};

exports.updateContent = async (req, res) => {
  try {
    const content = await Content.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!content) {
      return res
        .status(404)
        .json({ success: false, error: "Content not found" });
    }

    res.json({ success: true, data: content });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.deleteContent = async (req, res) => {
  try {
    const content = await Content.findByIdAndDelete(req.params.id);

    if (!content) {
      return res
        .status(404)
        .json({ success: false, error: "Content not found" });
    }

    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
