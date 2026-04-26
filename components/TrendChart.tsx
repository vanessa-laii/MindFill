'use client';

interface TrendChartProps {
  data: { date: string; value: number }[];
  color: string;
  label: string;
  maxValue?: number;
  minValue?: number;
}

export default function TrendChart({ data, color, label, maxValue, minValue }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-44 rounded-xl"
        style={{ background: 'var(--cream-deep)', border: '1px solid var(--cream-deeper)' }}
      >
        <p className="text-sm" style={{ color: 'var(--muted)' }}>No data available yet</p>
      </div>
    );
  }

  const W = 600;
  const H = 180;
  const PAD = { top: 16, right: 16, bottom: 32, left: 44 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const values = data.map(d => d.value);
  const calcMin = minValue !== undefined ? minValue : Math.min(...values);
  const calcMax = maxValue !== undefined ? maxValue : Math.max(...values);
  const range = calcMax - calcMin || 1;

  const toX = (i: number) => PAD.left + (i / Math.max(data.length - 1, 1)) * chartW;
  const toY = (v: number) => PAD.top + chartH - ((v - calcMin) / range) * chartH;

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(d.value)}`).join(' ');

  // Area fill path
  const areaPath = [
    `M ${toX(0)} ${toY(data[0].value)}`,
    ...data.slice(1).map((d, i) => `L ${toX(i + 1)} ${toY(d.value)}`),
    `L ${toX(data.length - 1)} ${PAD.top + chartH}`,
    `L ${toX(0)} ${PAD.top + chartH}`,
    'Z',
  ].join(' ');

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  // Format date labels
  const labelIndices = data.length <= 5
    ? data.map((_, i) => i)
    : [0, Math.floor(data.length / 2), data.length - 1];

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="w-full">
      <svg
        width="100%"
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ maxWidth: '100%', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={`grad-${color.replace(/[^a-z0-9]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridLines.map((ratio) => {
          const y = PAD.top + chartH - ratio * chartH;
          const value = calcMin + ratio * range;
          return (
            <g key={ratio}>
              <line
                x1={PAD.left}
                y1={y}
                x2={W - PAD.right}
                y2={y}
                stroke="#E0D5C8"
                strokeWidth="1"
                strokeDasharray={ratio === 0 ? 'none' : '3 4'}
              />
              <text
                x={PAD.left - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="#A8988C"
                fontFamily="var(--font-sans)"
              >
                {value % 1 === 0 ? value.toFixed(0) : value.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path
          d={areaPath}
          fill={`url(#grad-${color.replace(/[^a-z0-9]/gi, '')})`}
        />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={toX(i)} cy={toY(d.value)} r="5" fill="white" stroke={color} strokeWidth="2" />
            <circle cx={toX(i)} cy={toY(d.value)} r="2.5" fill={color} />
          </g>
        ))}

        {/* X-axis date labels */}
        {labelIndices.map((i) => (
          <text
            key={i}
            x={toX(i)}
            y={H - 4}
            textAnchor="middle"
            fontSize="10"
            fill="#A8988C"
            fontFamily="var(--font-sans)"
          >
            {formatDate(data[i].date)}
          </text>
        ))}
      </svg>

      <p className="text-xs text-center mt-2" style={{ color: 'var(--muted)' }}>{label}</p>
    </div>
  );
}
