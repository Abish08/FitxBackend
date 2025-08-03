// Mock utility functions that might exist in your app

// Password validation utility
const validatePassword = (password) => {
  if (!password) return { valid: false, message: 'Password is required' };
  if (password.length < 6) return { valid: false, message: 'Password must be at least 6 characters' };
  if (password.length > 100) return { valid: false, message: 'Password too long' };
  if (!/[A-Za-z]/.test(password)) return { valid: false, message: 'Password must contain letters' };
  if (!/[0-9]/.test(password)) return { valid: false, message: 'Password must contain numbers' };
  return { valid: true, message: 'Password is valid' };
};

// Email validation utility
const validateEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// BMI calculation utility
const calculateBMI = (weight, height) => {
  if (!weight || !height || weight <= 0 || height <= 0) {
    return null;
  }
  
  // Convert height from cm to meters
  const heightInMeters = height / 100;
  return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
};

// BMI category utility
const getBMICategory = (bmi) => {
  if (!bmi || bmi <= 0) return 'Unknown';
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

// Calories burned estimation
const estimateCaloriesBurned = (exerciseType, duration, weight) => {
  if (!exerciseType || !duration || !weight || duration <= 0 || weight <= 0) {
    return 0;
  }
  
  // MET values for different exercise types
  const metValues = {
    'running': 8.0,
    'cycling': 6.0,
    'swimming': 7.0,
    'walking': 3.5,
    'strength': 4.0,
    'yoga': 2.5,
    'dancing': 5.0
  };
  
  const met = metValues[exerciseType.toLowerCase()] || 4.0;
  
  // Calories = MET × weight(kg) × duration(hours)
  const durationInHours = duration / 60;
  return Math.round(met * weight * durationInHours);
};

// Progress trend calculation
const calculateProgressTrend = (data, field) => {
  if (!data || data.length < 2 || !field) return null;
  
  const validData = data
    .filter(item => item[field] !== null && item[field] !== undefined)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
    
  if (validData.length < 2) return null;
  
  const first = validData[0][field];
  const last = validData[validData.length - 1][field];
  
  return {
    change: last - first,
    percentChange: ((last - first) / first * 100).toFixed(2),
    trend: last > first ? 'increasing' : last < first ? 'decreasing' : 'stable'
  };
};

// Date utilities
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

const isValidDate = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

// Workout duration formatting
const formatDuration = (minutes) => {
  if (!minutes || minutes <= 0) return '0 min';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
};

// Data sanitization
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};

describe('Utility Functions', () => {
  describe('validatePassword', () => {
    test('should validate strong password', () => {
      const result = validatePassword('password123');
      expect(result.valid).toBe(true);
      expect(result.message).toBe('Password is valid');
    });

    test('should reject empty password', () => {
      const result = validatePassword('');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('required');
    });

    test('should reject short password', () => {
      const result = validatePassword('123');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('at least 6 characters');
    });

    test('should reject password without letters', () => {
      const result = validatePassword('123456');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('contain letters');
    });

    test('should reject password without numbers', () => {
      const result = validatePassword('password');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('contain numbers');
    });

    test('should reject extremely long password', () => {
      const longPassword = 'a'.repeat(101) + '1';
      const result = validatePassword(longPassword);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('too long');
    });
  });

  describe('validateEmail', () => {
    test('should validate correct email format', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.org')).toBe(true);
    });

    test('should reject invalid email formats', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test..test@example.com')).toBe(false);
    });

    test('should handle null and undefined', () => {
      expect(validateEmail(null)).toBe(false);
      expect(validateEmail(undefined)).toBe(false);
    });
  });

  describe('calculateBMI', () => {
    test('should calculate BMI correctly', () => {
      expect(calculateBMI(70, 175)).toBe(22.9); // 70kg, 175cm
      expect(calculateBMI(80, 180)).toBe(24.7); // 80kg, 180cm
      expect(calculateBMI(90, 190)).toBe(24.9); // 90kg, 190cm
    });

    test('should handle invalid inputs', () => {
      expect(calculateBMI(0, 175)).toBeNull();
      expect(calculateBMI(70, 0)).toBeNull();
      expect(calculateBMI(-70, 175)).toBeNull();
      expect(calculateBMI(70, -175)).toBeNull();
      expect(calculateBMI(null, 175)).toBeNull();
      expect(calculateBMI(70, null)).toBeNull();
    });

    test('should round to one decimal place', () => {
      expect(calculateBMI(70.5, 175.5)).toBe(22.9);
    });
  });

  describe('getBMICategory', () => {
    test('should categorize BMI correctly', () => {
      expect(getBMICategory(17)).toBe('Underweight');
      expect(getBMICategory(22)).toBe('Normal weight');
      expect(getBMICategory(27)).toBe('Overweight');
      expect(getBMICategory(32)).toBe('Obese');
    });

    test('should handle edge cases', () => {
      expect(getBMICategory(18.5)).toBe('Normal weight');
      expect(getBMICategory(24.9)).toBe('Normal weight');
      expect(getBMICategory(29.9)).toBe('Overweight');
    });

    test('should handle invalid inputs', () => {
      expect(getBMICategory(0)).toBe('Unknown');
      expect(getBMICategory(-5)).toBe('Unknown');
      expect(getBMICategory(null)).toBe('Unknown');
      expect(getBMICategory(undefined)).toBe('Unknown');
    });
  });

  describe('estimateCaloriesBurned', () => {
    test('should calculate calories for different exercises', () => {
      expect(estimateCaloriesBurned('running', 30, 70)).toBe(280); // 8.0 MET
      expect(estimateCaloriesBurned('walking', 60, 70)).toBe(245); // 3.5 MET
      expect(estimateCaloriesBurned('strength', 45, 80)).toBe(240); // 4.0 MET
    });

    test('should handle unknown exercise types', () => {
      expect(estimateCaloriesBurned('unknown', 30, 70)).toBe(140); // Default 4.0 MET
    });

    test('should be case insensitive', () => {
      expect(estimateCaloriesBurned('RUNNING', 30, 70)).toBe(280);
      expect(estimateCaloriesBurned('Running', 30, 70)).toBe(280);
    });

    test('should handle invalid inputs', () => {
      expect(estimateCaloriesBurned('', 30, 70)).toBe(0);
      expect(estimateCaloriesBurned('running', 0, 70)).toBe(0);
      expect(estimateCaloriesBurned('running', 30, 0)).toBe(0);
      expect(estimateCaloriesBurned('running', -30, 70)).toBe(0);
      expect(estimateCaloriesBurned(null, 30, 70)).toBe(0);
    });
  });

  describe('calculateProgressTrend', () => {
    test('should calculate increasing trend', () => {
      const data = [
        { date: '2024-01-01', weight: 70 },
        { date: '2024-01-08', weight: 72 },
        { date: '2024-01-15', weight: 73 }
      ];

      const trend = calculateProgressTrend(data, 'weight');
      expect(trend.change).toBe(3);
      expect(trend.percentChange).toBe('4.29');
      expect(trend.trend).toBe('increasing');
    });

    test('should calculate decreasing trend', () => {
      const data = [
        { date: '2024-01-01', weight: 75 },
        { date: '2024-01-08', weight: 73 },
        { date: '2024-01-15', weight: 70 }
      ];

      const trend = calculateProgressTrend(data, 'weight');
      expect(trend.change).toBe(-5);
      expect(trend.percentChange).toBe('-6.67');
      expect(trend.trend).toBe('decreasing');
    });

    test('should handle stable trend', () => {
      const data = [
        { date: '2024-01-01', weight: 70 },
        { date: '2024-01-08', weight: 70 }
      ];

      const trend = calculateProgressTrend(data, 'weight');
      expect(trend.change).toBe(0);
      expect(trend.percentChange).toBe('0.00');
      expect(trend.trend).toBe('stable');
    });

    test('should handle insufficient data', () => {
      expect(calculateProgressTrend([], 'weight')).toBeNull();
      expect(calculateProgressTrend([{ weight: 70 }], 'weight')).toBeNull();
      expect(calculateProgressTrend(null, 'weight')).toBeNull();
    });

    test('should filter out null values', () => {
      const data = [
        { date: '2024-01-01', weight: 70 },
        { date: '2024-01-08', weight: null },
        { date: '2024-01-15', weight: 75 }
      ];

      const trend = calculateProgressTrend(data, 'weight');
      expect(trend.change).toBe(5);
      expect(trend.trend).toBe('increasing');
    });
  });

  describe('formatDate', () => {
    test('should format dates correctly', () => {
      expect(formatDate('2024-01-15T10:30:00Z')).toBe('2024-01-15');
      expect(formatDate(new Date('2024-01-15'))).toBe('2024-01-15');
    });

    test('should handle invalid dates', () => {
      expect(formatDate('')).toBe('');
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
    });
  });

  describe('isValidDate', () => {
    test('should validate correct date strings', () => {
      expect(isValidDate('2024-01-15')).toBe(true);
      expect(isValidDate('2024-12-31')).toBe(true);
      expect(isValidDate('2024-01-15T10:30:00Z')).toBe(true);
    });

    test('should reject invalid date strings', () => {
      expect(isValidDate('invalid-date')).toBe(false);
      expect(isValidDate('2024-13-01')).toBe(false);
      expect(isValidDate('2024-01-32')).toBe(false);
      expect(isValidDate('')).toBe(false);
      expect(isValidDate(null)).toBe(false);
    });
  });

  describe('formatDuration', () => {
    test('should format minutes only', () => {
      expect(formatDuration(30)).toBe('30 min');
      expect(formatDuration(45)).toBe('45 min');
      expect(formatDuration(59)).toBe('59 min');
    });

    test('should format hours only', () => {
      expect(formatDuration(60)).toBe('1h');
      expect(formatDuration(120)).toBe('2h');
      expect(formatDuration(180)).toBe('3h');
    });

    test('should format hours and minutes', () => {
      expect(formatDuration(75)).toBe('1h 15min');
      expect(formatDuration(150)).toBe('2h 30min');
      expect(formatDuration(125)).toBe('2h 5min');
    });

    test('should handle invalid inputs', () => {
      expect(formatDuration(0)).toBe('0 min');
      expect(formatDuration(-30)).toBe('0 min');
      expect(formatDuration(null)).toBe('0 min');
      expect(formatDuration(undefined)).toBe('0 min');
    });
  });

  describe('sanitizeInput', () => {
    test('should trim whitespace', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello');
      expect(sanitizeInput('\t test \n')).toBe('test');
    });

    test('should remove dangerous characters', () => {
      expect(sanitizeInput('hello<script>alert("xss")</script>')).toBe('helloscriptalert("xss")/script');
      expect(sanitizeInput('test>value<')).toBe('testvalue');
    });

    test('should handle non-string inputs', () => {
      expect(sanitizeInput(123)).toBe(123);
      expect(sanitizeInput(null)).toBe(null);
      expect(sanitizeInput(undefined)).toBe(undefined);
      expect(sanitizeInput(true)).toBe(true);
    });

    test('should preserve normal text', () => {
      expect(sanitizeInput('normal text')).toBe('normal text');
      expect(sanitizeInput('email@example.com')).toBe('email@example.com');
    });
  });
});