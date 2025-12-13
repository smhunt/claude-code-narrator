import { useEffect, useState, useCallback } from 'react';
import { type TourStep } from '../hooks/useTour';

interface ProductTourProps {
  isActive: boolean;
  currentStep: number;
  currentStepData: TourStep;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onGoToStep: (step: number) => void;
}

interface Position {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function ProductTour({
  isActive,
  currentStep,
  currentStepData,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  onGoToStep,
}: ProductTourProps) {
  const [targetPosition, setTargetPosition] = useState<Position | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [arrowPosition, setArrowPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom');

  const calculatePositions = useCallback(() => {
    if (currentStepData.target === 'center') {
      setTargetPosition(null);
      setTooltipStyle({
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      });
      return;
    }

    const element = document.querySelector(currentStepData.target);
    if (!element) {
      // Element not found, center the tooltip
      setTargetPosition(null);
      setTooltipStyle({
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      });
      return;
    }

    const rect = element.getBoundingClientRect();
    const padding = 8;

    setTargetPosition({
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });

    // Calculate tooltip position based on specified position or auto
    const position = currentStepData.position || 'bottom';
    const tooltipWidth = 360;
    const tooltipHeight = 200; // Approximate
    const gap = 16;

    let style: React.CSSProperties = {};
    let arrow: 'top' | 'bottom' | 'left' | 'right' = 'top';

    switch (position) {
      case 'bottom':
        style = {
          top: rect.bottom + gap,
          left: Math.max(16, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - 16)),
        };
        arrow = 'top';
        break;
      case 'top':
        style = {
          top: rect.top - tooltipHeight - gap,
          left: Math.max(16, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - 16)),
        };
        arrow = 'bottom';
        break;
      case 'right':
        style = {
          top: Math.max(16, rect.top + rect.height / 2 - tooltipHeight / 2),
          left: rect.right + gap,
        };
        arrow = 'left';
        break;
      case 'left':
        style = {
          top: Math.max(16, rect.top + rect.height / 2 - tooltipHeight / 2),
          left: rect.left - tooltipWidth - gap,
        };
        arrow = 'right';
        break;
    }

    setTooltipStyle(style);
    setArrowPosition(arrow);
  }, [currentStepData]);

  useEffect(() => {
    if (!isActive) return;

    calculatePositions();

    const handleResize = () => calculatePositions();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [isActive, calculatePositions]);

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'Enter':
          onNext();
          break;
        case 'ArrowLeft':
          onPrev();
          break;
        case 'Escape':
          onSkip();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onNext, onPrev, onSkip]);

  if (!isActive) return null;

  const isCentered = currentStepData.target === 'center';

  return (
    <div className="tour-overlay">
      {/* Backdrop with spotlight cutout */}
      {targetPosition ? (
        <div
          className="tour-spotlight tour-spotlight-animated"
          style={{
            top: targetPosition.top,
            left: targetPosition.left,
            width: targetPosition.width,
            height: targetPosition.height,
          }}
        />
      ) : (
        <div className="tour-backdrop" onClick={onSkip} />
      )}

      {/* Tooltip */}
      <div className="tour-tooltip" style={tooltipStyle}>
        {!isCentered && <div className={`tour-tooltip-arrow ${arrowPosition}`} />}

        {/* Header with step indicator */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-theme-muted">
            {currentStep + 1} of {totalSteps}
          </span>
          <button
            onClick={onSkip}
            className="text-theme-muted hover:text-theme-primary transition-colors"
            aria-label="Close tour"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <h3 className="text-lg font-semibold text-theme-primary mb-2">{currentStepData.title}</h3>
        <p className="text-sm text-theme-secondary mb-4 leading-relaxed">{currentStepData.description}</p>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mb-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <button
              key={i}
              onClick={() => onGoToStep(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentStep
                  ? 'w-4 btn-accent'
                  : i < currentStep
                    ? 'bg-theme-tertiary'
                    : 'bg-theme-tertiary opacity-50'
              }`}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-2">
          {currentStep > 0 && (
            <button
              onClick={onPrev}
              className="flex-1 px-4 py-2 text-sm rounded-lg bg-theme-tertiary text-theme-primary hover:opacity-80 transition-opacity"
            >
              Back
            </button>
          )}
          {currentStep === 0 && (
            <button
              onClick={onSkip}
              className="flex-1 px-4 py-2 text-sm rounded-lg bg-theme-tertiary text-theme-muted hover:text-theme-primary transition-colors"
            >
              Skip Tour
            </button>
          )}
          <button
            onClick={onNext}
            className="flex-1 px-4 py-2 text-sm rounded-lg btn-accent font-medium transition-opacity hover:opacity-90"
          >
            {currentStep === totalSteps - 1 ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
