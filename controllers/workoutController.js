const WorkoutService = require('../services/workoutService');
const Workout = require('../models/WorkoutModel');
const WorkoutSession = require('../models/WorkoutSession');
const WorkoutSchedule = require('../models/workoutScheduleModel');
const PersonalizedWorkoutPlan = require('../models/PersonalizedWorkoutPlanModel');
const UserProfile = require('../models/UserProfile');
const DailyWorkout = require('../models/DailyWorkoutModel');

// GET all available workouts for the user's current plan
exports.getAvailableWorkouts = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find the current plan
    const plan = await PersonalizedWorkoutPlan.findOne({
      userId: userId,
      endDate: { $gte: new Date() }
    }).sort({ startDate: -1 });
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'No active workout plan found. Please generate a personalized plan first.'
      });
    }
    
    // Get the workout IDs from the plan
    const workoutIds = plan.workouts.map(workout => workout.workoutId);
    
    // Fetch workout details
    const workouts = await Workout.find({ _id: { $in: workoutIds } });
    
    res.status(200).json({
      success: true,
      count: workouts.length,
      data: workouts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available workouts',
      error: error.message
    });
  }
};

// GET a specific workout
exports.getWorkoutById = async (req, res) => {
  try {
    // Special case for 'today' endpoint
    if (req.params.id === 'today') {
      return await this.getTodaysWorkout(req, res);
    }
    
    const workout = await WorkoutService.getWorkoutDetails(req.params.id);
    
    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: workout
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workout',
      error: error.message
    });
  }
};

// POST - Start a workout session
exports.startWorkoutSession = async (req, res) => {
  try {
    const { workoutId } = req.body;
    const userId = req.user._id;
    
    // Find the workout
    const workout = await Workout.findById(workoutId);
    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found'
      });
    }
    
    // Create a new workout session
    const session = new WorkoutSession({
      userId,
      workoutId,
      workoutName: workout.name,
      startTime: new Date(),
      status: 'in_progress'
    });
    
    await session.save();
    
    // If this workout was scheduled for today, update the schedule
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const schedule = await WorkoutSchedule.findOne({
      userId,
      workoutId,
      date: { $gte: today, $lt: tomorrow }
    });
    
    if (schedule) {
      schedule.status = 'in_progress';
      await schedule.save();
      
      // Update the daily workout record
      await WorkoutService.updateDailyWorkoutSessionStatus(userId, session._id, 'in_progress');
    }
    
    res.status(201).json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to start workout session',
      error: error.message
    });
  }
};

// PUT - Update a workout session
exports.updateWorkoutSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user._id;
    
    // Find the session
    const session = await WorkoutSession.findOne({
      _id: sessionId,
      userId
    });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Workout session not found'
      });
    }
    
    // Update the session with provided data
    Object.keys(req.body).forEach(key => {
      session[key] = req.body[key];
    });
    
    // If status is being updated to completed, set endTime if not provided
    if (req.body.status === 'completed' && !req.body.endTime) {
      session.endTime = new Date();
      
      // Calculate session duration in seconds if not provided
      if (!req.body.duration && session.startTime) {
        session.duration = Math.floor((session.endTime - session.startTime) / 1000);
      }
    }
    
    await session.save();
    
    // If status is completed, update any associated schedule and DailyWorkout
    if (session.status === 'completed' && session.workoutId) {
      const startOfDay = new Date(session.startTime);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);
      
      const schedule = await WorkoutSchedule.findOne({
        userId,
        workoutId: session.workoutId,
        date: { $gte: startOfDay, $lt: endOfDay }
      });
      
      if (schedule) {
        schedule.status = 'completed';
        schedule.completedSessionId = session._id;
        schedule.actualSteps = session.totalSteps || 0;
        await schedule.save();
        
        // Update daily workout record
        await WorkoutService.updateDailyWorkoutSessionStatus(userId, session._id, 'completed');
      }
    }
    
    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update workout session',
      error: error.message
    });
  }
};

// PUT - Complete a workout session
exports.completeWorkoutSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user._id;
    const { totalSteps, totalDistance, caloriesBurned, route, heartRateData } = req.body;
    
    // Find the session
    const session = await WorkoutSession.findOne({
      _id: sessionId,
      userId
    });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Workout session not found'
      });
    }
    
    // Update session data
    session.endTime = new Date();
    session.status = 'completed';
    session.duration = Math.floor((session.endTime - session.startTime) / 1000);
    
    if (totalSteps) session.totalSteps = totalSteps;
    if (totalDistance) session.totalDistance = totalDistance;
    if (caloriesBurned) session.caloriesBurned = caloriesBurned;
    if (route) session.route = route;
    if (heartRateData) session.heartRateData = heartRateData;
    
    // Calculate average pace if distance and duration available
    if (session.totalDistance && session.duration) {
      // Convert to seconds per km
      const distanceInKm = session.totalDistance / 1000;
      session.averagePace = session.duration / distanceInKm;
    }
    
    await session.save();
    
    // Update workout schedule if applicable
    const startOfDay = new Date(session.startTime);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    
    const schedule = await WorkoutSchedule.findOne({
      userId,
      workoutId: session.workoutId,
      date: { $gte: startOfDay, $lt: endOfDay }
    });
    
    if (schedule) {
      schedule.status = 'completed';
      schedule.completedSessionId = session._id;
      schedule.actualSteps = session.totalSteps || 0;
      await schedule.save();
      
      // Update daily workout record
      await WorkoutService.updateDailyWorkoutSessionStatus(userId, session._id, 'completed');
    }
    
    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to complete workout session',
      error: error.message
    });
  }
};

// GET - Get user's workout sessions with filters
exports.getWorkoutSessions = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Parse query parameters for filtering
    const { status, startDate, endDate, limit = 10, page = 1 } = req.query;
    
    // Build query
    const query = { userId };
    
    if (status) {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.startTime = {};
      
      if (startDate) {
        query.startTime.$gte = new Date(startDate);
      }
      
      if (endDate) {
        query.startTime.$lte = new Date(endDate);
      }
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get sessions with pagination
    const sessions = await WorkoutSession.find(query)
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Count total sessions for pagination
    const total = await WorkoutSession.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: sessions.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      page: parseInt(page),
      data: sessions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workout sessions',
      error: error.message
    });
  }
};

// GET - Get user's workout schedule
exports.getWorkoutSchedule = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Parse query parameters
    const { startDate, endDate, status } = req.query;
    
    // Build query
    const query = { userId };
    
    if (status) {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.date = {};
      
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    } else {
      // Default to show schedule for next 7 days
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      query.date = {
        $gte: today,
        $lt: nextWeek
      };
    }
    
    // Get scheduled workouts
    const schedule = await WorkoutSchedule.find(query)
      .sort({ date: 1 })
      .populate('workoutId', 'name description duration type intensity image');
    
    res.status(200).json({
      success: true,
      count: schedule.length,
      data: schedule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workout schedule',
      error: error.message
    });
  }
};

// POST - Generate a personalized workout plan
exports.generatePersonalizedPlan = async (req, res) => {
  try {
    const userId = req.user._id;
    const { weeks = 4 } = req.body;
    
    // Check if user already has an active plan
    const existingPlan = await PersonalizedWorkoutPlan.findOne({
      userId,
      endDate: { $gte: new Date() }
    });
    
    // If existing plan found, return it unless force regenerate is requested
    if (existingPlan && !req.body.forceRegenerate) {
      return res.status(200).json({
        success: true,
        message: 'User already has an active workout plan',
        data: existingPlan
      });
    }
    
    // If force regenerate, cancel existing workouts
    if (existingPlan) {
      // Mark existing scheduled workouts as cancelled
      await WorkoutSchedule.updateMany(
        { 
          userId, 
          date: { $gte: new Date() },
          status: 'scheduled'
        },
        { status: 'cancelled', cancellationReason: 'New plan requested by user' }
      );
      
      // Remove the existing plan
      await PersonalizedWorkoutPlan.findByIdAndDelete(existingPlan._id);
      
      // Delete future daily workouts
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      await DailyWorkout.deleteMany({
        userId,
        date: { $gte: today }
      });
    }
    
    // Generate a new personalized plan
    const plan = await WorkoutService.generatePersonalizedPlan(userId, weeks);
    
    res.status(201).json({
      success: true,
      message: 'Personalized workout plan generated successfully',
      data: plan
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to generate personalized workout plan',
      error: error.message
    });
  }
};

// GET - Get today's workout
exports.getTodaysWorkout = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get today's workout using the service
    const dailyWorkout = await WorkoutService.getTodaysWorkout(userId);
    
    if (!dailyWorkout || !dailyWorkout.workoutId) {
      return res.status(404).json({
        success: false,
        message: 'No workout scheduled for today'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        dailyWorkout,
        workout: dailyWorkout.workoutId,
        schedule: dailyWorkout.scheduleId,
        activeSession: dailyWorkout.activeSessionId,
        completedSession: dailyWorkout.completedSessionId,
        targetSteps: dailyWorkout.targetSteps,
        completed: dailyWorkout.completed
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch today\'s workout',
      error: error.message
    });
  }
};

// GET - Get current workout plan
exports.getCurrentPlan = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find the active plan
    const plan = await PersonalizedWorkoutPlan.findOne({
      userId: userId,
      endDate: { $gte: new Date() }
    }).sort({ startDate: -1 });
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'No active workout plan found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: plan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch current workout plan',
      error: error.message
    });
  }
};

// GET - Get daily workouts for a date range
exports.getDailyWorkouts = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;
    
    const query = { userId };
    
    if (startDate || endDate) {
      query.date = {};
      
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    } else {
      // Default to show for current week
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      
      query.date = {
        $gte: weekStart,
        $lt: weekEnd
      };
    }
    
    // Get daily workouts with populated data
    const dailyWorkouts = await DailyWorkout.find(query)
      .sort({ date: 1 })
      .populate('workoutId')
      .populate('completedSessionId');
    
    res.status(200).json({
      success: true,
      count: dailyWorkouts.length,
      data: dailyWorkouts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily workouts',
      error: error.message
    });
  }
};

// Function to be called when profile is updated
exports.regeneratePlanAfterProfileUpdate = async (userId) => {
  try {
    console.log(`Regenerating workout plan for user ${userId} after profile update`);
    
    // Check if user already has an active plan
    const existingPlan = await PersonalizedWorkoutPlan.findOne({
      userId,
      endDate: { $gte: new Date() }
    });
    
    if (existingPlan) {
      // Mark existing scheduled workouts as cancelled
      await WorkoutSchedule.updateMany(
        { 
          userId, 
          date: { $gte: new Date() },
          status: 'scheduled'
        },
        { status: 'cancelled', cancellationReason: 'Profile updated, new plan generated' }
      );
      
      // Delete future daily workouts
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      await DailyWorkout.deleteMany({
        userId,
        date: { $gte: today }
      });
      
      // Delete the existing plan
      await PersonalizedWorkoutPlan.findByIdAndDelete(existingPlan._id);
    }
    
    // Generate a new personalized plan based on updated profile
    const newPlan = await WorkoutService.generatePersonalizedPlan(userId, 4); // 4 weeks by default
    return newPlan;
  } catch (error) {
    console.error('Failed to regenerate workout plan after profile update:', error);
    throw error;
  }
};