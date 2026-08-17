import React from "react";

const BULB_COLORS = ["#ef4444", "#fbbf24", "#22c55e", "#3b82f6"];

interface ChristmasLightsProps {
  count?: number;
  className?: string;
}

const ChristmasLights: React.FC<ChristmasLightsProps> = ({
  count = 14,
  className = "",
}) => {
  return (
    <ul className={`flex justify-around ${className}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <li
          key={i}
          className="christmas-light h-2.5 w-2.5 rounded-full"
          style={{
            backgroundColor: BULB_COLORS[i % BULB_COLORS.length],
            boxShadow: `0 0 12px ${BULB_COLORS[i % BULB_COLORS.length]}`,
            animationDelay: `${(i % 7) * 0.35}s`,
            animationDuration: `${1.6 + (i % 4) * 0.4}s`,
          }}
        />
      ))}
    </ul>
  );
};

export default ChristmasLights;