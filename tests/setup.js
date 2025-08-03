require('dotenv').config({ path: '.env.test' });

// Test environment setup
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';
process.env.PORT = process.env.PORT || '5001';

// Test database configuration
process.env.DB_NAME = process.env.DB_NAME || 'fitx_test';
process.env.DB_USER = process.env.DB_USER || 'postgres';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || '';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';

// Global test utilities
global.testUtils = {
  createTestUser: () => ({
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    firstName: 'Test',
    lastName: 'User'
  }),
  
  createTestExercise: () => ({
    name: `Test Exercise ${Date.now()}`,
    category: 'strength',
    muscleGroups: ['chest', 'triceps'],
    instructions: 'Test instructions for the exercise',
    difficulty: 'beginner',
    equipment: 'bodyweight'
  })
};

// Mock console methods to reduce test noise
const originalConsole = { ...console };
global.console = {
  ...console,
  log: process.env.TEST_VERBOSE ? console.log : jest.fn(),
  debug: process.env.TEST_VERBOSE ? console.debug : jest.fn(),
  info: process.env.TEST_VERBOSE ? console.info : jest.fn(),
  warn: process.env.TEST_VERBOSE ? console.warn : jest.fn(),
  error: originalConsole.error
};

beforeAll(async () => {
  console.error('Setting up test environment...');
});

afterAll(async () => {
  console.error('Cleaning up test environment...');
});

beforeEach(() => {
  // Reset before each test
});

afterEach(() => {
  jest.clearAllMocks();
});