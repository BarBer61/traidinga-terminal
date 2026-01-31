// frontend/components/Header.tsx

import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="flex-shrink-0 p-4 bg-zinc-900/60 border-b border-zinc-800">
      <h1 className="text-lg font-bold text-white">Trading Terminal</h1>
    </header>
  );
};

export default Header;
