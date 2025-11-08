const Content = require("../models/content");
const ViewingHabit = require("../models/viewingHabit");
const User = require("../models/user");
const mongoose = require("mongoose");

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
        $sort: { totalViews: -1, totalLikes: -1 },
      },
    ]);

    // Ensure data is sorted by totalViews (descending), then by totalLikes
    result.sort((a, b) => {
      const viewsA = a.totalViews || 0;
      const viewsB = b.totalViews || 0;
      if (viewsB !== viewsA) {
        return viewsB - viewsA;
      }
      return (b.totalLikes || 0) - (a.totalLikes || 0);
    });

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.dailyViews = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: "Invalid user ID" });
    }

    // Get user and their profiles
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Calculate start and end of today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Get all profile IDs for this user
    const profileIds = user.profiles.map((profile) => profile._id);

    // Aggregate views by profile for today
    const viewsByProfile = await ViewingHabit.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          profile: { $in: profileIds },
          lastWatchedAt: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        },
      },
      {
        $group: {
          _id: "$profile",
          viewCount: { $sum: 1 },
          totalDuration: { $sum: "$lastPositionSec" },
        },
      },
    ]);

    // Create a map of profile views for quick lookup
    const viewsMap = new Map();
    viewsByProfile.forEach((item) => {
      viewsMap.set(item._id.toString(), {
        viewCount: item.viewCount,
        totalDuration: item.totalDuration,
      });
    });

    // Build result array with all profiles, including those with 0 views
    const result = user.profiles.map((profile) => {
      const profileIdStr = profile._id.toString();
      const viewsData = viewsMap.get(profileIdStr) || {
        viewCount: 0,
        totalDuration: 0,
      };

      return {
        profileId: profileIdStr,
        profileName: profile.name,
        viewCount: viewsData.viewCount,
        totalDuration: viewsData.totalDuration,
      };
    });

    // Sort by view count (descending)
    result.sort((a, b) => b.viewCount - a.viewCount);

    res.json({
      success: true,
      date: startOfDay.toISOString().split("T")[0],
      data: result,
    });
  } catch (err) {
    console.error("Error in dailyViews:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
