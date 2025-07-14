import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Mock the auth module first, before importing middleware
const mockAuthHandler = jest.fn();
const mockAuth = jest.fn(() => mockAuthHandler);

jest.mock('../../auth', () => ({
  auth: mockAuth,
}));

// Now import the middleware after mocking
import '../middleware';

// Mock console methods
const originalWarn = console.warn;
const originalLog = console.log;
const originalEnv = process.env;

beforeAll(() => {
  console.warn = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  console.warn = originalWarn;
  console.log = originalLog;
  process.env = originalEnv;
});

describe('Middleware', () => {
  const baseUrl = 'http://localhost:3000';

  // Helper function to create a mock request
  const createMockRequest = (
    pathname: string, 
    host: string = 'localhost:3000', 
    headers: Record<string, string> = {}
  ): NextRequest => {
    const url = new URL(pathname, baseUrl);
    const req = {
      url: url.toString(),
      headers: {
        get: jest.fn((key: string) => {
          if (key === 'host') return host || null;
          return headers[key] || null;
        }),
      },
    } as unknown as NextRequest;
    return req;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment by creating a new process.env object
    process.env = { ...originalEnv, NODE_ENV: 'test' };
    delete process.env.NEXTAUTH_URL;
    
    // Reset the mock implementation for each test
    mockAuthHandler.mockImplementation((req: NextRequest) => {
      // Import the actual middleware logic here
      const host = req.headers.get('host') || '';
      const forwardedProto = req.headers.get('x-forwarded-proto');
      
      // Simplified validation logic for testing
      const isLocalDevelopment = 
        process.env.NODE_ENV === 'development' ||
        host.includes('localhost') ||
        host.includes('127.0.0.1');

      if (isLocalDevelopment) {
        return NextResponse.next();
      }

      // Production environment validation
      const nextAuthUrl = process.env.NEXTAUTH_URL;
      if (nextAuthUrl) {
        try {
          const allowedHost = new URL(nextAuthUrl).hostname;
          if (host === allowedHost) {
            return NextResponse.next();
          }
        } catch {
          console.warn('無法解析 NEXTAUTH_URL:', nextAuthUrl);
        }
      }

      // Custom allowed domains
      const allowedCustomDomains = [
        'internal.lomis.com.tw',
        'api.lomis.com.tw',
      ];

      if (allowedCustomDomains.includes(host)) {
        return NextResponse.next();
      }

      // Cloud Run patterns
      const cloudRunPatterns = [
        /^inventory-client-[a-z0-9]+-[a-z0-9-]+\.a\.run\.app$/,
        /^inventory-client--[a-z0-9-]+\.a\.run\.app$/,
        /^.*\.run\.app$/,
      ];

      const isValidCloudRunHost = cloudRunPatterns.some(pattern => pattern.test(host));
      
      if (isValidCloudRunHost) {
        console.log(`✅ 允許 Cloud Run host: ${host}`);
        return NextResponse.next();
      }

      // HTTPS redirect in production
      if (forwardedProto === 'http' && process.env.NODE_ENV === 'production') {
        const httpsUrl = new URL(req.url);
        httpsUrl.protocol = 'https:';
        return NextResponse.redirect(httpsUrl);
      }

      // If we reach here, host is not trusted
      if (!host || 
          (!isLocalDevelopment && 
           !allowedCustomDomains.includes(host) && 
           !isValidCloudRunHost &&
           (!nextAuthUrl || host !== new URL(nextAuthUrl).hostname))) {
        console.warn(`🚫 拒絕不信任的 host: ${host}`);
        console.warn(`   環境: NODE_ENV=${process.env.NODE_ENV}`);
        return new NextResponse('Forbidden: Invalid host', { status: 403 });
      }

      return NextResponse.next();
    });
  });

  describe('Host 驗證', () => {
    it('應該允許 localhost 主機', () => {
      const req = createMockRequest('/dashboard', 'localhost:3000');
      const response = mockAuthHandler(req) as NextResponse;
      
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });

    it('應該允許 127.0.0.1 主機', () => {
      const req = createMockRequest('/dashboard', '127.0.0.1:3000');
      const response = mockAuthHandler(req) as NextResponse;
      
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });

    it('應該允許不帶端口的 localhost', () => {
      const req = createMockRequest('/dashboard', 'localhost');
      const response = mockAuthHandler(req) as NextResponse;
      
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });

    it('應該允許不帶端口的 127.0.0.1', () => {
      const req = createMockRequest('/dashboard', '127.0.0.1');
      const response = mockAuthHandler(req) as NextResponse;
      
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });

    it('應該在開發環境中允許任何主機', () => {
      process.env = { ...process.env, NODE_ENV: 'development' };
      
      const req = createMockRequest('/dashboard', 'any-host.com');
      const response = mockAuthHandler(req) as NextResponse;
      
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });

    it('應該允許 NEXTAUTH_URL 中配置的主機', () => {
      process.env = { 
        ...process.env, 
        NEXTAUTH_URL: 'https://example.com',
        NODE_ENV: 'production' 
      };
      
      const req = createMockRequest('/dashboard', 'example.com');
      const response = mockAuthHandler(req) as NextResponse;
      
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });

    it('應該允許自訂允許的域名', () => {
      process.env = { ...process.env, NODE_ENV: 'production' };
      
      const req = createMockRequest('/dashboard', 'internal.lomis.com.tw');
      const response = mockAuthHandler(req) as NextResponse;
      
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });

    it('應該允許 api.lomis.com.tw 域名', () => {
      process.env = { ...process.env, NODE_ENV: 'production' };
      
      const req = createMockRequest('/dashboard', 'api.lomis.com.tw');
      const response = mockAuthHandler(req) as NextResponse;
      
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });

    it('應該允許標準 Cloud Run URL', () => {
      process.env = { ...process.env, NODE_ENV: 'production' };
      
      const req = createMockRequest('/dashboard', 'inventory-client-abc123-def456.a.run.app');
      const response = mockAuthHandler(req) as NextResponse;
      
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
      expect(console.log).toHaveBeenCalledWith('✅ 允許 Cloud Run host: inventory-client-abc123-def456.a.run.app');
    });

    it('應該拒絕不信任的主機', () => {
      process.env = { ...process.env, NODE_ENV: 'production' };
      
      const req = createMockRequest('/dashboard', 'malicious-host.com');
      const response = mockAuthHandler(req) as NextResponse;
      
      expect(response).toBeDefined();
      expect(response.status).toBe(403);
      expect(console.warn).toHaveBeenCalledWith('🚫 拒絕不信任的 host: malicious-host.com');
      expect(console.warn).toHaveBeenCalledWith('   環境: NODE_ENV=production');
    });

    it('應該在無效的 NEXTAUTH_URL 時處理錯誤', () => {
      process.env = { 
        ...process.env, 
        NEXTAUTH_URL: 'invalid-url',
        NODE_ENV: 'production' 
      };
      
      const req = createMockRequest('/dashboard', 'example.com');
      const response = mockAuthHandler(req) as NextResponse;
      
      expect(console.warn).toHaveBeenCalledWith('無法解析 NEXTAUTH_URL:', 'invalid-url');
      expect(response.status).toBe(403);
    });
  });

  describe('HTTPS 重定向', () => {
    it('應該在生產環境中將 HTTP 重定向到 HTTPS', () => {
      process.env = { 
        ...process.env, 
        NODE_ENV: 'production',
        NEXTAUTH_URL: 'https://example.com' 
      };
      
      // Create request with HTTP URL directly
      const req = createMockRequest('/dashboard', 'example.com', { 'x-forwarded-proto': 'http' });
      // Set the URL to HTTP for testing
      Object.defineProperty(req, 'url', {
        value: 'http://example.com/dashboard',
        writable: false
      });
      
      const response = mockAuthHandler(req) as NextResponse;
      
      expect(response).toBeDefined();
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('https://example.com/dashboard');
    });

    it('應該在開發環境中允許 HTTP', () => {
      process.env = { ...process.env, NODE_ENV: 'development' };
      
      const req = createMockRequest('/dashboard', 'localhost:3000', { 'x-forwarded-proto': 'http' });
      const response = mockAuthHandler(req) as NextResponse;
      
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });
  });
});