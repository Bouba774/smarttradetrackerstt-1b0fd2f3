import React, { useEffect, useState } from 'react';

const quotes = [
  {
    text: "Le trading, c'est l'art de ne rien faire quand il faut.",
    author: "Jesse Livermore",
  },
  {
    text: "Risque d'abord, profit ensuite.",
    author: "Paul Tudor Jones",
  },
  {
    text: "La discipline est plus importante que la stratégie.",
    author: "Mark Douglas",
  },
  {
    text: "Le marché peut rester irrationnel plus longtemps que vous ne pouvez rester solvable.",
    author: "John Maynard Keynes",
  },
  {
    text: "Un trader pro exécute son plan. Un amateur suit ses émotions.",
    author: "Anonyme",
  },
  {
    text: "Les grandes opportunités naissent de la patience.",
    author: "Warren Buffett",
  },
];

const QuoteRotator: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % quotes.length);
        setIsVisible(true);
      }, 500);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const currentQuote = quotes[currentIndex];

  return (
    <div className="relative min-h-[100px] flex items-center justify-center px-4">
      <div
        className={`text-center transition-all duration-500 ${
          isVisible 
            ? 'opacity-100 transform translate-y-0' 
            : 'opacity-0 transform translate-y-4'
        }`}
      >
        <div className="relative inline-block">
          {/* Quote glow effect */}
          <div className="absolute inset-0 bg-primary/5 blur-2xl rounded-full" />
          
          <blockquote className="relative text-foreground/90 text-base md:text-lg font-display italic max-w-xl">
            <span className="text-primary text-2xl">"</span>
            {currentQuote.text}
            <span className="text-primary text-2xl">"</span>
          </blockquote>
          
          <p className="mt-3 text-sm text-primary font-semibold neon-text">
            — {currentQuote.author}
          </p>
        </div>
      </div>

      {/* Quote indicator dots */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-2">
        {quotes.map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              i === currentIndex 
                ? 'bg-primary w-4' 
                : 'bg-primary/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default QuoteRotator;
