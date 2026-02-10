import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hover = false, onClick }: CardProps) {
  const hoverClass = hover ? 'card-hover cursor-pointer' : '';
  
  return (
    <div 
      className={`card ${hoverClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
