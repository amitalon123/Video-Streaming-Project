const Genre = require("../models/genre");
const Content = require("../models/content");

// קבלת כל הז'אנרים
exports.getAllGenres = async (req, res) => {
  try {
    const genres = await Genre.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, count: genres.length, data: genres });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// קבלת ז'אנר בודד לפי ID
exports.getGenreById = async (req, res) => {
  try {
    const genre = await Genre.findById(req.params.id);
    
    if (!genre) {
      return res.status(404).json({ success: false, error: "Genre not found" });
    }
    
    res.json({ success: true, data: genre });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// יצירת ז'אנר חדש
exports.createGenre = async (req, res) => {
  try {
    const genre = await Genre.create(req.body);
    res.status(201).json({ success: true, data: genre });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// עדכון ז'אנר קיים
exports.updateGenre = async (req, res) => {
  try {
    const genre = await Genre.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    if (!genre) {
      return res.status(404).json({ success: false, error: "Genre not found" });
    }
    
    res.json({ success: true, data: genre });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// מחיקת ז'אנר
exports.deleteGenre = async (req, res) => {
  try {
    const genre = await Genre.findById(req.params.id);
    
    if (!genre) {
      return res.status(404).json({ success: false, error: "Genre not found" });
    }
    
    // בדיקה אם יש תכנים שמשתמשים בז'אנר זה
    const contentUsingGenre = await Content.countDocuments({ genres: req.params.id });
    
    if (contentUsingGenre > 0) {
      // במקום למחוק, מסמנים כלא פעיל
      genre.isActive = false;
      await genre.save();
      return res.json({ 
        success: true, 
        message: `Genre marked as inactive because it's used by ${contentUsingGenre} content items` 
      });
    }
    
    // אם אין תכנים שמשתמשים בז'אנר, אפשר למחוק אותו
    await genre.deleteOne();
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// קבלת כל התכנים השייכים לז'אנר מסוים (עם pagination, sorting ו-filtering)
exports.getContentByGenre = async (req, res) => {
  try {
    const genreId = req.params.id;
    
    // בדיקה שהז'אנר קיים
    const genre = await Genre.findById(genreId);
    if (!genre) {
      return res.status(404).json({ success: false, error: "Genre not found" });
    }
    
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = { genres: genreId };
    
    // Filter by content type if provided
    if (req.query.type && req.query.type !== "all") {
      filter.type = req.query.type;
    }
    
    // Build sort object
    let sort = {};
    if (req.query.sort) {
      const sortParts = req.query.sort.split(":");
      if (sortParts.length === 2) {
        const field = sortParts[0];
        const order = sortParts[1] === "-1" ? -1 : 1;
        sort[field] = order;
      }
    } else {
      // Default sort by creation date (newest first)
      sort = { createdAt: -1 };
    }
    
    // Get total count for pagination
    const total = await Content.countDocuments(filter);
    
    // Get content with pagination and sorting
    const contents = await Content.find(filter)
                                 .populate("genres", "name")
                                 .sort(sort)
                                 .skip(skip)
                                 .limit(limit);
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    res.json({ 
      success: true, 
      count: contents.length,
      total: total,
      genre: genre.name,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        limit: limit,
        hasNextPage: hasNextPage,
        hasPrevPage: hasPrevPage
      },
      data: contents 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
