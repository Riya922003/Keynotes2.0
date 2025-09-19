'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle, X } from 'lucide-react';

export default function HelpFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50" ref={dialogRef}>
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-background border rounded-lg p-4 shadow-lg w-64 mb-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Need Help?</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Get started with Keynotes or contact support.
          </p>
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm">
              Documentation
            </Button>
            <Button variant="outline" size="sm">
              Contact Support
            </Button>
          </div>
        </div>
      )}
      
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full w-12 h-12 shadow-lg"
        size="icon"
        aria-label="Help"
      >
        <HelpCircle className="h-5 w-5" />
      </Button>
    </div>
  );
}