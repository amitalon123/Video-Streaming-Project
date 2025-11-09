const Content = require("../models/content");
const mongoose = require("mongoose");

// Get all content with filtering, sorting and pagination options
exports.getAllContent = async (req, res) => {
  try {
    const filter = {};

    // Filter by content type (movie/series)
    if (req.query.type) {
      filter.type = req.query.type;
    }

    // Enable text search - search by title and description (case-insensitive partial match)
    if (req.query.search) {
      const searchTerm = req.query.search.trim();
      // Use $or to search in both title and description
      filter.$or = [
        { title: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } }
      ];
    }

    // Filter by year
    if (req.query.year) {
      filter.releaseYear = parseInt(req.query.year);
    }

    // Year range filter
    if (req.query.yearFrom && req.query.yearTo) {
      filter.releaseYear = {
        $gte: parseInt(req.query.yearFrom),
        $lte: parseInt(req.query.yearTo),
      };
    } else if (req.query.yearFrom) {
      filter.releaseYear = { $gte: parseInt(req.query.yearFrom) };
    } else if (req.query.yearTo) {
      filter.releaseYear = { $lte: parseInt(req.query.yearTo) };
    }

    // Filter by genre (by ID)
    if (req.query.genre) {
      filter.genres = req.query.genre;
    }

    // Filter by minimum rating
    if (req.query.minRating) {
      filter.rating = { $gte: parseFloat(req.query.minRating) };
    }

    // Sorting options
    let sortOptions = { createdAt: -1 }; // Default - newest to oldest
    if (req.query.sort) {
      switch (req.query.sort) {
        case "title":
          sortOptions = { title: 1 }; // Sort by title (A-Z)
          break;
        case "title_desc":
          sortOptions = { title: -1 }; // Sort by title (Z-A)
          break;
        case "year":
          sortOptions = { releaseYear: 1 }; // From oldest to newest
          break;
        case "year_desc":
          sortOptions = { releaseYear: -1 }; // From newest to oldest
          break;
        case "rating":
          sortOptions = { rating: -1 }; // From high to low rating
          break;
        case "popularity":
          sortOptions = { views: -1, likes: -1 }; // By popularity
          break;
      }
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build the query
    const contentQuery = Content.find(filter)
      .populate("genres", "name")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    // Execute the query
    const contents = await contentQuery;

    // Count total results (without pagination)
    const total = await Content.countDocuments(filter);

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      count: contents.length,
      total: total,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        limit: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      data: contents,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get single content by ID
exports.getContentById = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id).populate(
      "genres",
      "name"
    );

    if (!content) {
      return res
        .status(404)
        .json({ success: false, error: "Content not found" });
    }

    // If it's a series, also fetch its episodes
    if (content.type === "series") {
      await content.populate("episodes");
    }

    res.json({ success: true, data: content });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update content view count
exports.updateViews = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

    if (!content) {
      return res
        .status(404)
        .json({ success: false, error: "Content not found" });
    }

    // Increase view count by 1
    content.views += 1;
    await content.save();

    res.json({
      success: true,
      message: "View count updated",
      views: content.views,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Add or remove like
exports.toggleLike = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

    if (!content) {
      return res
        .status(404)
        .json({ success: false, error: "Content not found" });
    }

    // Check if content should be liked or unliked
    const { action } = req.body;

    if (action === "like") {
      content.likes += 1;
    } else if (action === "unlike") {
      // Ensure like count doesn't go below zero
      content.likes = Math.max(0, content.likes - 1);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid action, use "like" or "unlike"',
      });
    }

    await content.save();

    res.json({
      success: true,
      message: `Content ${action}d successfully`,
      likes: content.likes,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get most popular content
exports.getPopularContent = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // The popularity algorithm can be customized as needed
    // Here we're weighing views and likes
    const contents = await Content.find()
      .populate("genres", "name")
      .sort({
        views: -1, // First by views
        likes: -1, // Then by likes if views are equal
      })
      .limit(limit);

    res.json({
      success: true,
      count: contents.length,
      data: contents,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get newest content by genre
exports.getNewestByGenre = async (req, res) => {
  try {
    const genreId = req.params.genreId;
    const limit = parseInt(req.query.limit) || 5;

    const contents = await Content.find({ genres: genreId })
      .populate("genres", "name")
      .sort({ releaseYear: -1, createdAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      count: contents.length,
      data: contents,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// מנוע המלצות תוכן בהתבסס על ז'אנרים מועדפים
exports.getRecommendations = async (req, res) => {
  try {
    // מקבלים מערך של ז'אנרים מועדפים
    let { likedGenres, likedContent, excludeIds } = req.body;

    // הגבלת מספר התוצאות
    const limit = parseInt(req.query.limit) || 10;

    // וידוא שיש ערך ברירת מחדל למשתנים
    likedGenres = likedGenres || [];
    likedContent = likedContent || [];
    excludeIds = excludeIds || [];

    console.log("=== RECOMMENDATIONS API DEBUG ===");
    console.log("Request params:", {
      limit,
      likedGenresCount: likedGenres.length,
      likedGenres,
      likedContentCount: likedContent.length,
      excludeIdsCount: excludeIds.length,
    });

    // מניעת המלצה על תכנים שכבר נצפו
    if (Array.isArray(excludeIds) && excludeIds.length > 0) {
      excludeIds = excludeIds.map((id) => id.toString());
    }

    // בניית מערכת ניקוד למיון תוכן
    const pipeline = [];

    // השלב הראשון: סינון תכנים שכבר נצפו
    if (excludeIds.length > 0) {
      console.log(`Excluding ${excludeIds.length} content items that user has already watched/liked`);
      pipeline.push({
        $match: {
          _id: {
            $nin: excludeIds.map((id) => new mongoose.Types.ObjectId(id)),
          },
        },
      });
    }

    // אם יש ז'אנרים מועדפים, ניתן ניקוד גבוה יותר לתכנים מאותם ז'אנרים
    if (likedGenres.length > 0) {
      console.log(`Filtering by ${likedGenres.length} preferred genres:`, likedGenres);
      pipeline.push({
        $addFields: {
          // חישוב מספר הז'אנרים המשותפים עם הז'אנרים המועדפים
          genreMatchCount: {
            $size: {
              $setIntersection: [
                "$genres",
                likedGenres.map((id) => new mongoose.Types.ObjectId(id)),
              ],
            },
          },
        },
      });

      // סינון תכנים שאין להם ז'אנר משותף
      // אבל אם אין תוכן עם ז'אנרים תואמים, נמלא עם תוכן פופולרי אחר כך
      pipeline.push({
        $match: {
          genreMatchCount: { $gt: 0 },
        },
      });
    } else {
      console.log("No preferred genres, will recommend based on popularity only");
      // אם אין ז'אנרים מועדפים, נוסיף שדה ריק כדי לא לשבור את המשך הפיפליין
      pipeline.push({
        $addFields: {
          genreMatchCount: 0,
        },
      });
    }
    
    // Count how many documents match before limiting
    const countPipeline = [...pipeline];
    countPipeline.push({ $count: "total" });
    const countResult = await Content.aggregate(countPipeline);
    const totalAvailable = countResult[0]?.total || 0;
    console.log(`Found ${totalAvailable} content items matching criteria (before limit)`);
    
    // If no content matches the genre criteria, we'll fill with popular content later
    if (totalAvailable === 0 && likedGenres.length > 0) {
      console.log(`⚠️ No content found with matching genres. Will fill with popular content.`);
    }

    // הוספת ניקוד משוקלל המשלב פופולריות וז'אנרים מועדפים
    pipeline.push({
      $addFields: {
        // נוסחה לניקוד: (צפיות + לייקים * 5) * (1 + מספר הז'אנרים המשותפים)
        recommendationScore: {
          $multiply: [
            { $add: ["$views", { $multiply: ["$likes", 5] }] },
            { $add: [1, "$genreMatchCount"] },
          ],
        },
      },
    });

    // מיון לפי ניקוד יורד
    pipeline.push({
      $sort: {
        recommendationScore: -1,
        releaseYear: -1, // אם הניקוד שווה, נעדיף תוכן חדש יותר
      },
    });

    // הגבלת מספר התוצאות
    pipeline.push({
      $limit: limit,
    });

    // קבלת המידע על הז'אנרים
    pipeline.push({
      $lookup: {
        from: "genres",
        localField: "genres",
        foreignField: "_id",
        as: "genres",
      },
    });

    // הרצת השאילתה המורכבת
    console.log("Running aggregation pipeline with", pipeline.length, "stages");
    let recommendations = await Content.aggregate(pipeline);

    console.log("Aggregation result:", {
      requestedLimit: limit,
      actualCount: recommendations.length,
      recommendations: recommendations.map((item) => ({
        id: item._id,
        title: item.title,
        genreMatchCount: item.genreMatchCount,
        recommendationScore: item.recommendationScore,
      })),
    });

    // Always try to fill with popular content if we don't have enough recommendations
    // This ensures we always return the requested number of recommendations (if available)
    if (recommendations.length < limit) {
      console.log(`Only found ${recommendations.length} recommendations, filling with popular content...`);
      
      // Get IDs we already have
      const existingIds = new Set(recommendations.map((r) => r._id.toString()));
      if (excludeIds.length > 0) {
        excludeIds.forEach((id) => existingIds.add(id.toString()));
      }

      const neededCount = limit - recommendations.length;
      console.log(`Need ${neededCount} more recommendations. Excluding ${existingIds.size} content items.`);
      console.log(`ExcludeIds (first 10):`, excludeIds.slice(0, 10)); // Log first 10 for debugging
      console.log(`Existing recommendation IDs (first 10):`, recommendations.map(r => r._id.toString()).slice(0, 10));

      // First, let's check how many total content items exist in the database
      const totalContentCount = await Content.countDocuments({});
      console.log(`Total content in database: ${totalContentCount}`);

      // Fetch popular content that's not already in recommendations or excludeIds
      const additionalContent = await Content.find({
        _id: { $nin: Array.from(existingIds).map((id) => new mongoose.Types.ObjectId(id)) },
      })
        .populate("genres", "name")
        .sort({ views: -1, likes: -1, releaseYear: -1 })
        .limit(neededCount);

      console.log(`Found ${additionalContent.length} additional popular content items`);
      
      if (additionalContent.length === 0) {
        console.warn(`⚠️ No additional content available.`);
        console.warn(`Total content in DB: ${totalContentCount}`);
        console.warn(`ExcludeIds count: ${excludeIds.length}`);
        console.warn(`Existing recommendations: ${recommendations.length}`);
        console.warn(`This means all ${totalContentCount} content items are already in excludeIds or recommendations.`);
      }
      
      // Convert to same format as recommendations
      const additionalFormatted = additionalContent.map((item) => {
        const itemObj = item.toObject();
        // Calculate genreMatchCount for additional content (might have some matching genres)
        let genreMatchCount = 0;
        if (likedGenres.length > 0 && item.genres && Array.isArray(item.genres)) {
          const itemGenreIds = item.genres.map((g) => 
            typeof g === "object" ? g._id.toString() : g.toString()
          );
          const matchingGenres = likedGenres.filter((gId) => 
            itemGenreIds.includes(gId.toString())
          );
          genreMatchCount = matchingGenres.length;
        }
        itemObj.genreMatchCount = genreMatchCount;
        itemObj.recommendationScore = (item.views || 0) + (item.likes || 0) * 5;
        return itemObj;
      });

      recommendations = [...recommendations, ...additionalFormatted];
      console.log(`Total recommendations after filling: ${recommendations.length}`);
    }

    console.log("=== END RECOMMENDATIONS API DEBUG ===");

    res.json({
      success: true,
      count: recommendations.length,
      data: recommendations,
    });
  } catch (err) {
    console.error("Error in getRecommendations:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
