import { MetricCard } from '@/interfaces/dashboard.interface';

interface MetricsCardProps {
  metrics: MetricCard[];
  children?: React.ReactNode;
}

export default function MetricsCard({ metrics, children }: MetricsCardProps) {
  return (
    <div className="flex flex-col gap-4 py-[14px] px-5 rounded-[6px] border-gray-100 border-[1px] border-solid w-full">
      <div className="flex items-start gap-4">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className={`w-1/2 ${
              metric.color === 'lime' ? 'text-lime-500' : 'text-gray-500'
            }`}
          >
            <p className="text-md font-medium">{metric.label}</p>
            <h5 className="text-lg font-bold">{metric.value}</h5>
          </div>
        ))}
      </div>
      {children && <div className="flex w-full items-center">{children}</div>}
    </div>
  );
}
