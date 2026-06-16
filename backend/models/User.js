// models/User.js
// Passwords are hashed in a pre-save hook to ensure security is enforced at the model layer.

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true, // always store as lowercase
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // NEVER returned in queries unless explicitly requested
      // Excludes this field from queries by default for security.
    },
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark"],
        default: "light",
      },
      crisisContactEmail: {
        type: String,
        default: "",
      },
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // automatically adds createdAt and updatedAt
  }
);

// Hash password before saving if it has been modified
// We check isModified so we don't re-hash an already-hashed password
// when updating other user fields.
userSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) return next();

  const salt = await bcrypt.genSalt(12); // cost factor 12 is the current recommended default
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Compare candidate password with stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Return public profile JSON representation
userSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    preferences: this.preferences,
    createdAt: this.createdAt,
    lastActiveAt: this.lastActiveAt,
  };
};

module.exports = mongoose.model("User", userSchema);
