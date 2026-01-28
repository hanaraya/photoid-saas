// Tests for retake-suggestions module
import {
  getRetakeSuggestions,
  needsRetake,
  getAdjustableSuggestions,
  getRetakeSuggestions2,
  type RetakeSuggestion,
} from '@/lib/retake-suggestions';
import { type ComplianceCheck } from '@/lib/compliance';

describe('retake-suggestions', () => {
  describe('getRetakeSuggestions', () => {
    it('returns empty array for all passing checks', () => {
      const checks: ComplianceCheck[] = [
        { id: 'face', label: 'Face', status: 'pass', message: 'Face detected' },
        { id: 'head_size', label: 'Head Size', status: 'pass', message: 'OK' },
      ];
      
      const suggestions = getRetakeSuggestions(checks);
      
      expect(suggestions).toEqual([]);
    });

    it('returns empty array for pending checks', () => {
      const checks: ComplianceCheck[] = [
        { id: 'head_size', label: 'Head Size', status: 'pending', message: 'Waiting' },
      ];
      
      const suggestions = getRetakeSuggestions(checks);
      
      expect(suggestions).toEqual([]);
    });

    it('returns suggestion for failed face detection', () => {
      const checks: ComplianceCheck[] = [
        { id: 'face', label: 'Face Detection', status: 'fail', message: 'No face detected' },
      ];
      
      const suggestions = getRetakeSuggestions(checks);
      
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].id).toBe('face');
      expect(suggestions[0].priority).toBe(1);
      expect(suggestions[0].icon).toBe('👤');
      expect(suggestions[0].title).toBe('Face Not Detected');
      expect(suggestions[0].tips.length).toBeGreaterThan(0);
    });

    it('returns suggestion for head too small', () => {
      const checks: ComplianceCheck[] = [
        { id: 'head_size', label: 'Head Size', status: 'warn', message: 'Head appears too small' },
      ];
      
      const suggestions = getRetakeSuggestions(checks);
      
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].id).toBe('head_size');
      expect(suggestions[0].problem).toContain('too small');
      expect(suggestions[0].solution).toContain('closer');
    });

    it('returns suggestion for head too large', () => {
      const checks: ComplianceCheck[] = [
        { id: 'head_size', label: 'Head Size', status: 'warn', message: 'Head appears too large' },
      ];
      
      const suggestions = getRetakeSuggestions(checks);
      
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].problem).toContain('too large');
      expect(suggestions[0].solution).toContain('further');
    });

    it('returns suggestion for crown being cut off', () => {
      const checks: ComplianceCheck[] = [
        { id: 'head_framing', label: 'Head Framing', status: 'fail', message: 'Top of head may be cropped' },
      ];
      
      const suggestions = getRetakeSuggestions(checks);
      
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].id).toBe('head_framing');
      expect(suggestions[0].problem).toContain('top');
    });

    it('returns suggestion for chin being cut off', () => {
      const checks: ComplianceCheck[] = [
        { id: 'head_framing', label: 'Head Framing', status: 'fail', message: 'Chin may be cropped' },
      ];
      
      const suggestions = getRetakeSuggestions(checks);
      
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].problem).toContain('chin');
    });

    it('returns suggestion for source photo needing retake', () => {
      const checks: ComplianceCheck[] = [
        { id: 'head_framing', label: 'Head Framing', status: 'fail', message: 'Source photo has head too close to top — retake' },
      ];
      
      const suggestions = getRetakeSuggestions(checks);
      
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].solution).toContain('Retake');
      expect(suggestions[0].tips).toContain('Cannot be fixed with current photo');
    });

    it('returns suggestion for blurry photo', () => {
      const checks: ComplianceCheck[] = [
        { id: 'sharpness', label: 'Sharpness', status: 'fail', message: 'Photo appears blurry' },
      ];
      
      const suggestions = getRetakeSuggestions(checks);
      
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].id).toBe('sharpness');
      expect(suggestions[0].priority).toBe(1);
      expect(suggestions[0].title).toBe('Blurry Photo');
    });

    it('returns suggestion for grayscale photo', () => {
      const checks: ComplianceCheck[] = [
        { id: 'color_photo', label: 'Color Photo', status: 'fail', message: 'Photo must be in color' },
      ];
      
      const suggestions = getRetakeSuggestions(checks);
      
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].id).toBe('color_photo');
      expect(suggestions[0].priority).toBe(1);
    });

    it('returns suggestion for tilted head', () => {
      const checks: ComplianceCheck[] = [
        { id: 'face_angle', label: 'Face Angle', status: 'warn', message: 'Head appears tilted (5.2°)' },
      ];
      
      const suggestions = getRetakeSuggestions(checks);
      
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].id).toBe('face_angle');
      expect(suggestions[0].icon).toBe('↩️');
    });

    it('returns suggestion for uneven lighting', () => {
      const checks: ComplianceCheck[] = [
        { id: 'lighting', label: 'Lighting', status: 'warn', message: 'Uneven lighting detected' },
      ];
      
      const suggestions = getRetakeSuggestions(checks);
      
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].id).toBe('lighting');
      expect(suggestions[0].icon).toBe('💡');
    });

    it('returns suggestion for low resolution', () => {
      const checks: ComplianceCheck[] = [
        { id: 'resolution', label: 'Resolution', status: 'fail', message: '300x300 — too low' },
      ];
      
      const suggestions = getRetakeSuggestions(checks);
      
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].id).toBe('resolution');
      expect(suggestions[0].priority).toBe(2);
    });

    it('returns suggestion for background not removed', () => {
      const checks: ComplianceCheck[] = [
        { id: 'background', label: 'Background', status: 'warn', message: 'Click Remove Background' },
      ];
      
      const suggestions = getRetakeSuggestions(checks);
      
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].id).toBe('background');
      expect(suggestions[0].solution).toContain('Fix button');
    });

    it('returns suggestion for head not centered', () => {
      const checks: ComplianceCheck[] = [
        { id: 'head_centering', label: 'Centering', status: 'fail', message: 'Head is not centered' },
      ];
      
      const suggestions = getRetakeSuggestions(checks);
      
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].id).toBe('head_centering');
      expect(suggestions[0].icon).toBe('↔️');
    });

    it('sorts suggestions by priority (lowest number first)', () => {
      const checks: ComplianceCheck[] = [
        { id: 'lighting', label: 'Lighting', status: 'warn', message: 'Uneven' }, // priority 4
        { id: 'face', label: 'Face', status: 'fail', message: 'No face' }, // priority 1
        { id: 'head_size', label: 'Size', status: 'warn', message: 'Too small' }, // priority 3
      ];
      
      const suggestions = getRetakeSuggestions(checks);
      
      expect(suggestions).toHaveLength(3);
      expect(suggestions[0].id).toBe('face'); // priority 1
      expect(suggestions[1].id).toBe('head_size'); // priority 3
      expect(suggestions[2].id).toBe('lighting'); // priority 4
    });

    it('returns multiple suggestions for multiple failures', () => {
      const checks: ComplianceCheck[] = [
        { id: 'face', label: 'Face', status: 'pass', message: 'OK' },
        { id: 'sharpness', label: 'Sharp', status: 'fail', message: 'Blurry' },
        { id: 'lighting', label: 'Light', status: 'warn', message: 'Uneven' },
        { id: 'head_size', label: 'Size', status: 'pass', message: 'OK' },
      ];
      
      const suggestions = getRetakeSuggestions(checks);
      
      expect(suggestions).toHaveLength(2);
      expect(suggestions.map(s => s.id)).toContain('sharpness');
      expect(suggestions.map(s => s.id)).toContain('lighting');
    });

    it('ignores unknown check IDs gracefully', () => {
      const checks: ComplianceCheck[] = [
        { id: 'unknown_check', label: 'Unknown', status: 'fail', message: 'Error' },
      ];
      
      const suggestions = getRetakeSuggestions(checks);
      
      expect(suggestions).toEqual([]);
    });

    it('handles eye_position check', () => {
      const checks: ComplianceCheck[] = [
        { id: 'eye_position', label: 'Eyes', status: 'warn', message: 'Could not verify' },
      ];
      
      const suggestions = getRetakeSuggestions(checks);
      
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].id).toBe('eye_position');
      expect(suggestions[0].icon).toBe('👁️');
    });
  });

  describe('needsRetake', () => {
    it('returns false when no suggestions', () => {
      expect(needsRetake([])).toBe(false);
    });

    it('returns true for face detection failure', () => {
      const suggestions: RetakeSuggestion[] = [
        { id: 'face', priority: 1, icon: '👤', title: 'Face', problem: '', solution: '', tips: [] },
      ];
      
      expect(needsRetake(suggestions)).toBe(true);
    });

    it('returns true for blurry photo', () => {
      const suggestions: RetakeSuggestion[] = [
        { id: 'sharpness', priority: 1, icon: '🔍', title: 'Blur', problem: '', solution: '', tips: [] },
      ];
      
      expect(needsRetake(suggestions)).toBe(true);
    });

    it('returns true for grayscale photo', () => {
      const suggestions: RetakeSuggestion[] = [
        { id: 'color_photo', priority: 1, icon: '🎨', title: 'Color', problem: '', solution: '', tips: [] },
      ];
      
      expect(needsRetake(suggestions)).toBe(true);
    });

    it('returns true for low resolution', () => {
      const suggestions: RetakeSuggestion[] = [
        { id: 'resolution', priority: 2, icon: '📷', title: 'Res', problem: '', solution: '', tips: [] },
      ];
      
      expect(needsRetake(suggestions)).toBe(true);
    });

    it('returns true for head_framing with unfixable source', () => {
      const suggestions: RetakeSuggestion[] = [
        { 
          id: 'head_framing', 
          priority: 2, 
          icon: '🖼️', 
          title: 'Frame', 
          problem: '', 
          solution: '', 
          tips: ['Cannot be fixed with current photo'] 
        },
      ];
      
      expect(needsRetake(suggestions)).toBe(true);
    });

    it('returns false for adjustable issues only', () => {
      const suggestions: RetakeSuggestion[] = [
        { id: 'head_size', priority: 3, icon: '📏', title: 'Size', problem: '', solution: '', tips: [] },
        { id: 'background', priority: 6, icon: '🎨', title: 'BG', problem: '', solution: '', tips: [] },
      ];
      
      expect(needsRetake(suggestions)).toBe(false);
    });

    it('returns false for lighting/tilt warnings', () => {
      const suggestions: RetakeSuggestion[] = [
        { id: 'lighting', priority: 4, icon: '💡', title: 'Light', problem: '', solution: '', tips: [] },
        { id: 'face_angle', priority: 3, icon: '↩️', title: 'Tilt', problem: '', solution: '', tips: [] },
      ];
      
      expect(needsRetake(suggestions)).toBe(false);
    });
  });

  describe('getAdjustableSuggestions', () => {
    it('returns empty array when no suggestions', () => {
      expect(getAdjustableSuggestions([])).toEqual([]);
    });

    it('returns head_size suggestions', () => {
      const suggestions: RetakeSuggestion[] = [
        { id: 'head_size', priority: 3, icon: '📏', title: 'Size', problem: '', solution: '', tips: [] },
        { id: 'sharpness', priority: 1, icon: '🔍', title: 'Blur', problem: '', solution: '', tips: [] },
      ];
      
      const adjustable = getAdjustableSuggestions(suggestions);
      
      expect(adjustable).toHaveLength(1);
      expect(adjustable[0].id).toBe('head_size');
    });

    it('returns head_centering suggestions', () => {
      const suggestions: RetakeSuggestion[] = [
        { id: 'head_centering', priority: 5, icon: '↔️', title: 'Center', problem: '', solution: '', tips: [] },
      ];
      
      const adjustable = getAdjustableSuggestions(suggestions);
      
      expect(adjustable).toHaveLength(1);
      expect(adjustable[0].id).toBe('head_centering');
    });

    it('returns background suggestions', () => {
      const suggestions: RetakeSuggestion[] = [
        { id: 'background', priority: 6, icon: '🎨', title: 'BG', problem: '', solution: '', tips: [] },
      ];
      
      const adjustable = getAdjustableSuggestions(suggestions);
      
      expect(adjustable).toHaveLength(1);
      expect(adjustable[0].id).toBe('background');
    });

    it('returns multiple adjustable suggestions', () => {
      const suggestions: RetakeSuggestion[] = [
        { id: 'head_size', priority: 3, icon: '📏', title: 'Size', problem: '', solution: '', tips: [] },
        { id: 'head_centering', priority: 5, icon: '↔️', title: 'Center', problem: '', solution: '', tips: [] },
        { id: 'background', priority: 6, icon: '🎨', title: 'BG', problem: '', solution: '', tips: [] },
      ];
      
      const adjustable = getAdjustableSuggestions(suggestions);
      
      expect(adjustable).toHaveLength(3);
    });

    it('excludes non-adjustable suggestions', () => {
      const suggestions: RetakeSuggestion[] = [
        { id: 'face', priority: 1, icon: '👤', title: 'Face', problem: '', solution: '', tips: [] },
        { id: 'sharpness', priority: 1, icon: '🔍', title: 'Blur', problem: '', solution: '', tips: [] },
        { id: 'lighting', priority: 4, icon: '💡', title: 'Light', problem: '', solution: '', tips: [] },
      ];
      
      const adjustable = getAdjustableSuggestions(suggestions);
      
      expect(adjustable).toEqual([]);
    });
  });

  describe('getRetakeSuggestions2 (non-adjustable)', () => {
    it('returns empty array when no suggestions', () => {
      expect(getRetakeSuggestions2([])).toEqual([]);
    });

    it('excludes adjustable suggestions', () => {
      const suggestions: RetakeSuggestion[] = [
        { id: 'head_size', priority: 3, icon: '📏', title: 'Size', problem: '', solution: '', tips: [] },
        { id: 'background', priority: 6, icon: '🎨', title: 'BG', problem: '', solution: '', tips: [] },
      ];
      
      const retake = getRetakeSuggestions2(suggestions);
      
      expect(retake).toEqual([]);
    });

    it('returns non-adjustable suggestions', () => {
      const suggestions: RetakeSuggestion[] = [
        { id: 'face', priority: 1, icon: '👤', title: 'Face', problem: '', solution: '', tips: [] },
        { id: 'sharpness', priority: 1, icon: '🔍', title: 'Blur', problem: '', solution: '', tips: [] },
        { id: 'head_size', priority: 3, icon: '📏', title: 'Size', problem: '', solution: '', tips: [] },
      ];
      
      const retake = getRetakeSuggestions2(suggestions);
      
      expect(retake).toHaveLength(2);
      expect(retake.map(s => s.id)).toContain('face');
      expect(retake.map(s => s.id)).toContain('sharpness');
    });

    it('returns lighting and tilt suggestions', () => {
      const suggestions: RetakeSuggestion[] = [
        { id: 'lighting', priority: 4, icon: '💡', title: 'Light', problem: '', solution: '', tips: [] },
        { id: 'face_angle', priority: 3, icon: '↩️', title: 'Tilt', problem: '', solution: '', tips: [] },
      ];
      
      const retake = getRetakeSuggestions2(suggestions);
      
      expect(retake).toHaveLength(2);
    });
  });
});
