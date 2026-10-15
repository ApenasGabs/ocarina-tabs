import React from 'react';
import { HOLES_CONFIG_VARIANT_1, OCARINA_BODY_PATH, OCARINA_SVG_VIEWBOX } from '../../constants/ocarinaData';

export interface OcarinaDiagramProps {
  holes?: number[];
  size?: number | string;
  className?: string;
  interactive?: boolean;
  onToggleHole?: (holeId: number) => void;
  fillColor?: string;
  outlineColor?: string;
  holeOpenColor?: string;
  showHoleNumbers?: boolean;
  bodyColor?: string;
  closedHoleColor?: string;
  openHoleColor?: string;
  showLabels?: boolean;
}

export const OcarinaDiagram: React.FC<OcarinaDiagramProps> = ({
  holes = [],
  size = 72,
  className = '',
  interactive = false,
  onToggleHole,
  fillColor = '#1f2937',
  outlineColor = '#374151',
  holeOpenColor = '#ffffff',
  showHoleNumbers = false,
  bodyColor,
  closedHoleColor,
  openHoleColor,
  showLabels,
}) => {
  const coveredSet = new Set(holes);
  const strokeColor = bodyColor || outlineColor;
  const closedColor = closedHoleColor || fillColor;
  const openedColor = openHoleColor || holeOpenColor;
  const displayNumbers = showLabels !== undefined ? showLabels : showHoleNumbers;

  return (
    <div
      className={`inline-flex flex-col items-center select-none ${className}`}
      style={{ width: typeof size === 'number' ? `${size}px` : size }}
    >
      <svg
        viewBox={OCARINA_SVG_VIEWBOX}
        className="w-full h-auto drop-shadow-sm transition-transform duration-200"
        style={{ overflow: 'visible' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform="translate(66.649603, -244.60365)">
          {/* Corpo da Ocarina */}
          <path
            d={OCARINA_BODY_PATH}
            fill="none"
            stroke={strokeColor}
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Furos da Ocarina (1 a 12) */}
          {HOLES_CONFIG_VARIANT_1.map((hole) => {
            const isCovered = coveredSet.has(hole.id);
            return (
              <g
                key={hole.id}
                onClick={(e) => {
                  if (interactive && onToggleHole) {
                    e.stopPropagation();
                    onToggleHole(hole.id);
                  }
                }}
                className={interactive ? 'cursor-pointer group' : ''}
              >
                <circle
                  cx={hole.cx}
                  cy={hole.cy}
                  r={hole.r}
                  fill={isCovered ? closedColor : openedColor}
                  stroke={strokeColor}
                  strokeWidth="8"
                  className={
                    interactive
                      ? 'transition-all hover:stroke-primary hover:r-[' + (hole.r + 3) + ']'
                      : ''
                  }
                />
                {displayNumbers && (
                  <text
                    x={hole.cx}
                    y={hole.cy + 6}
                    textAnchor="middle"
                    fontSize="18"
                    fontWeight="bold"
                    fill={isCovered ? '#ffffff' : '#4b5563'}
                    pointerEvents="none"
                  >
                    {hole.id}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
