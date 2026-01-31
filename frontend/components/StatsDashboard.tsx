import React, { useState, useEffect } from 'react';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';

// Простейшие тестовые данные. Никаких вычислений.
const testData = [
  { name: 'A', value: 100 },
  { name: 'B', value: 300 },
  { name: 'C', value: 200 },
  { name: 'D', value: 450 },
  { name: 'E', value: 250 },
];

const StatsDashboard: React.FC = () => {
  // Мы все еще используем отложенный рендеринг, это важно.
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Если это первый рендер, показываем пустой блок.
  if (!isClient) {
    return <div className="h-full w-full bg-zinc-900 rounded-lg"></div>;
  }

  // На втором рендере показываем наш супер-простой график.
  return (
    <div className="h-full w-full bg-zinc-900 p-4 rounded-lg">
      <h3 className="text-white font-bold mb-4">Тестовый график</h3>
      <ResponsiveContainer width="100%" height="80%">
        <AreaChart data={testData}>
          <Tooltip />
          <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatsDashboard;
