import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

export function destroyChart(chart?: Chart | null): void {
  chart?.destroy();
}

export function renderBarChart(
  canvas: HTMLCanvasElement,
  labels: string[],
  values: number[],
  options?: { label?: string; color?: string }
): Chart {
  const color = options?.color ?? 'rgba(45, 212, 191, 0.85)';

  const config: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: options?.label ?? 'Valor',
          data: values,
          backgroundColor: color,
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          ticks: { color: '#94a3b8', font: { size: 10 } },
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: { color: '#64748b', precision: 0 },
          grid: { color: 'rgba(148, 163, 184, 0.12)' },
        },
      },
    },
  };

  return new Chart(canvas, config);
}
