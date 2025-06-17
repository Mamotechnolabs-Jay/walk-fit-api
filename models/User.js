const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  mobile: {
    type: String,
    // Only required for traditional signup
    required: function() {
      return !this.googleId && !this.facebookId;
    },
    trim: true
  },
  password: {
    type: String,
    // Only required for traditional signup
    required: function() {
      return !this.googleId && !this.facebookId;
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationMethod: {
    type: String,
    enum: ['email', 'sms', 'google', 'facebook'],
    default: 'email'
  },
  verificationCode: String,
  verificationExpires: Date,
  
  // OAuth fields
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  facebookId: {
    type: String,
    sparse: true,
    unique: true
  },
  
  // Profile data
  profilePicture: String,
  
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it exists and was modified
  if (!this.password || !this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  // If no password (OAuth user), always return false
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);