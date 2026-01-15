import React from 'react';

interface DeliveryRobotIconProps {
  size?: number;
  className?: string;
  color?: string;
  animated?: boolean;
  bouncing?: boolean;
}

const DeliveryRobotIcon: React.FC<DeliveryRobotIconProps> = ({ 
  size = 24, 
  className = '',
  color = 'currentColor',
  animated = false,
  bouncing = false
}) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color}
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={`${className} ${bouncing ? 'animate-bounce' : ''}`}
    >
      <style>
        {`
          @keyframes wheelSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .wheel-animated {
            animation: wheelSpin 0.5s linear infinite;
            transform-origin: center;
          }
        `}
      </style>
      {/* Robot body */}
      <rect x="4" y="6" width="16" height="10" rx="2" ry="2" />
      {/* Top sensor/camera */}
      <rect x="10" y="2" width="4" height="4" rx="1" />
      {/* Eyes/sensors */}
      <circle cx="9" cy="11" r="1.5" fill={color} />
      <circle cx="15" cy="11" r="1.5" fill={color} />
      {/* Wheels with animation */}
      <g className={animated ? 'wheel-animated' : ''} style={{ transformOrigin: '7px 19px' }}>
        <circle cx="7" cy="19" r="2" />
        {/* Wheel spoke for visible rotation */}
        <line x1="7" y1="17" x2="7" y2="19" strokeWidth="1.5" />
      </g>
      <g className={animated ? 'wheel-animated' : ''} style={{ transformOrigin: '17px 19px' }}>
        <circle cx="17" cy="19" r="2" />
        {/* Wheel spoke for visible rotation */}
        <line x1="17" y1="17" x2="17" y2="19" strokeWidth="1.5" />
      </g>
      {/* Wheel connectors */}
      <line x1="7" y1="16" x2="7" y2="17" />
      <line x1="17" y1="16" x2="17" y2="17" />
    </svg>
  );
};

export default DeliveryRobotIcon;
