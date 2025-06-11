const axios = require('axios');
const Workout = require('../models/WorkoutModel');
const PersonalizedWorkoutPlan = require('../models/PersonalizedWorkoutPlanModel');
const UserProfile = require('../models/UserProfile');
const WorkoutSchedule = require('../models/workoutScheduleModel');
const DailyWorkout = require('../models/DailyWorkoutModel');
const WorkoutSession = require('../models/WorkoutSession');

class WorkoutService {
  constructor() {
    this.apiKey = process.env.FITNESS_API_KEY;
    this.baseUrl = process.env.FITNESS_API_URL;
    
    // Pre-defined walking workouts as backup
    this.walkingWorkouts = [
      {
        name: "Morning Energy Walk",
        instructions: "Start your day with a brisk 20-30 minute walk. Focus on maintaining steady pace and deep breathing.",
        type: "walk",
        difficulty: "beginner",
        duration: 25,
        calories: 150,
        muscle: "legs"
      },
      {
        name: "Post-Lunch Digestive Walk",
        instructions: "Take a gentle 15-20 minute walk after lunch to aid digestion and boost afternoon energy.",
        type: "walk", 
        difficulty: "beginner",
        duration: 15,
        calories: 100,
        muscle: "legs"
      },
      {
        name: "Evening Stress Relief Walk",
        instructions: "Wind down with a peaceful 30-40 minute walk. Focus on relaxation and mindfulness.",
        type: "walk",
        difficulty: "beginner", 
        duration: 35,
        calories: 200,
        muscle: "legs"
      },
      {
        name: "Interval Power Walk",
        instructions: "Alternate between 2 minutes fast walking and 1 minute normal pace for 30 minutes.",
        type: "walk",
        difficulty: "intermediate",
        duration: 30,
        calories: 250,
        muscle: "legs"
      },
      {
        name: "Hill Walking Challenge",
        instructions: "Find inclined paths or use treadmill incline. Walk uphill for cardio boost and leg strengthening.",
        type: "walk",
        difficulty: "intermediate",
        duration: 40,
        calories: 300,
        muscle: "legs"
      },
      {
        name: "Long Distance Walk",
        instructions: "Extended 45-60 minute walk at comfortable pace. Great for endurance building.",
        type: "walk",
        difficulty: "advanced",
        duration: 60,
        calories: 400,
        muscle: "legs"
      }
    ];
  }

  // Fetch walking-specific exercises only
  async fetchWalkingExercises(difficulty = null) {
    try {
      // Try to get cardio exercises first
      const response = await axios.get(`${this.baseUrl}/exercises`, {
        headers: {
          'X-Api-Key': this.apiKey
        },
        params: {
          type: 'cardio',
          difficulty
        }
      });
      
      // Filter only walking-related exercises
      const walkingExercises = response.data.filter(exercise => {
        const exerciseName = exercise.name.toLowerCase();
        const exerciseInstructions = (exercise.instructions || '').toLowerCase();
        
        return (
          exerciseName.includes('walk') ||
          exerciseName.includes('walking') ||
          exerciseName.includes('treadmill walk') ||
          exerciseName.includes('brisk walk') ||
          exerciseInstructions.includes('walk') ||
          exerciseInstructions.includes('walking')
        );
      });
      
      // If no walking exercises found from API, use our predefined ones
      if (walkingExercises.length === 0) {
        console.log('No walking exercises from API, using predefined workouts');
        return this.getFilteredWalkingWorkouts(difficulty);
      }
      
      return walkingExercises;
    } catch (error) {
      console.error('Error fetching walking exercises from API:', error);
      // Fallback to predefined walking workouts
      return this.getFilteredWalkingWorkouts(difficulty);
    }
  }

  // Get predefined walking workouts filtered by difficulty
  getFilteredWalkingWorkouts(difficulty = null) {
    if (!difficulty) {
      return this.walkingWorkouts;
    }
    
    return this.walkingWorkouts.filter(workout => workout.difficulty === difficulty);
  }

  // Create walking workout variations based on user profile
  createCustomWalkingWorkouts(userProfile) {
    const customWorkouts = [];
    
    // Base walking workout parameters based on user profile
    const baseDuration = this.getBaseDuration(userProfile.dailyWalkingTime);
    const intensity = this.getUserIntensity(userProfile.fitnessLevel);
    
    // Create different types of walking workouts
    const workoutTypes = [
      {
        name: "Morning Energizer Walk",
        description: "Start your day with energy-boosting walk",
        duration: baseDuration,
        timeOfDay: "morning"
      },
      {
        name: "Lunch Break Walk", 
        description: "Quick refreshing walk during lunch break",
        duration: Math.max(15, baseDuration - 10),
        timeOfDay: "afternoon"
      },
      {
        name: "Evening Wind-Down Walk",
        description: "Relaxing walk to end your day peacefully", 
        duration: baseDuration + 5,
        timeOfDay: "evening"
      },
      {
        name: "Weekend Adventure Walk",
        description: "Longer exploratory walk for weekends",
        duration: baseDuration + 15,
        timeOfDay: "any"
      }
    ];

    // Customize workouts based on user goals
    workoutTypes.forEach(type => {
      const workout = {
        name: type.name,
        instructions: this.generateWalkingInstructions(type, userProfile),
        type: "walk",
        difficulty: userProfile.fitnessLevel || 'beginner',
        duration: type.duration,
        calories: this.calculateCalories(type.duration, userProfile.currentWeight),
        muscle: "legs",
        targetAreas: userProfile.bodyPartsToToneUp || ['legs'],
        goals: userProfile.fitnessGoals || ['general_fitness'],
        timeOfDay: type.timeOfDay
      };
      
      customWorkouts.push(workout);
    });
    
    return customWorkouts;
  }

  // Generate detailed walking instructions based on user profile
  generateWalkingInstructions(workoutType, userProfile) {
    let instructions = `${workoutType.description}. `;
    
    // Add duration specific instructions
    if (workoutType.duration <= 20) {
      instructions += "Keep a steady, comfortable pace throughout. ";
    } else if (workoutType.duration <= 40) {
      instructions += "Start with 5 minutes warm-up, maintain brisk pace in middle, cool down in last 5 minutes. ";
    } else {
      instructions += "Begin with 5-minute warm-up, maintain moderate pace for majority, include 2-3 brief fast intervals, end with 5-minute cool-down. ";
    }
    
    // Add goal-specific instructions
    if (userProfile.fitnessGoals) {
      if (userProfile.fitnessGoals.includes('lose_weight')) {
        instructions += "Focus on maintaining consistent pace to maximize calorie burn. ";
      }
      if (userProfile.fitnessGoals.includes('improve_heart_health')) {
        instructions += "Monitor your heart rate and aim for moderate intensity. ";
      }
      if (userProfile.focusAreas && userProfile.focusAreas.includes('stress_reduction')) {
        instructions += "Practice deep breathing and mindfulness while walking. ";
      }
    }
    
    // Add fitness level specific tips
    if (userProfile.fitnessLevel === 'beginner') {
      instructions += "Listen to your body and take breaks if needed. Gradually increase pace as you get comfortable.";
    } else if (userProfile.fitnessLevel === 'intermediate') {
      instructions += "Challenge yourself with slight inclines or speed intervals.";
    } else {
      instructions += "Incorporate hills, stairs, or interval training for maximum benefit.";
    }
    
    return instructions;
  }

  getBaseDuration(dailyWalkingTime) {
    switch (dailyWalkingTime) {
      case 'less_than_20_mins': return 15;
      case '20_60_mins': return 30;  
      case '1_2_hours':
      case 'more_than_2_hours': return 45;
      default: return 25;
    }
  }

  getUserIntensity(fitnessLevel) {
    switch (fitnessLevel) {
      case 'beginner': return 'light';
      case 'intermediate': return 'moderate';  
      case 'advanced': return 'intense';
      default: return 'moderate';
    }
  }

  calculateCalories(duration, weight = 70) {
    // Rough calculation: 3.5 calories per minute per kg for walking
    return Math.round(duration * (weight || 70) * 0.05);
  }

  async fetchCaloriesBurned(activity, weight, duration) {
    try {
      const response = await axios.get(`${this.baseUrl}/caloriesburned`, {
        headers: {
          'X-Api-Key': this.apiKey
        },
        params: {
          activity: 'walking', // Force walking activity
          weight,
          duration
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching calories burned data:', error);
      // Fallback calculation
      return [{
        activity: 'walking',
        calories_per_hour: Math.round(weight * 3.5),
        duration_minutes: duration,
        total_calories: this.calculateCalories(duration, weight)
      }];
    }
  }

  async createWorkoutFromExercise(exerciseData, category = 'weight_loss') {
    try {
      // Check if a similar workout already exists
      const existingWorkout = await Workout.findOne({
        name: { $regex: new RegExp(exerciseData.name, 'i') }
      });
      
      if (existingWorkout) {
        return existingWorkout;
      }
      
      // Ensure it's walking-related
      if (!this.isWalkingRelated(exerciseData)) {
        throw new Error('Exercise is not walking-related');
      }
      
      // Map category to allowed values
      let mappedCategory = 'weight_loss';
      if (['weight_loss', 'progression', 'challenge', 'free', 'beginner', 'intermediate', 'advanced'].includes(category)) {
        mappedCategory = category;
      } else if (category === 'lose_weight') {
        mappedCategory = 'weight_loss';
      } else {
        // Default based on difficulty
        const difficulty = exerciseData.difficulty || 'beginner';
        if (['beginner', 'intermediate', 'advanced'].includes(difficulty)) {
          mappedCategory = difficulty;
        }
      }
      
      // Map exercise data to workout model
      const workout = new Workout({
        name: exerciseData.name,
        description: exerciseData.instructions || `${exerciseData.name} workout`,
        type: 'walk', // Use 'walk' instead of 'walking'
        intensity: this.mapDifficultyToIntensity(exerciseData.difficulty),
        duration: exerciseData.duration || 30,
        estimatedCalories: exerciseData.calories || this.calculateCalories(exerciseData.duration || 30, 70),
        targetDistance: (exerciseData.duration || 30) / 15, // Rough estimate of distance in km (assuming 4km/h pace)
        category: mappedCategory,
        includesWarmup: true,
        includesCooldown: true,
        image: exerciseData.image || 'default-walking.jpg',
        recommendedFor: this.getRecommendationsFromExercise(exerciseData)
      });
      
      return await workout.save();
    } catch (error) {
      console.error('Error creating workout from exercise:', error);
      throw error;
    }
  }

  isWalkingRelated(exerciseData) {
    const name = (exerciseData.name || '').toLowerCase();
    const instructions = (exerciseData.instructions || '').toLowerCase();
    
    const walkingKeywords = ['walk', 'walking', 'treadmill', 'pace', 'step', 'stride'];
    
    return walkingKeywords.some(keyword => 
      name.includes(keyword) || instructions.includes(keyword)
    );
  }

  determineWalkingType(exerciseData) {
    const name = (exerciseData.name || '').toLowerCase();
    
    if (name.includes('brisk') || name.includes('fast')) return 'brisk';
    if (name.includes('slow') || name.includes('gentle')) return 'gentle';  
    if (name.includes('hill') || name.includes('incline')) return 'incline';
    if (name.includes('interval')) return 'interval';
    
    return 'moderate';
  }

  calculateStepsFromDuration(durationInMinutes) {
    // Average walking pace: 100-120 steps per minute
    return Math.round(durationInMinutes * 110);
  }

  mapDifficultyToIntensity(difficulty) {
    switch (difficulty) {
      case 'beginner': return 'light';
      case 'intermediate': return 'moderate';
      case 'expert': 
      case 'advanced': return 'intense';
      default: return 'moderate';
    }
  }

  getRecommendationsFromExercise(exerciseData) {
    const recommendations = [];
    const difficulty = exerciseData.difficulty || 'beginner';
    
    if (['beginner', 'intermediate', 'advanced'].includes(difficulty)) {
      recommendations.push(difficulty === 'beginner' ? 'beginners' : difficulty);
    }
    
    if (exerciseData.goals) {
      if (exerciseData.goals.includes('lose_weight') || 
          exerciseData.goals.includes('weight_loss')) {
        recommendations.push('weight_loss');
      }
      if (exerciseData.goals.includes('improve_heart_health')) {
        recommendations.push('heart_health');
      }
      if (exerciseData.goals.includes('relieve_stress')) {
        recommendations.push('stress_relief');
      }
    }
    
    // Limit to valid enum values
    return recommendations.filter(r => 
      ['weight_loss', 'beginners', 'intermediate', 'advanced', 'heart_health', 'stress_relief'].includes(r)
    );
  }

  // Modified method to fetch and create ONLY walking workouts
  async fetchAndCreateWalkingWorkouts(userProfile) {
    try {
      // First try to get walking exercises from API
      let difficulty = userProfile.fitnessLevel === 'advanced' ? 'expert' : userProfile.fitnessLevel;
      const apiExercises = await this.fetchWalkingExercises(difficulty);
      
      // Create custom walking workouts based on user profile  
      const customWorkouts = this.createCustomWalkingWorkouts(userProfile);
      
      // Combine API exercises with custom workouts
      const allWalkingExercises = [...apiExercises, ...customWorkouts];
      
      // Create workout records from exercises
      const workouts = [];
      for (const exercise of allWalkingExercises.slice(0, 8)) { // Limit to 8 workouts
        try {
          // Map user's fitness goals to valid category
          let category = 'weight_loss';
          if (userProfile.fitnessGoals && userProfile.fitnessGoals.length > 0) {
            if (userProfile.fitnessGoals.includes('lose_weight')) {
              category = 'weight_loss';
            } else if (userProfile.fitnessLevel && ['beginner', 'intermediate', 'advanced'].includes(userProfile.fitnessLevel)) {
              category = userProfile.fitnessLevel;
            }
          }
          
          const workout = await this.createWorkoutFromExercise(exercise, category);
          workouts.push(workout);
        } catch (error) {
          console.log(`Skipping non-walking exercise: ${exercise.name}`);
          continue;
        }
      }
      
      return workouts;
    } catch (error) {
      console.error('Error fetching and creating walking workouts:', error);
      
      // Final fallback - create workouts from predefined data
      const fallbackWorkouts = [];
      for (const walkingWorkout of this.walkingWorkouts.slice(0, 6)) {
        try {
          const workout = await this.createWorkoutFromExercise(
            walkingWorkout,
            userProfile.fitnessGoals && userProfile.fitnessGoals.includes('lose_weight') 
              ? 'weight_loss' 
              : walkingWorkout.difficulty
          );
          fallbackWorkouts.push(workout);
        } catch (err) {
          console.error('Error creating fallback workout:', err);
        }
      }
      
      return fallbackWorkouts;
    }
  }

  async getWorkoutDetails(workoutId) {
    try {
      // Special case for 'today' - we'll handle this separately
      if (workoutId === 'today') {
        throw new Error('Invalid workout ID: Use getTodaysWorkout method instead');
      }
      
      return await Workout.findById(workoutId);
    } catch (error) {
      console.error('Error fetching workout details:', error);
      throw new Error('Failed to fetch workout details');
    }
  }

  async generatePersonalizedPlan(userId, weeks = 4) {
    try {
      // Get user profile
      const userProfile = await UserProfile.findOne({ userId });
      if (!userProfile) {
        throw new Error('User profile not found');
      }
      
      // Get ONLY walking workouts for user profile
      let workouts = await this.getWalkingWorkoutsForUserProfile(userProfile);
      if (workouts.length < 5) {
        // Fetch more WALKING workouts if we don't have enough
        const additionalWalkingWorkouts = await this.fetchAndCreateWalkingWorkouts(userProfile);
        workouts.push(...additionalWalkingWorkouts);
      }
      
      // Rest of the method remains the same...
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (weeks * 7));
      
      let baseStepTarget = userProfile.stepGoal || 5000;
      if (userProfile.fitnessLevel === 'beginner') {
        baseStepTarget = Math.max(baseStepTarget, 5000);
      } else if (userProfile.fitnessLevel === 'intermediate') {
        baseStepTarget = Math.max(baseStepTarget, 7500);
      } else if (userProfile.fitnessLevel === 'advanced') {
        baseStepTarget = Math.max(baseStepTarget, 10000);
      }
      
      const plan = new PersonalizedWorkoutPlan({
        userId,
        startDate,
        endDate,
        planName: `${weeks}-Week Walking Plan for ${userProfile.fitnessGoals && userProfile.fitnessGoals[0] ? userProfile.fitnessGoals[0].replace('_', ' ') : 'Fitness'}`,
        description: `Custom walking workout plan based on your ${userProfile.fitnessLevel || 'current'} fitness level`,
        fitnessGoalsFocused: userProfile.fitnessGoals || ['general_fitness'],
        workouts: this.distributeWorkouts(workouts, weeks),
        progressiveOverload: true,
        targetStepsProgression: {
          startingSteps: baseStepTarget,
          weeklyIncrement: Math.floor(baseStepTarget * 0.05)
        }
      });
      
      const savedPlan = await plan.save();
      await this.scheduleWorkouts(savedPlan, workouts);
      
      return savedPlan;
    } catch (error) {
      console.error('Error generating personalized walking workout plan:', error);
      throw new Error('Failed to generate personalized walking workout plan');
    }
  }

  // Modified to get only walking workouts
  async getWalkingWorkoutsForUserProfile(userProfile) {
    try {
      const query = { type: 'walk' }; // Use 'walk' instead of 'walking'
      
      // Match intensity to fitness level
      if (userProfile.fitnessLevel) {
        switch (userProfile.fitnessLevel) {
          case 'beginner':
            query.intensity = 'light';
            break;
          case 'intermediate':
            query.intensity = 'moderate';
            break;
          case 'advanced':
            query.intensity = 'intense';
            break;
          default:
            query.intensity = 'moderate';
        }
      }
      
      // Match category correctly
      if (userProfile.fitnessGoals && userProfile.fitnessGoals.length > 0) {
        const categories = [];
        
        // Map fitness goals to valid categories
        if (userProfile.fitnessGoals.includes('lose_weight')) {
          categories.push('weight_loss');
        }
        
        // Add user's fitness level as a category
        if (userProfile.fitnessLevel && ['beginner', 'intermediate', 'advanced'].includes(userProfile.fitnessLevel)) {
          categories.push(userProfile.fitnessLevel);
        }
        
        // Add free category as default
        categories.push('free');
        
        if (categories.length > 0) {
          query.category = { $in: categories };
        }
      }
      
      // Find matching walking workouts
      let workouts = await Workout.find(query).limit(15);
      
      // If not enough walking workouts, get all walking workouts
      if (workouts.length < 5) {
        workouts = await Workout.find({ type: 'walk' }).limit(15);
      }
      
      return workouts;
    } catch (error) {
      console.error('Error getting walking workouts for user profile:', error);
      throw new Error('Failed to get appropriate walking workouts');
    }
  }

  // Keep existing methods for workout distribution and scheduling
  distributeWorkouts(workouts, weeks) {
    const distributedWorkouts = [];
    
    const minWorkouts = weeks * 5;
    while (workouts.length < minWorkouts) {
      workouts.push(...workouts.slice(0, Math.min(5, workouts.length)));
    }
    
    for (let week = 1; week <= weeks; week++) {
      for (let day = 1; day <= 5; day++) {
        const workoutIndex = ((week - 1) * 5 + (day - 1)) % workouts.length;
        
        distributedWorkouts.push({
          workoutId: workouts[workoutIndex]._id,
          scheduledDay: day,
          weekNumber: week
        });
      }
    }
    
    return distributedWorkouts;
  }

  async scheduleWorkouts(plan, workouts) {
    try {
      const schedules = [];
      const startDate = new Date(plan.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      const currentDay = startDate.getDay();
      const mondayDate = new Date(startDate);
      mondayDate.setDate(startDate.getDate() - ((currentDay === 0 ? 7 : currentDay) - 1));
      
      for (const workout of plan.workouts) {
        const workoutDate = new Date(mondayDate);
        workoutDate.setDate(mondayDate.getDate() + 
          (workout.weekNumber - 1) * 7 + 
          (workout.scheduledDay - 1)
        );
        
        const targetSteps = plan.targetStepsProgression.startingSteps + 
          ((workout.weekNumber - 1) * plan.targetStepsProgression.weeklyIncrement);
        
        const schedule = new WorkoutSchedule({
          userId: plan.userId,
          workoutId: workout.workoutId,
          date: workoutDate,
          status: 'scheduled',
          targetSteps: targetSteps,
          notes: `Week ${workout.weekNumber} walking workout`
        });
        
        const savedSchedule = await schedule.save();
        schedules.push(savedSchedule);
        
        // Create DailyWorkout entry for this workout if it's today or in the future
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (workoutDate >= today) {
          await this.createOrUpdateDailyWorkout(plan.userId, workoutDate, workout.workoutId, savedSchedule._id, targetSteps);
        }
      }
      
      return schedules;
    } catch (error) {
      console.error('Error scheduling walking workouts:', error);
      throw new Error('Failed to schedule walking workouts');
    }
  }

  // New methods for DailyWorkout functionality
  async createOrUpdateDailyWorkout(userId, date, workoutId, scheduleId, targetSteps) {
    try {
      // Create date range for the specific day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);
      
      // Create or update daily workout entry
      const dailyWorkout = await DailyWorkout.findOneAndUpdate(
        { userId, date: startOfDay },
        {
          userId,
          date: startOfDay,
          workoutId,
          scheduleId,
          targetSteps,
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );
      
      return dailyWorkout;
    } catch (error) {
      console.error('Error creating/updating daily workout:', error);
      throw error;
    }
  }

  async getTodaysWorkout(userId) {
    try {
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Try to find cached daily workout first
      let dailyWorkout = await DailyWorkout.findOne({ userId, date: today })
        .populate('workoutId')
        .populate('activeSessionId')
        .populate('completedSessionId');
      
      if (dailyWorkout) {
        // If the daily workout exists but doesn't have a populated workoutId, 
        // there might be an issue with the reference
        if (!dailyWorkout.workoutId) {
          // Try to find the workout from schedule
          const schedule = await WorkoutSchedule.findOne({
            userId,
            date: { $gte: today, $lt: tomorrow }
          }).populate('workoutId');
          
          if (schedule && schedule.workoutId) {
            // Update the daily workout with correct workout reference
            dailyWorkout = await DailyWorkout.findByIdAndUpdate(
              dailyWorkout._id,
              { 
                workoutId: schedule.workoutId._id,
                scheduleId: schedule._id,
                updatedAt: new Date()
              },
              { new: true }
            ).populate('workoutId');
          }
        }
        
        return dailyWorkout;
      }
      
      // If no daily workout exists, try to find schedule and create daily workout
      const schedule = await WorkoutSchedule.findOne({
        userId,
        date: { $gte: today, $lt: tomorrow }
      }).populate('workoutId');
      
      if (!schedule) {
        // No workout scheduled for today
        return null;
      }
      
      // Check for active sessions
      let activeSession = null;
      if (schedule.status === 'in_progress') {
        activeSession = await WorkoutSession.findOne({
          userId,
          workoutId: schedule.workoutId._id,
          status: 'in_progress'
        });
      }
      
      // Create a new DailyWorkout entry
      const newDailyWorkout = new DailyWorkout({
        userId,
        date: today,
        workoutId: schedule.workoutId._id,
        scheduleId: schedule._id,
        targetSteps: schedule.targetSteps,
        completed: schedule.status === 'completed',
        completedSessionId: schedule.completedSessionId,
        activeSessionId: activeSession ? activeSession._id : undefined
      });
      
      const savedDailyWorkout = await newDailyWorkout.save();
      
      // Return with populated fields
      return await DailyWorkout.findById(savedDailyWorkout._id)
        .populate('workoutId')
        .populate('activeSessionId')
        .populate('completedSessionId');
    } catch (error) {
      console.error('Error fetching today\'s workout:', error);
      throw new Error('Failed to fetch today\'s workout');
    }
  }
  
  async updateDailyWorkoutSessionStatus(userId, sessionId, status) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Find daily workout for today
      const dailyWorkout = await DailyWorkout.findOne({ userId, date: today });
      
      if (!dailyWorkout) {
        return null;
      }
      
      // Update status based on the session status
      if (status === 'in_progress') {
        dailyWorkout.activeSessionId = sessionId;
      } else if (status === 'completed') {
        dailyWorkout.activeSessionId = null;
        dailyWorkout.completedSessionId = sessionId;
        dailyWorkout.completed = true;
      }
      
      dailyWorkout.updatedAt = new Date();
      return await dailyWorkout.save();
    } catch (error) {
      console.error('Error updating daily workout session status:', error);
    }
  }
}

module.exports = new WorkoutService();