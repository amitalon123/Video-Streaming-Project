const Content = require("../models/content");
const mongoose = require("mongoose");

// קבלת כל התכנים עם אפשרות לסינון, מיון ודפדוף
exports.getAllContent = async (req, res) => {
  try {
    const filter = {};

    // מאפשר סינון לפי סוג תוכן (סרט/סדרה)
    if (req.query.type) {
      filter.type = req.query.type;
    }

    // מאפשר חיפוש טקסטואלי
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    // סינון לפי שנה
    if (req.query.year) {
      filter.releaseYear = parseInt(req.query.year);
    }

    // טווח שנים
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

    // סינון לפי ז'אנר (לפי ID)
    if (req.query.genre) {
      filter.genres = req.query.genre;
    }

    // סינון לפי דירוג מינימלי
    if (req.query.minRating) {
      filter.rating = { $gte: parseFloat(req.query.minRating) };
    }

    // אפשרויות מיון
    let sortOptions = { createdAt: -1 }; // ברירת מחדל - מהחדש לישן
    if (req.query.sort) {
      switch (req.query.sort) {
        case "title":
          sortOptions = { title: 1 }; // מיון לפי כותרת (A-Z)
          break;
        case "title_desc":
          sortOptions = { title: -1 }; // מיון לפי כותרת (Z-A)
          break;
        case "year":
          sortOptions = { releaseYear: 1 }; // מישן לחדש
          break;
        case "year_desc":
          sortOptions = { releaseYear: -1 }; // מחדש לישן
          break;
        case "rating":
          sortOptions = { rating: -1 }; // מדירוג גבוה לנמוך
          break;
        case "popularity":
          sortOptions = { views: -1, likes: -1 }; // לפי פופולריות
          break;
      }
    }

    // דפדוף (pagination)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // בניית השאילתה
    const contentQuery = Content.find(filter)
      .populate("genres", "name")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    // הרצת השאילתה
    const contents = await contentQuery;

    // ספירת סך התוצאות (ללא דפדוף)
    const total = await Content.countDocuments(filter);

    // חישוב מספר העמודים
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

// קבלת תוכן בודד לפי ID
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

    // אם זו סדרה, צריך להביא גם את הפרקים שלה
    if (content.type === "series") {
      await content.populate("episodes");
    }

    res.json({ success: true, data: content });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// יצירת תוכן חדש
exports.createContent = async (req, res) => {
  try {
    const content = await Content.create(req.body);
    res.status(201).json({ success: true, data: content });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// עדכון תוכן קיים
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

// מחיקת תוכן
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

// עדכון מספר הצפיות בתוכן
exports.updateViews = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

    if (!content) {
      return res
        .status(404)
        .json({ success: false, error: "Content not found" });
    }

    // הגדלת מספר הצפיות ב-1
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

// הוספה או הסרת לייק
exports.toggleLike = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

    if (!content) {
      return res
        .status(404)
        .json({ success: false, error: "Content not found" });
    }

    // בדיקה אם התוכן קיבל לייק או שצריך להסיר את הלייק
    const { action } = req.body;

    if (action === "like") {
      content.likes += 1;
    } else if (action === "unlike") {
      // וידוא שמספר הלייקים לא יורד מתחת ל-0
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

// קבלת התכנים הפופולריים ביותר
exports.getPopularContent = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // ניתן לשנות את האלגוריתם לפופולריות לפי הצורך
    // כאן אנחנו משקללים צפיות ולייקים
    const contents = await Content.find()
      .populate("genres", "name")
      .sort({
        views: -1, // קודם כל לפי צפיות
        likes: -1, // אם יש שוויון בצפיות, אז לפי לייקים
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

// קבלת התכנים החדשים ביותר לפי ז'אנר
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

    // מניעת המלצה על תכנים שכבר נצפו
    if (Array.isArray(excludeIds) && excludeIds.length > 0) {
      excludeIds = excludeIds.map((id) => id.toString());
    }

    // בניית מערכת ניקוד למיון תוכן
    const pipeline = [];

    // השלב הראשון: סינון תכנים שכבר נצפו
    if (excludeIds.length > 0) {
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
      pipeline.push({
        $match: {
          genreMatchCount: { $gt: 0 },
        },
      });
    } else {
      // אם אין ז'אנרים מועדפים, נוסיף שדה ריק כדי לא לשבור את המשך הפיפליין
      pipeline.push({
        $addFields: {
          genreMatchCount: 0,
        },
      });
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
    const recommendations = await Content.aggregate(pipeline);

    res.json({
      success: true,
      count: recommendations.length,
      data: recommendations,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
