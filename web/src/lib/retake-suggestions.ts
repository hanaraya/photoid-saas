import { type ComplianceCheck } from './compliance';

export interface RetakeSuggestion {
  id: string;
  priority: number; // 1 = highest priority (most impactful)
  icon: string;
  title: string;
  problem: string;
  solution: string;
  tips: string[];
}

/**
 * Maps compliance check failures/warnings to actionable retake suggestions
 */
export function getRetakeSuggestions(
  checks: ComplianceCheck[]
): RetakeSuggestion[] {
  const suggestions: RetakeSuggestion[] = [];

  for (const check of checks) {
    if (check.status === 'pass' || check.status === 'pending') continue;

    const suggestion = mapCheckToSuggestion(check);
    if (suggestion) {
      suggestions.push(suggestion);
    }
  }

  // Sort by priority (1 = highest)
  return suggestions.sort((a, b) => a.priority - b.priority);
}

function mapCheckToSuggestion(check: ComplianceCheck): RetakeSuggestion | null {
  const suggestionMap: Record<string, Omit<RetakeSuggestion, 'id'>> = {
    face: {
      priority: 1,
      icon: '👤',
      title: 'Face Not Detected',
      problem: 'The camera could not find a face in your photo.',
      solution: 'Make sure your face is clearly visible, well-lit, and facing the camera directly.',
      tips: [
        'Face the camera straight on',
        'Ensure good lighting on your face',
        'Remove anything covering your face',
        'Keep a neutral expression',
      ],
    },
    head_size: {
      priority: 3,
      icon: '📏',
      title: 'Head Size Issue',
      problem: check.message.includes('small')
        ? 'Your head appears too small in the photo.'
        : 'Your head appears too large in the photo.',
      solution: check.message.includes('small')
        ? 'Move closer to the camera or zoom in.'
        : 'Move further from the camera or zoom out.',
      tips: check.message.includes('small')
        ? [
            'Stand 2-3 feet from the camera',
            'Use the zoom slider to fill more of the frame',
            'Your head should fill 50-69% of the photo height',
          ]
        : [
            'Step back from the camera',
            'Use the zoom slider to show more of the frame',
            'Leave space above your head',
          ],
    },
    eye_position: {
      priority: 4,
      icon: '👁️',
      title: 'Eye Position',
      problem: 'Could not verify eye positions in the photo.',
      solution: 'Look directly at the camera with both eyes open and visible.',
      tips: [
        'Look straight at the camera lens',
        'Keep both eyes open',
        'Remove glasses if they cause glare',
        'Avoid squinting',
      ],
    },
    head_framing: {
      priority: 2,
      icon: '🖼️',
      title: 'Head Cropping',
      problem: check.message.toLowerCase().includes('crown') || check.message.toLowerCase().includes('top')
        ? 'The top of your head is being cut off.'
        : check.message.toLowerCase().includes('chin')
        ? 'Your chin is being cut off.'
        : 'Part of your head is outside the frame.',
      solution: check.message.includes('retake')
        ? 'Retake the photo with more space above your head.'
        : 'Adjust zoom or position so your full head is visible.',
      tips: check.message.includes('retake')
        ? [
            'Position camera further back',
            'Tilt camera down slightly',
            'Leave at least 4 inches above your head',
            'Cannot be fixed with current photo',
          ]
        : [
            'Use the zoom slider to fit your whole head',
            'Move up/down in front of camera',
            'Include full head from crown to chin',
          ],
    },
    head_centering: {
      priority: 5,
      icon: '↔️',
      title: 'Head Not Centered',
      problem: 'Your head is not centered horizontally in the frame.',
      solution: 'Move left or right so your face is in the middle of the photo.',
      tips: [
        'Center yourself in the camera viewfinder',
        'Align your nose with the center of the frame',
        'Keep your shoulders square to the camera',
      ],
    },
    background: {
      priority: 6,
      icon: '🎨',
      title: 'Background Issue',
      problem: 'Background has not been processed.',
      solution: 'Use the Fix button to apply a white background.',
      tips: [
        'Tap "Fix" in the compliance panel',
        'Original: use a plain, light-colored wall',
        'Avoid busy patterns or objects behind you',
      ],
    },
    resolution: {
      priority: 2,
      icon: '📷',
      title: 'Low Resolution',
      problem: 'The photo resolution is too low for high-quality prints.',
      solution: 'Use a higher resolution camera or take the photo in better lighting.',
      tips: [
        'Use your phone\'s main camera (not selfie)',
        'Ensure "High Quality" is enabled in camera settings',
        'Don\'t crop heavily before uploading',
        'Avoid digital zoom',
      ],
    },
    sharpness: {
      priority: 1,
      icon: '🔍',
      title: 'Blurry Photo',
      problem: 'The photo appears blurry or out of focus.',
      solution: 'Hold the camera steady and ensure good focus before taking the photo.',
      tips: [
        'Hold your phone with both hands',
        'Tap to focus on your face before shooting',
        'Use a tripod or lean against something',
        'Clean your camera lens',
        'Ensure adequate lighting',
      ],
    },
    face_angle: {
      priority: 3,
      icon: '↩️',
      title: 'Head Tilted',
      problem: 'Your head appears tilted to one side.',
      solution: 'Keep your head straight and level when taking the photo.',
      tips: [
        'Keep both ears at the same height',
        'Imagine a string pulling the top of your head up',
        'Look straight at the camera lens',
        'Relax your shoulders evenly',
      ],
    },
    color_photo: {
      priority: 1,
      icon: '🎨',
      title: 'Not a Color Photo',
      problem: 'The photo appears to be black & white or grayscale.',
      solution: 'Use a color photo — black & white photos are not accepted.',
      tips: [
        'Disable any B&W filters on your camera',
        'Check camera settings for "Color" mode',
        'Avoid apps that auto-apply filters',
        'Take a new photo without effects',
      ],
    },
    lighting: {
      priority: 4,
      icon: '💡',
      title: 'Uneven Lighting',
      problem: 'There are shadows or uneven lighting on your face.',
      solution: 'Position yourself so light falls evenly on both sides of your face.',
      tips: [
        'Face a window for natural light',
        'Avoid overhead-only lighting',
        'No strong light from one side',
        'Diffused light works best',
        'Avoid direct sunlight (causes harsh shadows)',
      ],
    },
  };

  const mapped = suggestionMap[check.id];
  if (!mapped) return null;

  return {
    id: check.id,
    ...mapped,
  };
}

/**
 * Checks if any suggestions require a retake vs. can be fixed with adjustments
 */
export function needsRetake(suggestions: RetakeSuggestion[]): boolean {
  const retakeRequiredIds = [
    'face',
    'sharpness',
    'color_photo',
    'resolution',
  ];
  
  return suggestions.some(
    (s) =>
      retakeRequiredIds.includes(s.id) ||
      (s.id === 'head_framing' && s.tips.includes('Cannot be fixed with current photo'))
  );
}

/**
 * Gets suggestions that can be fixed with UI adjustments (zoom, etc.)
 */
export function getAdjustableSuggestions(
  suggestions: RetakeSuggestion[]
): RetakeSuggestion[] {
  const adjustableIds = ['head_size', 'head_centering', 'background'];
  return suggestions.filter((s) => adjustableIds.includes(s.id));
}

/**
 * Gets suggestions that require a new photo
 */
export function getRetakeSuggestions2(
  suggestions: RetakeSuggestion[]
): RetakeSuggestion[] {
  const adjustableIds = ['head_size', 'head_centering', 'background'];
  return suggestions.filter((s) => !adjustableIds.includes(s.id));
}
