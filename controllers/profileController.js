const mongoose = require("mongoose");
const User = require("../models/user");

const MAX_PROFILES = 5;

const formatProfiles = (profiles = []) =>
  profiles.map((profile) => ({
    id: profile._id.toString(),
    name: profile.name,
    image: profile.image,
  }));

const ensureUserProfiles = async (user) => {
  if (!user) {
    return false;
  }

  const updated = user.ensureProfilesInitialized();
  if (updated) {
    await user.save();
  }
  return updated;
};

const ensureObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

exports.getProfiles = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!ensureObjectId(userId)) {
      return res.status(400).json({ success: false, error: "Invalid user id" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    await ensureUserProfiles(user);

    res.json({ success: true, data: formatProfiles(user.profiles) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, image } = req.body || {};

    if (!ensureObjectId(userId)) {
      return res.status(400).json({ success: false, error: "Invalid user id" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    await ensureUserProfiles(user);

    if (user.profiles.length >= MAX_PROFILES) {
      return res.status(400).json({ success: false, error: "Maximum number of profiles reached" });
    }

    const trimmedName = typeof name === "string" ? name.trim() : "";
    if (!trimmedName) {
      return res.status(400).json({ success: false, error: "Profile name is required" });
    }

    const profileImage = typeof image === "string" && image.trim() ? image.trim() : "/Images/User1.jpg";

    user.profiles.push({ name: trimmedName.substring(0, 20), image: profileImage });
    await user.save();

    const newProfile = user.profiles[user.profiles.length - 1];

    res.status(201).json({
      success: true,
      data: {
        id: newProfile._id.toString(),
        name: newProfile.name,
        image: newProfile.image,
      },
      profiles: formatProfiles(user.profiles),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { userId, profileId } = req.params;
    const { name, image } = req.body || {};

    if (!ensureObjectId(userId) || !ensureObjectId(profileId)) {
      return res.status(400).json({ success: false, error: "Invalid id provided" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    await ensureUserProfiles(user);

    const profile = user.profiles.id(profileId);
    if (!profile) {
      return res.status(404).json({ success: false, error: "Profile not found" });
    }

    if (typeof name === "string") {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return res.status(400).json({ success: false, error: "Profile name cannot be empty" });
      }
      profile.name = trimmedName.substring(0, 20);
    }

    if (typeof image === "string" && image.trim()) {
      profile.image = image.trim();
    }

    await user.save();

    res.json({
      success: true,
      data: {
        id: profile._id.toString(),
        name: profile.name,
        image: profile.image,
      },
      profiles: formatProfiles(user.profiles),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteProfile = async (req, res) => {
  try {
    const { userId, profileId } = req.params;

    if (!ensureObjectId(userId) || !ensureObjectId(profileId)) {
      return res.status(400).json({ success: false, error: "Invalid id provided" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    await ensureUserProfiles(user);

    const profile = user.profiles.id(profileId);
    if (!profile) {
      return res.status(404).json({ success: false, error: "Profile not found" });
    }

    profile.deleteOne();

    await user.save();

    res.json({ success: true, profiles: formatProfiles(user.profiles) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


