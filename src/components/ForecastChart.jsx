import React from 'react';

function ForecastChart({ points, width = 480, height = 200 }) {
  if (!points.length) {
    return <p className="empty">ยังไม่มีข้อมูลพอสำหรับกราฟ</p>;
  }

  const padding = 30;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const path = points
    .map((point, index) => {
      const x = padding + (index / (points.length - 1 || 1)) * (width - padding * 2);
      const y = height - padding - ((point.value - min) / range) * (height - padding * 2);
      return `${index === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');

  return (
    <div className="forecast-chart">
      <svg width={width} height={height}>
        <path d={path} fill="none" stroke="#007bff" strokeWidth="3" strokeLinecap="round" />
        {points.map((point, index) => {
          const x = padding + (index / (points.length - 1 || 1)) * (width - padding * 2);
          const y = height - padding - ((point.value - min) / range) * (height - padding * 2);
          return <circle key={point.label} cx={x} cy={y} r={4} fill="#00c2ff" />;
        })}
      </svg>
      <div className="forecast-labels">
        {points.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
    </div>
  );
}

export default ForecastChart;
