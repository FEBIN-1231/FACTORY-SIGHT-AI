import React, { useRef, useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
} from 'recharts';

export const LineChart = ({
  data = [],
  xKey = 'time',
  yKey = 'vibration',
  color = '#FE4B4A', // Vibrant Brand Red accent
  height = 260,
  unit = '',
  showArea = true,
}) => {
  const [animateInitial, setAnimateInitial] = useState(true);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    // Disable animation after first mount to avoid chart jitter on high-frequency polling
    const timer = setTimeout(() => {
      setAnimateInitial(false);
      hasMountedRef.current = true;
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center border border-dashed border-slate-700/60 rounded-xl text-xs text-slate-500 font-mono"
      >
        Awaiting live telemetry stream data...
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        {showArea ? (
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${yKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} opacity={0.6} />
            <XAxis
              dataKey={xKey}
              stroke="var(--text-muted)"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: 'var(--border-subtle)' }}
              fontFamily="JetBrains Mono"
            />
            <YAxis
              stroke="var(--text-muted)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              fontFamily="JetBrains Mono"
              tickFormatter={(val) => `${val}${unit ? ` ${unit}` : ''}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                fontSize: '12px',
                fontFamily: 'JetBrains Mono',
                color: 'var(--text-primary)',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
              }}
              formatter={(val) => [`${val} ${unit}`, yKey]}
            />
            <Area
              type="monotone"
              dataKey={yKey}
              stroke={color}
              strokeWidth={2.5}
              fillOpacity={1}
              fill={`url(#grad-${yKey})`}
              isAnimationActive={animateInitial}
              animationDuration={500}
              animationEasing="ease-out"
            />
          </AreaChart>
        ) : (
          <RechartsLineChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} opacity={0.6} />
            <XAxis
              dataKey={xKey}
              stroke="var(--text-muted)"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: 'var(--border-subtle)' }}
              fontFamily="JetBrains Mono"
            />
            <YAxis
              stroke="var(--text-muted)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              fontFamily="JetBrains Mono"
              tickFormatter={(val) => `${val}${unit ? ` ${unit}` : ''}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                fontSize: '12px',
                fontFamily: 'JetBrains Mono',
                color: 'var(--text-primary)',
              }}
            />
            <Line
              type="monotone"
              dataKey={yKey}
              stroke={color}
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={animateInitial}
              animationDuration={500}
              animationEasing="ease-out"
            />
          </RechartsLineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default LineChart;
