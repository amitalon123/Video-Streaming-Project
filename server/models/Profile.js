const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    isKid: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

profileSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Profile", profileSchema);


