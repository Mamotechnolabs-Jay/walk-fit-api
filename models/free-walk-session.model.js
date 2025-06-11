const mongoose = require('mongoose');

// Free Walk Session Model - for tracking free walking activities
const freeWalkSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  // Session details
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'cancelled'],
    default: 'active'
  },
  // Target and actual metrics
  targetSteps: {
    type: Number,
    default: 4000
  },
  actualSteps: {
    type: Number,
    default: 0
  },
  targetDistance: {
    type: Number, // in km
    default: 0
  },
  actualDistance: {
    type: Number, // in km
    default: 0
  },
  caloriesBurned: {
    type: Number,
    default: 0
  },
  averagePace: {
    type: String, // e.g., "5:30/km"
    default: null
  },
  // Location and route tracking
  locationTracking: {
    enabled: {
      type: Boolean,
      default: false
    },
    startLocation: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    endLocation: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    route: [{
      latitude: Number,
      longitude: Number,
      timestamp: Date,
      altitude: Number,
      accuracy: Number
    }]
  },
  // Real-time tracking data
  realTimeData: [{
    timestamp: Date,
    steps: Number,
    distance: Number,
    pace: String,
    heartRate: Number, // if available
    calories: Number
  }],
  // Environmental data
  weather: {
    temperature: Number,
    humidity: Number,
    condition: String // sunny, cloudy, rainy, etc.
  },
  // User experience
  difficulty: {
    type: String,
    enum: ['easy', 'moderate', 'challenging'],
    default: null
  },
  userRating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  notes: {
    type: String,
    default: null
  },
  // Achievements during session
  milestonesReached: [{
    type: String,
    achievedAt: Date,
    value: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  }
});

// Create indexes for better performance
freeWalkSessionSchema.index({ userId: 1, startTime: -1 });
freeWalkSessionSchema.index({ sessionId: 1 });
freeWalkSessionSchema.index({ userId: 1, status: 1, startTime: -1 });

module.exports = mongoose.model('FreeWalkSession', freeWalkSessionSchema);