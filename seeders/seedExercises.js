// seeders/seedExercises.js
const { sequelize } = require('../config/database');
const Exercise = require('../models/Exercise');

const seedExercises = async () => {
  try {
    await sequelize.sync({ force: true }); // WARNING: This clears all data

    const exercises = [
      // Upper Body
      {
        name: "Push-ups",
        category: "upper-body",
        difficulty: "Beginner",
        duration: "30 seconds",
        muscles: ["Chest", "Triceps", "Shoulders"],
        videoId: "IODxDxX7oi4",
        description: "A fundamental bodyweight exercise for building upper body strength."
      },
      {
        name: "Pull-ups",
        category: "upper-body",
        difficulty: "Intermediate",
        duration: "45 seconds",
        muscles: ["Lats", "Biceps", "Rhomboids"],
        videoId: "eGo4IYlbE5g",
        description: "Great exercise for developing back strength and muscle definition."
      },
      {
        name: "Dips",
        category: "upper-body",
        difficulty: "Intermediate",
        duration: "30 seconds",
        muscles: ["Triceps", "Chest", "Shoulders"],
        videoId: "2z8JmcrW-As",
        description: "Effective bodyweight exercise targeting triceps and chest muscles."
      },
      // Lower Body
      {
        name: "Squats",
        category: "lower-body",
        difficulty: "Beginner",
        duration: "45 seconds",
        muscles: ["Quadriceps", "Glutes", "Hamstrings"],
        videoId: "aclHkVaku9U",
        description: "Foundation movement for building lower body strength and power."
      },
      {
        name: "Lunges",
        category: "lower-body",
        difficulty: "Beginner",
        duration: "60 seconds",
        muscles: ["Quadriceps", "Glutes", "Calves"],
        videoId: "QOVaHwm-Q6U",
        description: "Unilateral exercise that improves balance and leg strength."
      },
      {
        name: "Jump Squats",
        category: "lower-body",
        difficulty: "Intermediate",
        duration: "30 seconds",
        muscles: ["Quadriceps", "Glutes", "Calves"],
        videoId: "A-cFYWvaWeY",
        description: "Explosive plyometric exercise for power and conditioning."
      },
      // Core
      {
        name: "Plank",
        category: "core",
        difficulty: "Beginner",
        duration: "60 seconds",
        muscles: ["Core", "Shoulders", "Glutes"],
        videoId: "TvxNkmjdhMM",
        description: "Isometric exercise that builds core stability and strength."
      },
      {
        name: "Mountain Climbers",
        category: "core",
        difficulty: "Intermediate",
        duration: "45 seconds",
        muscles: ["Core", "Shoulders", "Hip Flexors"],
        videoId: "kLh-uczlPLg",
        description: "Dynamic exercise combining core strength with cardiovascular fitness."
      },
      {
        name: "Bicycle Crunches",
        category: "core",
        difficulty: "Beginner",
        duration: "45 seconds",
        muscles: ["Abs", "Obliques"],
        videoId: "9FGilxCbdz8",
        description: "Targeted abdominal exercise focusing on obliques and rectus abdominis."
      },
      // Cardio
      {
        name: "Burpees",
        category: "cardio",
        difficulty: "Advanced",
        duration: "30 seconds",
        muscles: ["Full Body"],
        videoId: "TU8QYVW0gDU",
        description: "High-intensity full-body exercise for cardiovascular conditioning."
      },
      {
        name: "Jumping Jacks",
        category: "cardio",
        difficulty: "Beginner",
        duration: "60 seconds",
        muscles: ["Legs", "Arms", "Core"],
        videoId: "UpH7rm0cYuA",
        description: "Classic cardio exercise that improves coordination and endurance."
      },
      {
        name: "High Knees",
        category: "cardio",
        difficulty: "Beginner",
        duration: "45 seconds",
        muscles: ["Hip Flexors", "Quads", "Calves"],
        videoId: "8opcQdC-V-U",
        description: "Dynamic warm-up exercise that activates the lower body."
      }
    ];

    await Exercise.bulkCreate(exercises);
    console.log('✅ Exercise data seeded!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to seed exercises:', err.message);
    process.exit(1);
  }
};

seedExercises();
