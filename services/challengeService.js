const Challenge = require('../models/Challenge');
const UserChallengeEnrollment = require('../models/UserChallengeEnrollement');
const UserProfile = require('../models/UserProfile');

class ChallengeService {
  // Get all available challenges
  async getAllChallenges() {
    return Challenge.find({ isActive: true });
  }

  // Get user's active/completed challenges
  async getUserChallenges(userId, status = 'active') {
    return UserChallengeEnrollment.find({ userId, status })
      .populate('challenge');
  }

  // Enroll user in a challenge
  async enrollUserInChallenge(userId, challengeId) {
    const challenge = await Challenge.findOne({ challengeId });
    if (!challenge) throw new Error('Challenge not found');

    // Calculate start and end date
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + (challenge.duration - 1) * 24 * 60 * 60 * 1000);

    // Prevent duplicate enrollment
    const existing = await UserChallengeEnrollment.findOne({ userId, challenge: challenge._id, status: 'active' });
    if (existing) throw new Error('Already enrolled in this challenge');

    // Create daily progress array
    const dailyProgress = Array.from({ length: challenge.duration }, (_, i) => ({
      day: i + 1,
      date: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000),
      targetValue: challenge.targetValue,
      achievedValue: 0,
      isCompleted: false,
      completedAt: null
    }));

    const enrollment = await UserChallengeEnrollment.create({
      userId,
      challenge: challenge._id,
      startDate,
      endDate,
      dailyProgress
    });
    return enrollment;
  }

  // Update daily progress for a challenge
  async updateDailyProgress(userId, challengeId, day, achievedValue) {
    const enrollment = await UserChallengeEnrollment.findOne({ userId, challenge: challengeId, status: 'active' });
    if (!enrollment) throw new Error('Enrollment not found');
    const progress = enrollment.dailyProgress.find(p => p.day === day);
    if (!progress) throw new Error('Day not found');
    progress.achievedValue = achievedValue;
    if (achievedValue >= progress.targetValue) {
      progress.isCompleted = true;
      progress.completedAt = new Date();
    }
    // Update total progress and completion percentage
    enrollment.totalProgress = enrollment.dailyProgress.reduce((sum, p) => sum + (p.achievedValue || 0), 0);
    enrollment.completionPercentage = Math.round(
      (enrollment.dailyProgress.filter(p => p.isCompleted).length / enrollment.dailyProgress.length) * 100
    );
    // If all days completed, mark as completed
    if (enrollment.dailyProgress.every(p => p.isCompleted)) {
      enrollment.status = 'completed';
      enrollment.completedAt = new Date();
    }
    await enrollment.save();
    return enrollment;
  }

  // Mark challenge as failed/abandoned
  async markChallengeStatus(userId, challengeId, status) {
    const enrollment = await UserChallengeEnrollment.findOne({ userId, challenge: challengeId });
    if (!enrollment) throw new Error('Enrollment not found');
    enrollment.status = status;
    if (status === 'failed' || status === 'abandoned') {
      enrollment.completedAt = new Date();
    }
    await enrollment.save();
    return enrollment;
  }

  // Auto-assign challenges based on user profile
  async autoAssignChallengesForUser(userId) {
    const userProfile = await UserProfile.findOne({ userId });
    if (!userProfile) throw new Error('User profile not found');
    // Example logic: assign a 3-day, 7-day, and 28-day challenge
    const durations = [3, 7, 28];
    const challenges = await Challenge.find({ duration: { $in: durations }, isActive: true });
    const results = [];
    for (const challenge of challenges) {
      try {
        const enrollment = await this.enrollUserInChallenge(userId, challenge.challengeId);
        results.push(enrollment);
      } catch (e) {
        // Already enrolled or error, skip
      }
    }
    return results;
  }

  // Generate and assign walking challenges for a user (static version)
  async generateAndAssignWalkingChallenges(userId) {
    // Define static challenge templates (daily, weekly, monthly)
    const challengeTemplates = [
      {
        challengeId: 'workout_streak-7',
        name: '7-Day Walking Workout Streak',
        description: 'Do a walking workout every day for 7 days.',
        type: 'workout_streak',
        duration: 7,
        durationLabel: '7 day',
        difficulty: 'medium',
        targetValue: 1, // 1 workout per day
        targetLabel: '1 walking workout daily',
        reward: 'Silver Medal',
        iconType: 'medal',
        backgroundColor: '#4CAF50',
      },
      {
        challengeId: 'daily_steps-28',
        name: '28-Day Step Challenge',
        description: 'Walk at least 10,000 steps daily for 28 days.',
        type: 'daily_steps',
        duration: 28,
        durationLabel: '28 day',
        difficulty: 'hard',
        targetValue: 10000,
        targetLabel: '10,000 steps daily',
        reward: 'Gold Medal',
        iconType: 'trophy',
        backgroundColor: '#FFD700',
      },
      {
        challengeId: 'unique_workouts-7',
        name: 'Variety Walker',
        description: 'Complete 5 different walking exercises this week.',
        type: 'unique_workouts',
        duration: 7,
        durationLabel: '7 day',
        difficulty: 'medium',
        targetValue: 5,
        targetLabel: '5 unique walking workouts',
        reward: 'Bronze Medal',
        iconType: 'star',
        backgroundColor: '#FF6B47',
      },
      {
        challengeId: 'beginner-3',
        name: 'Beginner Walker',
        description: 'Walk for at least 15 minutes each day for 3 days.',
        type: 'daily_duration',
        duration: 3,
        durationLabel: '3 day',
        difficulty: 'easy',
        targetValue: 15, // 15 minutes per day
        targetLabel: '15 minutes daily',
        reward: 'Starter Badge',
        iconType: 'badge',
        backgroundColor: '#2196F3',
      },
      {
        challengeId: 'distance-14',
        name: 'Distance Challenger',
        description: 'Walk a total of 30km over 14 days.',
        type: 'total_distance',
        duration: 14,
        durationLabel: '14 day',
        difficulty: 'medium',
        targetValue: 30, // 30km total
        targetLabel: '30km total distance',
        reward: 'Distance Master Badge',
        iconType: 'badge',
        backgroundColor: '#9C27B0',
      }
    ];

    // For each template, create a challenge (if not exists) and enroll user
    const results = [];
    for (const template of challengeTemplates) {
      // Check if challenge exists
      let challenge = await Challenge.findOne({ challengeId: template.challengeId });
      if (!challenge) {
        challenge = await Challenge.create({
          ...template,
          imageUrl: '',
          isActive: true
        });
      }
      
      // Enroll user if not already enrolled
      const existing = await UserChallengeEnrollment.findOne({ 
        userId, 
        challenge: challenge._id, 
        status: 'active' 
      });
      
      if (!existing) {
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + (challenge.duration - 1) * 24 * 60 * 60 * 1000);
        
        const dailyProgress = Array.from({ length: challenge.duration }, (_, i) => ({
          day: i + 1,
          date: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000),
          targetValue: challenge.targetValue,
          achievedValue: 0,
          isCompleted: false,
          completedAt: null
        }));
        
        const enrollment = await UserChallengeEnrollment.create({
          userId,
          challenge: challenge._id,
          startDate,
          endDate,
          dailyProgress
        });
        
        results.push(enrollment);
      } else {
        results.push(existing);
      }
    }
    
    return results;
  }
}

module.exports = new ChallengeService();