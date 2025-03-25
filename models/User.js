const crypto = require("crypto")
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a name"]
  },
  email: {
    type: String,
    required: [true, "Please add an email"],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please add a valid email"
    ]
  },
  role: {
    type: String,
    enum: ["user", "publisher"],
    default: "user"
  },
  password: {
    type: String,
    required: [true, "Please add a password"],
    minlength: 6,
    select: false // when we get a user through API, it not gonna show the password
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  }
})

// Encrypt password using bcrypt
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    // if the 'password' field is not modified, we gonna move along. BECAUSE: our UserSchema has the password field not returned by default:   select: false; if we dont add this if block, it gonna throw error because  the code below is trying to access this.password, but this doesn't have a password field present in forgotpassword controller.

    next()
  }
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

// Sign JWT and return
// we define it as a method because we want to call it on a specific user
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  })
}

// Match user entered password to hashed password in db
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString("hex")

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex")

  // Set expire
  // we gonna save resetPasswordToken and resetPasswordExpire to the db for resetting purpose, we'll remove it after the user has resetted the password
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000

  // We want to return the original token, NOT the hased version, THE IDEA HERE IS: when we store the hashed token in the database, but when we send the email we gonna send the regular version
  return resetToken
}

module.exports = mongoose.model("User", UserSchema)
