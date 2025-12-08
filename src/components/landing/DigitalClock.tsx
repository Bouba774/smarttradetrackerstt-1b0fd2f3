import React, { useEffect, useState } from 'react';

const DigitalClock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatDate = () => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    
    const day = days[time.getDay()];
    const date = time.getDate();
    const month = months[time.getMonth()];
    
    return `${day} ${date} ${month}`;
  };

  const formatTime = () => {
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const seconds = time.getSeconds().toString().padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-card/60 backdrop-blur-xl border border-primary/20">
      <span className="font-display text-sm text-muted-foreground">
        {formatDate()}
      </span>
      <span className="text-primary/50">—</span>
      <span className="font-mono text-sm text-primary neon-text font-semibold tracking-wider">
        {formatTime()}
      </span>
    </div>
  );
};

export default DigitalClock;
