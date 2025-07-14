import { QUERY_KEYS, INSTALLATION_QUERY_KEYS } from '../queryKeys';

describe('queryKeys', () => {
  describe('QUERY_KEYS', () => {
    it('should have correct PRODUCTS key', () => {
      expect(QUERY_KEYS.PRODUCTS).toEqual(['products']);
    });

    it('should generate correct PRODUCT key with id', () => {
      expect(QUERY_KEYS.PRODUCT(1)).toEqual(['products', 1]);
      expect(QUERY_KEYS.PRODUCT(999)).toEqual(['products', 999]);
    });

    it('should have correct PRODUCT_VARIANTS key', () => {
      expect(QUERY_KEYS.PRODUCT_VARIANTS).toEqual(['product-variants']);
    });

    it('should generate correct PRODUCT_VARIANT key with id', () => {
      expect(QUERY_KEYS.PRODUCT_VARIANT(1)).toEqual(['product-variants', 1]);
      expect(QUERY_KEYS.PRODUCT_VARIANT(42)).toEqual(['product-variants', 42]);
    });

    it('should have correct USERS key', () => {
      expect(QUERY_KEYS.USERS).toEqual(['users']);
    });

    it('should generate correct USER key with id', () => {
      expect(QUERY_KEYS.USER(1)).toEqual(['users', 1]);
      expect(QUERY_KEYS.USER(123)).toEqual(['users', 123]);
    });

    it('should have correct CUSTOMERS key', () => {
      expect(QUERY_KEYS.CUSTOMERS).toEqual(['customers']);
    });

    it('should generate correct CUSTOMER key with id', () => {
      expect(QUERY_KEYS.CUSTOMER(1)).toEqual(['customers', 1]);
      expect(QUERY_KEYS.CUSTOMER(456)).toEqual(['customers', 456]);
    });

    it('should have correct CATEGORIES key', () => {
      expect(QUERY_KEYS.CATEGORIES).toEqual(['categories']);
    });

    it('should generate correct CATEGORY key with id', () => {
      expect(QUERY_KEYS.CATEGORY(1)).toEqual(['categories', 1]);
      expect(QUERY_KEYS.CATEGORY(789)).toEqual(['categories', 789]);
    });

    it('should have correct ATTRIBUTES key', () => {
      expect(QUERY_KEYS.ATTRIBUTES).toEqual(['attributes']);
    });

    it('should have correct ORDERS key', () => {
      expect(QUERY_KEYS.ORDERS).toEqual(['orders']);
    });

    it('should generate correct ORDER key with id', () => {
      expect(QUERY_KEYS.ORDER(1)).toEqual(['orders', 1]);
      expect(QUERY_KEYS.ORDER(101112)).toEqual(['orders', 101112]);
    });

    it('should return arrays for all keys', () => {
      expect(Array.isArray(QUERY_KEYS.PRODUCTS)).toBe(true);
      expect(Array.isArray(QUERY_KEYS.USERS)).toBe(true);
      expect(Array.isArray(QUERY_KEYS.CUSTOMERS)).toBe(true);
      expect(Array.isArray(QUERY_KEYS.CATEGORIES)).toBe(true);
      expect(Array.isArray(QUERY_KEYS.ATTRIBUTES)).toBe(true);
      expect(Array.isArray(QUERY_KEYS.ORDERS)).toBe(true);
    });
  });

  describe('INSTALLATION_QUERY_KEYS', () => {
    it('should have correct ALL key', () => {
      expect(INSTALLATION_QUERY_KEYS.ALL).toEqual(['installations']);
    });

    it('should generate correct DETAIL key with id', () => {
      expect(INSTALLATION_QUERY_KEYS.DETAIL(1)).toEqual(['installations', 1]);
      expect(INSTALLATION_QUERY_KEYS.DETAIL(555)).toEqual(['installations', 555]);
    });

    it('should have correct SCHEDULE key function', () => {
      expect(INSTALLATION_QUERY_KEYS.SCHEDULE()).toEqual(['installations', 'schedule', undefined]);
      expect(INSTALLATION_QUERY_KEYS.SCHEDULE({ start_date: '2024-01-01' })).toEqual(['installations', 'schedule', { start_date: '2024-01-01' }]);
    });

    it('should return arrays for all keys', () => {
      expect(Array.isArray(INSTALLATION_QUERY_KEYS.ALL)).toBe(true);
      expect(Array.isArray(INSTALLATION_QUERY_KEYS.SCHEDULE())).toBe(true);
    });
  });

  describe('Key generation consistency', () => {
    it('should generate consistent keys for the same id', () => {
      const id = 42;
      expect(QUERY_KEYS.PRODUCT(id)).toEqual(QUERY_KEYS.PRODUCT(id));
      expect(QUERY_KEYS.USER(id)).toEqual(QUERY_KEYS.USER(id));
      expect(QUERY_KEYS.CUSTOMER(id)).toEqual(QUERY_KEYS.CUSTOMER(id));
      expect(INSTALLATION_QUERY_KEYS.DETAIL(id)).toEqual(INSTALLATION_QUERY_KEYS.DETAIL(id));
    });

    it('should generate different keys for different ids', () => {
      expect(QUERY_KEYS.PRODUCT(1)).not.toEqual(QUERY_KEYS.PRODUCT(2));
      expect(QUERY_KEYS.USER(10)).not.toEqual(QUERY_KEYS.USER(20));
      expect(INSTALLATION_QUERY_KEYS.DETAIL(100)).not.toEqual(INSTALLATION_QUERY_KEYS.DETAIL(200));
    });

    it('should handle edge case ids', () => {
      expect(QUERY_KEYS.PRODUCT(0)).toEqual(['products', 0]);
      expect(QUERY_KEYS.USER(-1)).toEqual(['users', -1]);
      expect(QUERY_KEYS.CUSTOMER(Number.MAX_SAFE_INTEGER)).toEqual(['customers', Number.MAX_SAFE_INTEGER]);
    });
  });
});