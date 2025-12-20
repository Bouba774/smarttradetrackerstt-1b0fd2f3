import React from 'react';
import Calculator from '@/pages/Calculator';

// Calculator doesn't need user-specific data, so it's accessible directly
const AdminCalculator: React.FC = () => {
  return <Calculator />;
};

export default AdminCalculator;
