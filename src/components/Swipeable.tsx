import React, { useRef, useState } from 'react';
import { Check, Trash } from 'lucide-react';

interface SwipeableProps {
  children: React.ReactNode;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  rightBgColor?: string;
  leftBgColor?: string;
}

export const Swipeable: React.FC<SwipeableProps> = ({
  children,
  onSwipeRight,
  onSwipeLeft,
  rightBgColor = 'bg-emerald-500',
  leftBgColor = 'bg-rose-500',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setStartX(touch.clientX);
    setStartY(touch.clientY);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - startX;
    const diffY = touch.clientY - startY;

    if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 10 && Math.abs(currentX) === 0) {
      setIsSwiping(false);
      return;
    }

    let travel = diffX;
    if (diffX > 150) travel = 150 + (diffX - 150) * 0.2;
    if (diffX < -150) travel = -150 + (diffX + 150) * 0.2;

    setCurrentX(travel);

    if (travel > 15) {
      setSwipeDirection('right');
    } else if (travel < -15) {
      setSwipeDirection('left');
    } else {
      setSwipeDirection(null);
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;
    setIsSwiping(false);

    const threshold = 100;
    if (currentX > threshold) {
      onSwipeRight();
    } else if (currentX < -threshold) {
      onSwipeLeft();
    }

    setCurrentX(0);
    setSwipeDirection(null);
  };

  const swipeStyle = {
    transform: `translateX(${currentX}px)`,
    transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  };

  return (
    <div ref={containerRef} className="relative overflow-hidden w-full rounded-2xl">
      {}
      <div className="absolute inset-0 flex items-center justify-between px-6 rounded-2xl pointer-events-none">
        {}
        <div
          className={`absolute left-0 top-0 bottom-0 flex items-center pl-6 text-white rounded-l-2xl transition-opacity duration-200 ${rightBgColor} ${
            swipeDirection === 'right' ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ width: '50%' }}
        >
          <Check size={22} className="animate-pulse" />
          <span className="ml-2 text-sm font-semibold select-none">Complete</span>
        </div>

        {}
        <div
          className={`absolute right-0 top-0 bottom-0 flex items-center justify-end pr-6 text-white rounded-r-2xl transition-opacity duration-200 ${leftBgColor} ${
            swipeDirection === 'left' ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ width: '50%' }}
        >
          <span className="mr-2 text-sm font-semibold select-none">Delete</span>
          <Trash size={20} className="animate-pulse" />
        </div>
      </div>

      {}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={swipeStyle}
        className="relative z-10 w-full bg-transparent"
      >
        {children}
      </div>
    </div>
  );
};
