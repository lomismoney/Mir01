import React from 'react';
import { redirect } from 'next/navigation';
import InventoryPage from '../page';

// Mock the redirect function
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;

describe('InventoryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should redirect to inventory management page', () => {
    // Mock redirect to prevent actual navigation in tests
    mockRedirect.mockImplementation(() => {
      throw new Error('REDIRECT'); // This simulates the redirect behavior
    });

    expect(() => {
      InventoryPage();
    }).toThrow('REDIRECT');

    expect(mockRedirect).toHaveBeenCalledWith('/inventory/management');
  });

  it('should call redirect with correct path', () => {
    // Mock redirect to prevent actual navigation in tests
    mockRedirect.mockImplementation(() => {
      throw new Error('REDIRECT');
    });

    expect(() => {
      InventoryPage();
    }).toThrow();

    expect(mockRedirect).toHaveBeenCalledTimes(1);
    expect(mockRedirect).toHaveBeenCalledWith('/inventory/management');
  });
});