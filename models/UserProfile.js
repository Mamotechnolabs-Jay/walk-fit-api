const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'non-binary'],
    default: null
  },
  fitnessGoals: [{
    type: String,
    enum: ['relieve_stress', 'improve_heart_health', 'get_outdoors', 'lose_weight', 'get_firm_and_toned']
  }],
  bodyType: {
    type: String,
    enum: ['regular', 'flabby', 'extra'],
    default: null
  },
  targetBodyType: {
    type: String,
    enum: ['fit', 'athletic', 'curvy'],
    default: null
  },
  bodyPartsToToneUp: [{
    type: String,
    enum: ['belly', 'buttocks', 'hips', 'thighs']
  }],
  weightHappiness: {
    type: String,
    enum: ['less_than_year_ago', '1_to_2_years_ago', 'more_than_3_years_ago', 'happy_with_weight', 'never_thought_about_this'],
    default: null
  },
  displayName: {
    type: String,
    default: null
  },
  fitnessLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: null
  },
  energyBetweenMeals: {
    type: String,
    enum: ['sleepy_when_hungry', 'tired_after_eating', 'feel_good'],
    default: null
  },
  dailyWalkingTime: {
    type: String,
    enum: ['less_than_20_mins', '20_60_mins', '1_2_hours', 'more_than_2_hours'],
    default: null
  },
  stairClimbingCapacity: {
    type: String,
    enum: ['somewhat_out_of_breath', 'ok_after_one_flight', 'several_flights_easily'],
    default: null
  },
  focusAreas: [{
    type: String,
    enum: ['weight_loss', 'fat_burn', 'stress_reduction', 'better_shape', 
           'back_pain_reduction', 'improve_physique', 'heart_health', 
           'boost_energy', 'better_sleep', 'endurance', 'better_relaxation', 
           'mobility', 'recovery', 'agility']
  }],
  weightGainFactors: [{
    type: String,
    enum: ['marriage_or_relationship', 'busy_work_or_family_life', 'stress_or_mental_health', 'medicine_or_hormonal_disorder']
  }],
  dietaryVices: [{
    type: String,
    enum: ['sweet_tooth', 'too_much_soda', 'midnight_snacks', 'alcohol']
  }],
  stepGoal: {
    type: Number,
    default: 10000
  },
  waterConsumption: {
    type: String,
    enum: ['only_tea_and_coffee', 'fewer_than_2_glasses', '2_6_glasses', '7_10_glasses'],
    default: null
  },
  sleepDuration: {
    type: String,
    enum: ['fewer_than_5_hours', 'between_5_and_6_hours', 'between_7_and_8_hours', 'over_8_hours'],
    default: null
  },
  age: {
    type: Number,
    min: 13, 
    max: 120
  },
  currentWeight: {
    type: Number,
    min: 20
  },
  targetWeight: {
    type: Number,
    min: 20
  },
  height: {
    type: Number, // storing in cm for consistency
    min: 100,
    max: 250
  },
  weightUnit: {
    type: String,
    enum: ['kg', 'lb'],
    default: 'kg'
  },
  heightUnit: {
    type: String,
    enum: ['cm', 'in'],
    default: 'cm'
  },
  bmi: {
    type: Number,
    min: 10,
    max: 50
  },
  bmiCategory: {
    type: String,
    enum: ['underweight', 'normal', 'overweight', 'obese'],
    default: null
  },
  lifestyle: {
    type: String,
    enum: ['sedentary', 'somewhat_active', 'active', 'very_active'],
    default: null
  },
  exerciseFrequency: {
    type: String,
    enum: ['no_workouts', 'few_workouts', 'regular_workouts', 'daily_workouts'],
    default: null
  },
  activityLevel: {
    type: String,
    enum: ['inactive', 'somewhat_active', 'active', 'very_active'],
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('UserProfile', userProfileSchema);