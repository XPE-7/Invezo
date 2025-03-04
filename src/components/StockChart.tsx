import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { TimeRange } from '../lib/api';
import { useEffect, useRef } from 'react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface StockChartProps {
  data: {
    labels: string[];
    actual: number[];
    predicted: (number | null)[];
  };
  isDark: boolean;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

const timeRanges: { label: string; value: TimeRange }[] = [
  { label: '1D', value: '1D' },
  { label: '1W', value: '1W' },
  { label: '1M', value: '1M' },
  { label: '3M', value: '3M' },
  { label: '1Y', value: '1Y' },
  { label: 'ALL', value: 'ALL' },
];

export function StockChart({ data, isDark, timeRange, onTimeRangeChange }: StockChartProps) {
  const chartRef = useRef<ChartJS<"line">>();

  // Cleanup chart instance on unmount
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Actual Price',
        data: data.actual,
        borderColor: 'rgb(59, 130, 246)', // Blue
        borderWidth: 2,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: 'rgb(59, 130, 246)',
        pointHoverBorderColor: isDark ? '#fff' : '#000',
        pointHoverBorderWidth: 2,
        spanGaps: true,
      },
      ...(timeRange === '1D' ? [{
        label: 'Predicted Price',
        data: data.predicted,
        borderColor: 'rgb(34, 197, 94)', // Green
        borderWidth: 2,
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderDash: [5, 5],
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: 'rgb(34, 197, 94)',
        pointHoverBorderColor: isDark ? '#fff' : '#000',
        pointHoverBorderWidth: 2,
        spanGaps: true,
      }] : []),
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDark ? '#f8fafc' : '#1f2937',
        bodyColor: isDark ? '#f8fafc' : '#1f2937',
        borderColor: isDark ? '#475569' : '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function(context: any) {
            if (context.raw === null) return null;
            return `${context.dataset.label}: $${context.raw.toFixed(2)}`;
          },
          labelTextColor: function() {
            return isDark ? '#f8fafc' : '#1f2937';
          },
        },
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
        displayColors: true,
        position: 'nearest',
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
          color: isDark ? '#94a3b8' : '#64748b',
          font: {
            size: 11,
          },
        },
        border: {
          display: false,
        },
      },
      y: {
        position: 'right',
        grid: {
          color: isDark ? 'rgba(71, 85, 105, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          callback: function(value: any) {
            return '$' + value.toFixed(2);
          },
          color: isDark ? '#94a3b8' : '#64748b',
          font: {
            size: 11,
          },
          padding: 8,
        },
        border: {
          display: false,
        },
      },
    },
    animations: {
      tension: {
        duration: 1000,
        easing: 'linear',
      },
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center space-x-2">
        {timeRanges.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => onTimeRangeChange(value)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
              timeRange === value
                ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                : 'bg-accent text-muted-foreground hover:text-card-foreground hover:bg-accent/80'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="relative w-full h-[400px] bg-card/50 rounded-xl p-4 border border-border/50">
        <Line 
          ref={chartRef as any}
          data={chartData} 
          options={options} 
        />
      </div>
    </div>
  );
}