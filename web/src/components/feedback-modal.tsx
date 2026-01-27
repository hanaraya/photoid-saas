'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoStandard?: string;
}

export function FeedbackModal({ isOpen, onClose, photoStandard }: FeedbackModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating === 0) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || undefined,
          photoStandard,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }
      
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError('Failed to submit. Please try again.');
      console.error('Feedback submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const displayRating = hoveredRating || rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
        {submitted ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🙏</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Thank you!
            </h3>
            <p className="text-gray-600">
              Your feedback helps us improve.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">📸</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                How was your experience?
              </h3>
              <p className="text-gray-600 text-sm">
                Your feedback helps us make better passport photos
              </p>
            </div>

            {/* Star Rating */}
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="text-4xl transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                >
                  {star <= displayRating ? '⭐' : '☆'}
                </button>
              ))}
            </div>

            {/* Rating Label */}
            <div className="text-center mb-4 h-6">
              {displayRating > 0 && (
                <span className="text-sm text-gray-600">
                  {displayRating === 1 && 'Poor'}
                  {displayRating === 2 && 'Fair'}
                  {displayRating === 3 && 'Good'}
                  {displayRating === 4 && 'Great'}
                  {displayRating === 5 && 'Excellent!'}
                </span>
              )}
            </div>

            {/* Comment Box */}
            <div className="mb-6">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Any suggestions or comments? (optional)"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                maxLength={500}
              />
              <div className="text-right text-xs text-gray-400 mt-1">
                {comment.length}/500
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 text-center text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleSkip}
                className="flex-1"
                disabled={isSubmitting}
              >
                Skip
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={rating === 0 || isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? 'Sending...' : 'Submit'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
