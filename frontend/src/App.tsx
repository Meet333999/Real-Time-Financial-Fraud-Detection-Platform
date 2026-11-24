import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { OverviewDashboard } from './views/OverviewDashboard';
import { LiveTransactionMonitor } from './views/LiveTransactionMonitor';
import { FraudAlerts } from './views/FraudAlerts';
import { InvestigationCases } from './views/InvestigationCases';
import { GraphIntelligence } from './views/GraphIntelligence';
import { ModelPerformance } from './views/ModelPerformance';
import { DriftMonitoring } from './views/DriftMonitoring';
import { SystemMonitoring } from './views/SystemMonitoring';
import { TransactionSimulatorModal } from './components/TransactionSimulatorModal';
import { HowItWorksModal } from './components/HowItWorksModal';
import { fetchAlerts, fetchStreamingStatus } from './services/api';

export function App() {
  const [currentView, setCurrentView] = useState<string>('overview');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [alertCount, setAlertCount] = useState<number>(0);
  const [simulatorOpen, setSimulatorOpen] = useState<boolean>(false);
  const [guideOpen, setGuideOpen] = useState<boolean>(false);

  useEffect(() => {
    const updateStats = async () => {
      try {
        const [alertsRes, streamRes] = await Promise.all([
          fetchAlerts('OPEN'),
          fetchStreamingStatus()
        ]);
        setAlertCount(alertsRes.total || 0);
        setIsStreaming(Boolean(streamRes?.is_active));
      } catch (e) {
        // Fallback or silent
      }
    };
    updateStats();
    const interval = setInterval(updateStats, 4000);
    return () => clearInterval(interval);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'overview':
        return <OverviewDashboard />;
      case 'live-monitor':
        return <LiveTransactionMonitor />;
      case 'alerts':
        return <FraudAlerts />;
      case 'cases':
        return <InvestigationCases />;
      case 'graph':
        return <GraphIntelligence />;
      case 'models':
        return <ModelPerformance />;
      case 'drift':
        return <DriftMonitoring />;
      case 'system':
        return <SystemMonitoring />;
      default:
        return <OverviewDashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-[#0B0E11] text-white overflow-hidden font-sans select-none">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        alertCount={alertCount}
        onOpenGuide={() => setGuideOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar
          currentView={currentView}
          isStreaming={isStreaming}
          onStreamingToggle={setIsStreaming}
          onOpenSimulator={() => setSimulatorOpen(true)}
          onOpenGuide={() => setGuideOpen(true)}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6 bg-[#0B0E11] min-w-0">
          <div className="w-full max-w-7xl mx-auto space-y-6 min-w-0">
            {renderView()}
          </div>
        </main>
      </div>

      {/* Manual Txn Simulator Modal */}
      <TransactionSimulatorModal
        isOpen={simulatorOpen}
        onClose={() => setSimulatorOpen(false)}
        onTransactionScored={() => {}}
      />

      {/* NEW: Step-by-Step Architecture & How-It-Works Guide Modal */}
      <HowItWorksModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        onOpenSimulator={() => setSimulatorOpen(true)}
        onNavigateView={(view) => {
          setCurrentView(view);
          setGuideOpen(false);
        }}
      />
    </div>
  );
}

export default App;
