import { useEffect } from 'react';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  terminalRef: React.RefObject<HTMLDivElement | null>;
}

export function Terminal({ terminalRef }: TerminalProps) {
  useEffect(() => {
    // Force fit when component mounts
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex-1 bg-[#1a1b26] rounded-lg overflow-hidden border border-gray-700">
      <div ref={terminalRef} className="h-full w-full p-2" />
    </div>
  );
}
