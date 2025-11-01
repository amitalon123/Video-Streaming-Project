const Content = require("../models/content");

exports.sumPopularityByGenre = async (req, res) => {
  try {
    const result = await Content.aggregate([
      {
        $unwind: "$genres",
      },
      {
        $group: {
          _id: "$genres",
          totalLikes: { $sum: "$likes" },
          totalViews: { $sum: "$views" },
        },
      },
      {
        $lookup: {
          from: "genres",
          localField: "_id",
          foreignField: "_id",
          as: "genreDetails",
        },
      },
      {
        $project: {
          _id: 0,
          genreId: "$_id",
          genreName: "$genreDetails.name",
          totalLikes: 1,
          totalViews: 1,
        },
      },

      {
        $sort: { totalLikes: -1 },
      },
    ]);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
