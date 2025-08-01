// config/database.js
import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'fitx_fitness',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'tyke',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: (msg) => console.log(`🗄️  ${msg}`),
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// User Model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: true  // ✅ Fixed: Allow NULL
  },
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: true  // ✅ Fixed: Allow NULL
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Exercise Model
const Exercise = sequelize.define('Exercise', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM(
      'upper-body', 'lower-body', 'core', 'cardio',
      'flexibility', 'strength', 'hiit'
    ),
    allowNull: false
  },
  difficulty: {
    type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced'),
    allowNull: false
  },
  duration: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  muscles: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  videoId: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  instructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  equipment: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'None'
  },
  caloriesPerMinute: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 5
  }
}, {
  tableName: 'exercises',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Progress Model
const Progress = sequelize.define('Progress', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  weight: {
    type: DataTypes.DECIMAL(5,2),
    allowNull: true
  },
  goalWeight: {
    type: DataTypes.DECIMAL(5,2),
    allowNull: true
  },
  chest: {
    type: DataTypes.DECIMAL(4,1),
    allowNull: true
  },
  waist: {
    type: DataTypes.DECIMAL(4,1),
    allowNull: true
  },
  arms: {
    type: DataTypes.DECIMAL(4,1),
    allowNull: true
  },
  thighs: {
    type: DataTypes.DECIMAL(4,1),
    allowNull: true
  },
  bodyFat: {
    type: DataTypes.DECIMAL(4,2),
    allowNull: true
  },
  muscleMass: {
    type: DataTypes.DECIMAL(5,2),
    allowNull: true
  },
  waterIntake: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  waterGoal: {
    type: DataTypes.INTEGER,
    defaultValue: 8
  },
  sleepHours: {
    type: DataTypes.DECIMAL(3,1),
    allowNull: true
  },
  sleepGoal: {
    type: DataTypes.DECIMAL(3,1),
    defaultValue: 8.0
  },
  dailySteps: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  stepsGoal: {
    type: DataTypes.INTEGER,
    defaultValue: 10000
  },
  workoutType: {
    type: DataTypes.ENUM('strength', 'cardio', 'hiit', 'yoga', 'other'),
    allowNull: true
  },
  workoutDuration: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  caloriesBurned: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  feeling: {
    type: DataTypes.ENUM('tired', 'okay', 'good', 'strong', 'amazing'),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  workoutStreak: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  waterStreak: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  recordDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'progress',
  timestamps: true,           // ✅ Timestamps enabled
  createdAt: 'created_at',    // ✅ Map to snake_case
  updatedAt: 'updated_at'     // ✅ Map to snake_case
});

// Associations
User.hasMany(Progress, { foreignKey: 'userId', as: 'progressEntries' });
Progress.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ✅ Named exports (ESM style)
export { sequelize, User, Exercise, Progress };