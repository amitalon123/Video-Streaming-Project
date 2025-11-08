const mongoose = require("mongoose");

const MAX_PROFILES = 5;
const DEFAULT_AVATAR = "/Images/User1.jpg";

function buildDefaultProfile(name) {
  const rawName = typeof name === "string" && name.trim() ? name.trim() : "Profile";
  const firstName = rawName.split(/\s+/)[0];
  return {
    name: firstName.substring(0, 20),
    image: DEFAULT_AVATAR,
  };
}

const profileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    image: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    profiles: {
      type: [profileSchema],
      default: function defaultProfiles() {
        return [buildDefaultProfile(this && this.name)];
      },
      validate: {
        validator: (profiles = []) => profiles.length <= MAX_PROFILES,
        message: `A user can have at most ${MAX_PROFILES} profiles`,
      },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ name: "text", email: "text" });
userSchema.index({ email: 1 }, { unique: true });

userSchema.statics.buildDefaultProfiles = (name) => [buildDefaultProfile(name)];

userSchema.methods.ensureProfilesInitialized = function ensureProfilesInitialized() {
  if (!Array.isArray(this.profiles) || this.profiles.length === 0) {
    this.profiles = this.constructor.buildDefaultProfiles(this.name);
    return true;
  }
  return false;
};

const User = mongoose.model("User", userSchema);

module.exports = User;


