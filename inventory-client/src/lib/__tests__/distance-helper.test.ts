import { 
  formatDistance, 
  formatDistanceShort, 
  isValidDistance, 
  compareDistance 
} from '../distance-helper';

describe('Distance Helper', () => {
  describe('formatDistance', () => {
    it('should format distances less than 1km as meters', () => {
      expect(formatDistance(0.5)).toBe('500 公尺');
      expect(formatDistance(0.123)).toBe('123 公尺');
      expect(formatDistance(0.999)).toBe('999 公尺');
    });

    it('should format distances 1km and above as kilometers', () => {
      expect(formatDistance(1)).toBe('1.0 公里');
      expect(formatDistance(1.234)).toBe('1.2 公里');
      expect(formatDistance(10.56789)).toBe('10.6 公里');
    });

    it('should handle null and undefined values', () => {
      expect(formatDistance(null)).toBe('距離未知');
      expect(formatDistance(undefined)).toBe('距離未知');
    });

    it('should handle invalid values', () => {
      expect(formatDistance(NaN)).toBe('距離未知');
      expect(formatDistance(-1)).toBe('距離未知');
      expect(formatDistance(-0.5)).toBe('距離未知');
    });

    it('should handle zero distance', () => {
      expect(formatDistance(0)).toBe('0 公尺');
    });
  });

  describe('formatDistanceShort', () => {
    it('should format distances less than 1km as meters with short format', () => {
      expect(formatDistanceShort(0.5)).toBe('500m');
      expect(formatDistanceShort(0.123)).toBe('123m');
      expect(formatDistanceShort(0.999)).toBe('999m');
    });

    it('should format distances 1km and above as kilometers with short format', () => {
      expect(formatDistanceShort(1)).toBe('1.0km');
      expect(formatDistanceShort(1.234)).toBe('1.2km');
      expect(formatDistanceShort(10.56789)).toBe('10.6km');
    });

    it('should handle null and undefined values', () => {
      expect(formatDistanceShort(null)).toBe('-');
      expect(formatDistanceShort(undefined)).toBe('-');
    });

    it('should handle invalid values', () => {
      expect(formatDistanceShort(NaN)).toBe('-');
      expect(formatDistanceShort(-1)).toBe('-');
      expect(formatDistanceShort(-0.5)).toBe('-');
    });

    it('should handle zero distance', () => {
      expect(formatDistanceShort(0)).toBe('0m');
    });
  });

  describe('isValidDistance', () => {
    it('should return true for valid distances', () => {
      expect(isValidDistance(0)).toBe(true);
      expect(isValidDistance(0.5)).toBe(true);
      expect(isValidDistance(1)).toBe(true);
      expect(isValidDistance(100)).toBe(true);
    });

    it('should return false for invalid distances', () => {
      expect(isValidDistance(null)).toBe(false);
      expect(isValidDistance(undefined)).toBe(false);
      expect(isValidDistance(NaN)).toBe(false);
      expect(isValidDistance(-1)).toBe(false);
      expect(isValidDistance(-0.5)).toBe(false);
    });
  });

  describe('compareDistance', () => {
    it('should correctly compare valid distances', () => {
      expect(compareDistance(1, 2)).toBe(-1);
      expect(compareDistance(2, 1)).toBe(1);
      expect(compareDistance(1, 1)).toBe(0);
    });

    it('should handle null and undefined values', () => {
      // Both invalid
      expect(compareDistance(null, undefined)).toBe(0);
      
      // One invalid (invalid comes last)
      expect(compareDistance(null, 1)).toBe(1);
      expect(compareDistance(1, null)).toBe(-1);
      expect(compareDistance(undefined, 1)).toBe(1);
      expect(compareDistance(1, undefined)).toBe(-1);
    });

    it('should handle mixed valid and invalid values', () => {
      expect(compareDistance(0, null)).toBe(-1);
      expect(compareDistance(null, 0)).toBe(1);
      expect(compareDistance(NaN, 1)).toBe(1);
      expect(compareDistance(1, NaN)).toBe(-1);
    });
  });
});