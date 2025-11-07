const User = require("../models/User");
const Profile = require("../models/Profile");

async function ensureDemoUser() {
  let user = await User.findOne({ username: "demo" });
  if (!user) {
    user = await User.create({
      email: "demo@example.com",
      username: "demo",
      passwordHash: "demo",
      role: "user",
    });
  }
  return user;
}

exports.listProfiles = async (req, res) => {
  try {
    const user = await ensureDemoUser();
    let profiles = await Profile.find({ user: user._id }).lean();

    if (profiles.length === 0) {
      const defaults = [
        { name: "Amit", avatarUrl: "/Images/Amit.jpg" },
        { name: "Asaf", avatarUrl: "/Images/Asaf.jpg" },
        { name: "Reut", avatarUrl: "/Images/Reut.jpg" },
        { name: "Edith", avatarUrl: "/Images/Edith.jpg" },
        { name: "Daniel", avatarUrl: "/Images/Daniel.jpg" },
      ].map((p) => ({ ...p, user: user._id }));

      profiles = await Profile.insertMany(defaults);
    }

    res.json({ success: true, data: profiles });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, avatarUrl, isKid } = req.body || {};
    const updates = {};
    if (typeof name === "string") updates.name = name;
    if (typeof avatarUrl === "string") updates.avatarUrl = avatarUrl;
    if (typeof isKid === "boolean") updates.isKid = isKid;

    const updated = await Profile.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ success: false, error: "Profile not found" });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};


