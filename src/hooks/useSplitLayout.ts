import { useState, useCallback } from 'react';

export type SplitDirection = 'horizontal' | 'vertical';
export type LayoutMode = 'single' | 'split';

export interface SplitLayoutState {
  mode: LayoutMode;
  direction: SplitDirection;
  primaryPaneId: string | null;    // Terminal ID shown in primary (left/top) pane
  secondaryPaneId: string | null;  // Terminal ID shown in secondary (right/bottom) pane
  focusedPane: 'primary' | 'secondary';
  sizes: [number, number];         // Panel sizes as percentages [primary, secondary]
}

export interface UseSplitLayoutReturn {
  layout: SplitLayoutState;
  isSplit: boolean;

  // Actions
  enableSplit: (direction: SplitDirection, primaryId: string, secondaryId?: string | null) => void;
  disableSplit: () => void;
  toggleSplit: (direction?: SplitDirection) => void;
  setDirection: (direction: SplitDirection) => void;

  // Pane management
  setPrimaryPane: (id: string | null) => void;
  setSecondaryPane: (id: string | null) => void;
  swapPanes: () => void;
  setFocusedPane: (pane: 'primary' | 'secondary') => void;
  setSizes: (sizes: [number, number]) => void;

  // Helpers
  getVisibleTerminalIds: () => string[];
  isTerminalVisible: (id: string) => boolean;
}

const STORAGE_KEY = 'claude-narrator-split-layout';

function loadLayout(): SplitLayoutState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore
  }
  return {
    mode: 'single',
    direction: 'horizontal',
    primaryPaneId: null,
    secondaryPaneId: null,
    focusedPane: 'primary',
    sizes: [50, 50],
  };
}

function saveLayout(layout: SplitLayoutState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // Ignore
  }
}

export function useSplitLayout(activeSessionId: string | null): UseSplitLayoutReturn {
  const [layout, setLayout] = useState<SplitLayoutState>(() => {
    const saved = loadLayout();
    // Initialize primary pane with active session if not set
    if (!saved.primaryPaneId && activeSessionId) {
      saved.primaryPaneId = activeSessionId;
    }
    return saved;
  });

  const updateLayout = useCallback((updates: Partial<SplitLayoutState>) => {
    setLayout(prev => {
      const newLayout = { ...prev, ...updates };
      saveLayout(newLayout);
      return newLayout;
    });
  }, []);

  const enableSplit = useCallback((
    direction: SplitDirection,
    primaryId: string,
    secondaryId: string | null = null
  ) => {
    updateLayout({
      mode: 'split',
      direction,
      primaryPaneId: primaryId,
      secondaryPaneId: secondaryId,
      focusedPane: secondaryId ? 'secondary' : 'primary',
    });
  }, [updateLayout]);

  const disableSplit = useCallback(() => {
    updateLayout({
      mode: 'single',
      secondaryPaneId: null,
    });
  }, [updateLayout]);

  const toggleSplit = useCallback((direction?: SplitDirection) => {
    if (layout.mode === 'single') {
      enableSplit(direction || 'horizontal', layout.primaryPaneId || activeSessionId || '', null);
    } else {
      disableSplit();
    }
  }, [layout.mode, layout.primaryPaneId, activeSessionId, enableSplit, disableSplit]);

  const setDirection = useCallback((direction: SplitDirection) => {
    updateLayout({ direction });
  }, [updateLayout]);

  const setPrimaryPane = useCallback((id: string | null) => {
    updateLayout({ primaryPaneId: id });
  }, [updateLayout]);

  const setSecondaryPane = useCallback((id: string | null) => {
    updateLayout({ secondaryPaneId: id });
  }, [updateLayout]);

  const swapPanes = useCallback(() => {
    updateLayout({
      primaryPaneId: layout.secondaryPaneId,
      secondaryPaneId: layout.primaryPaneId,
    });
  }, [layout.primaryPaneId, layout.secondaryPaneId, updateLayout]);

  const setFocusedPane = useCallback((pane: 'primary' | 'secondary') => {
    updateLayout({ focusedPane: pane });
  }, [updateLayout]);

  const setSizes = useCallback((sizes: [number, number]) => {
    updateLayout({ sizes });
  }, [updateLayout]);

  const getVisibleTerminalIds = useCallback((): string[] => {
    const ids: string[] = [];
    if (layout.primaryPaneId) ids.push(layout.primaryPaneId);
    if (layout.mode === 'split' && layout.secondaryPaneId) {
      ids.push(layout.secondaryPaneId);
    }
    return ids;
  }, [layout]);

  const isTerminalVisible = useCallback((id: string): boolean => {
    if (layout.primaryPaneId === id) return true;
    if (layout.mode === 'split' && layout.secondaryPaneId === id) return true;
    return false;
  }, [layout]);

  return {
    layout,
    isSplit: layout.mode === 'split',
    enableSplit,
    disableSplit,
    toggleSplit,
    setDirection,
    setPrimaryPane,
    setSecondaryPane,
    swapPanes,
    setFocusedPane,
    setSizes,
    getVisibleTerminalIds,
    isTerminalVisible,
  };
}
