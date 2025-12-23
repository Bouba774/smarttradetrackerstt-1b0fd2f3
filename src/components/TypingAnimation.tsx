import React, { useState, useEffect } from 'react';

interface TypingAnimationProps {
  text: string;
  speed?: number;
  isComplete?: boolean;
}

const TypingAnimation: React.FC<TypingAnimationProps> = ({ 
  text, 
  speed = 15,
  isComplete = false 
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // If the message is complete or already fully displayed, show all
    if (isComplete || currentIndex >= text.length) {
      setDisplayedText(text);
      return;
    }

    // If text changed (streaming update), catch up
    if (text.length > displayedText.length && currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1));
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    }
  }, [text, currentIndex, speed, isComplete, displayedText.length]);

  // Reset when text changes significantly (new message)
  useEffect(() => {
    if (text.length < displayedText.length) {
      setDisplayedText('');
      setCurrentIndex(0);
    }
  }, [text, displayedText.length]);

  return (
    <span>
      {displayedText}
      {!isComplete && currentIndex < text.length && (
        <span className="inline-block w-1 h-4 ml-0.5 bg-primary animate-pulse" />
      )}
    </span>
  );
};

export default TypingAnimation;
