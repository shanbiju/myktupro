interface SGPACircleProps {
  value: number;
  maxValue?: number;
  label: string;
  sublabel?: string;
  size?: number;
  strokeWidth?: number;
}

export function SGPACircle({ value, maxValue = 10, label, sublabel, size = 140, strokeWidth = 10 }: SGPACircleProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / maxValue, 1);
  const strokeDashoffset = circumference * (1 - progress);

  // Color based on value
  const getColor = () => {
    if (maxValue === 10) {
      if (value >= 8.5) return 'hsl(var(--success))';
      if (value >= 7) return 'hsl(var(--primary))';
      if (value >= 5.5) return 'hsl(var(--warning))';
      return 'hsl(var(--destructive))';
    }
    return 'hsl(var(--success))';
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">
            {value.toFixed(2)}
          </span>
        </div>
      </div>
      <span className="text-xs font-semibold text-foreground">{label}</span>
      {sublabel && <span className="text-[10px] text-muted-foreground">{sublabel}</span>}
    </div>
  );
}
