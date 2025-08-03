// Simple test to verify Jest is working
describe('Jest Setup', () => {
  test('should run basic test', () => {
    expect(1 + 1).toBe(2);
  });

  test('should test environment variables', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  test('should have JWT secret', () => {
    expect(process.env.JWT_SECRET).toBeDefined();
  });
});

describe('Utilities', () => {
  test('should test string operations', () => {
    const message = 'FitX Backend Testing';
    expect(message).toContain('Backend');
    expect(message.toLowerCase()).toBe('fitx backend testing');
  });

  test('should test array operations', () => {
    const exercises = ['push-up', 'squat', 'deadlift'];
    expect(exercises).toHaveLength(3);
    expect(exercises).toContain('squat');
  });
});