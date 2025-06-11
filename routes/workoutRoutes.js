const express = require('express');
const workoutController = require('../controllers/workoutController');
const { authmiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

// Available workouts based on user's plan
router.get('/available', authmiddleware, workoutController.getAvailableWorkouts);

// Today's workout - must be before the /:id route
router.get('/today', authmiddleware, workoutController.getTodaysWorkout);

// Daily workouts route
router.get('/daily', authmiddleware, workoutController.getDailyWorkouts);

// Individual workout by ID - must be after specific routes
router.get('/:id', authmiddleware, workoutController.getWorkoutById);

// Workout session routes
router.get('/sessions', authmiddleware, workoutController.getWorkoutSessions);
router.post('/sessions/start', authmiddleware, workoutController.startWorkoutSession);
router.put('/sessions/:id', authmiddleware, workoutController.updateWorkoutSession);
router.put('/sessions/:id/complete', authmiddleware, workoutController.completeWorkoutSession);

// Workout schedule routes
router.get('/schedule', authmiddleware, workoutController.getWorkoutSchedule);

// Personalized plan routes
router.post('/plan/generate', authmiddleware, workoutController.generatePersonalizedPlan);
router.get('/plan/current', authmiddleware, workoutController.getCurrentPlan);

module.exports = router;