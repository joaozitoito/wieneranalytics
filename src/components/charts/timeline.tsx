'use client';
import { useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { number } from '@/lib/format';
type Point = {
  day: string;
  views: number | null;
  interactions: number | null;
  profileVisits: number | null;
};
const labels = {
  views: 'Visualizações',
  interactions: 'Interações',
  profileVisits: 'Visitas ao perfil',
};
export function Timeline({ points }: { points: Point[] }) {
  const [metric, setMetric] = useState<keyof typeof labels>('views');
  const hasData = points.some((p) => p[metric] != null);
  return (
    <section className="panel timeline">
      <div className="panel-header">
        <div>
          <h2>Evolução no período</h2>
          <p>Medições diárias registradas. Lacunas permanecem sem dados.</p>
        </div>
        <select
          aria-label="Métrica do gráfico"
          value={metric}
          onChange={(e) => setMetric(e.target.value as keyof typeof labels)}
        >
          {Object.entries(labels).map(([key, label]) => (
            <option value={key} key={key}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {hasData ? (
        <div
          className="chart"
          role="img"
          aria-label={`Gráfico de ${labels[metric]}. Lacunas indicam dias sem medição.`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 15, right: 12, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="blue-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#168BD2" stopOpacity={0.17} />
                  <stop offset="95%" stopColor="#168BD2" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#edf1f5" />
              <XAxis
                dataKey="day"
                tickFormatter={(v) => String(v).slice(8, 10) + '/' + String(v).slice(5, 7)}
                axisLine={false}
                tickLine={false}
                minTickGap={36}
                tick={{ fill: '#64748b', fontSize: 11 }}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip
                formatter={(value) => [
                  number(value == null ? null : Number(value)),
                  labels[metric],
                ]}
                labelFormatter={(v) => String(v).split('-').reverse().join('/')}
                contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <Area
                type="linear"
                dataKey={metric}
                stroke="#168BD2"
                strokeWidth={2.5}
                fill="url(#blue-fill)"
                connectNulls={false}
                dot={{ r: 2, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="empty-chart">
          <BarChart3 size={34} />
          <strong>A história começa com uma medição</strong>
          <p>Adicione snapshots diários ou explore o modo demonstração.</p>
        </div>
      )}
    </section>
  );
}
