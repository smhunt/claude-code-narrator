import { useState, useCallback, useEffect } from 'react';

const TOUR_STORAGE_KEY = 'narrator-tour-completed';

export interface TourStep {
  id: string;
  target: string; // CSS selector or 'center' for centered modal
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    target: 'center',
    title: 'Welcome to Claude Code Narrator',
    description:
      'This app helps you watch and listen to Claude Code working in real-time. Get AI-powered narration of terminal sessions with text-to-speech support.',
  },
  {
    id: 'terminal',
    target: '[data-tour="terminal"]',
    title: 'Terminal View',
    description:
      "This is where you'll see Claude Code's terminal output in real-time. Watch commands being executed and their results as they happen.",
    position: 'right',
  },
  {
    id: 'narration',
    target: '[data-tour="narration"]',
    title: 'AI Narration Panel',
    description:
      'Claude summarizes what\'s happening in the terminal. Enable text-to-speech to hear the narration read aloud automatically.',
    position: 'top',
  },
  {
    id: 'controls',
    target: '[data-tour="controls"]',
    title: 'Session Controls',
    description:
      'Start new sessions, connect via SSH, or attach to existing Claude Code instances. Configure voice and narration settings here.',
    position: 'left',
  },
  {
    id: 'quick-commands',
    target: '[data-tour="quick-commands"]',
    title: 'Quick Commands',
    description:
      'Send commands directly to the terminal. Use the autocomplete dropdown for common commands or type your own.',
    position: 'top',
  },
  {
    id: 'history',
    target: '[data-tour="history"]',
    title: 'Session History',
    description:
      'Browse past sessions and their transcripts. Click any session to expand and see the full narration history.',
    position: 'left',
  },
  {
    id: 'complete',
    target: 'center',
    title: "You're All Set!",
    description:
      'Start a new session to begin watching Claude Code in action. The AI will narrate everything that happens in real-time.',
  },
];

export function useTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedTour, setHasCompletedTour] = useState(true); // Default to true to prevent flash

  useEffect(() => {
    const completed = localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
    setHasCompletedTour(completed);
    // Auto-start tour for first-time visitors
    if (!completed) {
      setIsActive(true);
    }
  }, []);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const endTour = useCallback((markComplete = true) => {
    setIsActive(false);
    setCurrentStep(0);
    if (markComplete) {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      setHasCompletedTour(true);
    }
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      endTour(true);
    }
  }, [currentStep, endTour]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < tourSteps.length) {
      setCurrentStep(step);
    }
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    setHasCompletedTour(false);
  }, []);

  return {
    isActive,
    currentStep,
    currentStepData: tourSteps[currentStep],
    totalSteps: tourSteps.length,
    hasCompletedTour,
    startTour,
    endTour,
    nextStep,
    prevStep,
    goToStep,
    resetTour,
  };
}
