import React from 'react';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import VitalsDashboard from './components/VitalsDashboard';
import RemindersModule from './components/RemindersModule';
import WellnessModule from './components/WellnessModule';
import DonationModule from './components/DonationModule';

export default function App() {
  return (
    <AuthProvider>
      <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
        <Navbar />
        <div style={{ maxWidth: '1100px', margin: '24px auto', padding: '0 16px' }}>
          <VitalsDashboard />
          <RemindersModule />
          <WellnessModule />
          <DonationModule />
        </div>
      </div>
    </AuthProvider>
  );
}