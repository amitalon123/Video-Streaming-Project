const User = require("../models/user");
const bcrypt = require("bcryptjs");

const formatProfiles = (profiles = []) =>
  profiles.map((profile) => ({
    id: profile._id.toString(),
    name: profile.name,
    image: profile.image,
  }));

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase(), isActive: true });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    // Ensure profiles exist for legacy accounts
    const profilesInitialized = user.ensureProfilesInitialized();
    if (profilesInitialized) {
      await user.save();
    }

    // No sessions for now; return safe user info the FE can store
    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl || "",
        profiles: formatProfiles(user.profiles),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: "Name, email and password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, error: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: "user",
    });

    await user.ensureProfilesInitialized();

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl || "",
        profiles: formatProfiles(user.profiles),
      },
    });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ success: false, error: "Email already in use" });
    }
    res.status(400).json({ success: false, error: err.message });
  }
};


