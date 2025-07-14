import { GET, POST } from '../route';

// Mock the handlers from auth
jest.mock('../../../../../../auth', () => ({
  handlers: {
    GET: jest.fn(),
    POST: jest.fn(),
  },
}));

describe('Auth Route Handler', () => {
  it('should export GET handler', () => {
    expect(GET).toBeDefined();
    expect(typeof GET).toBe('function');
  });

  it('should export POST handler', () => {
    expect(POST).toBeDefined();
    expect(typeof POST).toBe('function');
  });

  it('should be the same handlers from auth module', async () => {
    const { handlers } = await import('../../../../../../auth');
    expect(GET).toBe(handlers.GET);
    expect(POST).toBe(handlers.POST);
  });
});