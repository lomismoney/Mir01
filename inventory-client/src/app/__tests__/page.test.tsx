import { redirect } from 'next/navigation';
import RootPage from '../page';

// Mock the redirect function
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;

describe('RootPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should redirect to login page', () => {
    // Mock redirect to prevent actual navigation in tests
    mockRedirect.mockImplementation(() => {
      throw new Error('REDIRECT'); // This simulates the redirect behavior
    });

    expect(() => {
      RootPage();
    }).toThrow('REDIRECT');

    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });

  it('should call redirect with correct path', () => {
    // Mock redirect to prevent actual navigation in tests
    mockRedirect.mockImplementation(() => {
      throw new Error('REDIRECT');
    });

    expect(() => {
      RootPage();
    }).toThrow();

    expect(mockRedirect).toHaveBeenCalledTimes(1);
    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });
});