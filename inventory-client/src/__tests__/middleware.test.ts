
import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import middleware, { config } from '../middleware'; // Import config as well
import { auth } from '../../auth';

// Mock next-auth
jest.mock('../../auth', () => ({
  auth: jest.fn((handler) => {
    // This mock will now return the handler, making the middleware export valid
    return handler;
  }),
}));

// Mock next/server
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      next: jest.fn(() => new Response('next')),
      redirect: jest.fn((url) => new Response(`redirect to ${url.pathname}`)),
    },
  };
});

const mockedAuth = auth as jest.Mock;
const mockedNextResponse = NextResponse as jest.Mocked<typeof NextResponse>;

describe('Middleware', () => {
  const baseUrl = 'http://localhost:3000';

  // Helper function to create a mock request
  const createMockRequest = (pathname: string, isLoggedIn: boolean) => {
    const url = new URL(pathname, baseUrl);
    const req = new NextRequest(url) as any; // Use 'any' to add custom properties
    req.auth = isLoggedIn ? { user: { id: 'test-user' } } : null;
    return req;
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('Static and API routes', () => {
    const staticPaths = [
      '/_next/static/css/styles.css',
      '/api/health',
      '/favicon.ico',
      '/image.png',
      '/robots.txt',
      '/manifest.json',
    ];

    it.each(staticPaths)('should bypass middleware for %s', (pathname) => {
      const req = createMockRequest(pathname, false);
      middleware(req);
      expect(mockedNextResponse.next).toHaveBeenCalledTimes(1);
      expect(mockedNextResponse.redirect).not.toHaveBeenCalled();
    });
  });

  describe('Login page: /login', () => {
    it('should redirect to /dashboard if user is logged in', () => {
      const req = createMockRequest('/login', true);
      middleware(req);
      expect(mockedNextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = mockedNextResponse.redirect.mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe('/dashboard');
    });

    it('should allow access if user is not logged in', () => {
      const req = createMockRequest('/login', false);
      middleware(req);
      expect(mockedNextResponse.next).toHaveBeenCalledTimes(1);
      expect(mockedNextResponse.redirect).not.toHaveBeenCalled();
    });
  });

  describe('Root path: /', () => {
    it('should redirect to /dashboard if user is logged in', () => {
      const req = createMockRequest('/', true);
      middleware(req);
      expect(mockedNextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = mockedNextResponse.redirect.mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe('/dashboard');
    });

    it('should redirect to /login if user is not logged in', () => {
      const req = createMockRequest('/', false);
      middleware(req);
      expect(mockedNextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = mockedNextResponse.redirect.mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe('/login');
    });
  });

  describe('Protected routes', () => {
    const protectedRoutes = ['/dashboard', '/products', '/settings'];

    it.each(protectedRoutes)('should redirect to /login for %s if user is not logged in', (pathname) => {
      const req = createMockRequest(pathname, false);
      middleware(req);
      expect(mockedNextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = mockedNextResponse.redirect.mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe('/login');
    });

    it.each(protectedRoutes)('should allow access to %s if user is logged in', (pathname) => {
      const req = createMockRequest(pathname, true);
      middleware(req);
      expect(mockedNextResponse.next).toHaveBeenCalledTimes(1);
      expect(mockedNextResponse.redirect).not.toHaveBeenCalled();
    });
  });
});
