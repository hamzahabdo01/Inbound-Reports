import { useState, useRef } from 'react';
import Sidebar from './components/Sidebar';
import InboundReports from './pages/InboundReports';
import Procurement from './pages/Procurement';
import MiscellaneousStockReport from './pages/MiscellaneousStockReport';
import ShipmentStatus from './pages/ShipmentStatus';
import ProgramDashboard from './pages/ProgramDashboard';

function Placeholder({ title }) {
  const iconMap = {
    Dashboard: 'fa-chart-pie',
    Program: 'fa-cubes',
    Location: 'fa-location-dot',
    'Item Summary': 'fa-cube',
    'Item Price': 'fa-tag',
    eRIS: 'fa-file-shield',
    AEFI: 'fa-triangle-exclamation',
    'Miscellaneous Stock Report': 'fa-boxes-stacked',
    'LC CAD Expiry': 'fa-clock',
    'Shipment Status': 'fa-truck',
    Procurement: 'fa-cart-shopping',
    RDF: 'fa-flag',
    'Facility Dashboard': 'fa-hospital',
    RRF: 'fa-clipboard-list',
    'Quarter Report': 'fa-chart-line',
    'Hub Vital Report': 'fa-heart-pulse',
    'Item Distribution': 'fa-truck-arrow-right',
    'Medical Equipment Distribution': 'fa-kit-medical',
  };

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4">
        <i className={`fa-solid ${iconMap[title] || 'fa-file'} text-2xl text-on-surface-variant`}></i>
      </div>
      <h2 className="text-headline-md text-on-surface mb-2">{title}</h2>
      <p className="text-body-md text-on-surface-variant max-w-md">
        This section is under development.
      </p>
    </div>
  );
}

function App() {
  const [activeSection, setActiveSection] = useState('Inbound Report');
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const toggleSidebar = () => setSidebarVisible(v => !v);

  const renderPage = (extraProps) => {
    switch (activeSection) {
      case 'Inbound Report':
        return <InboundReports {...extraProps} />;
      case 'Program':
        return <ProgramDashboard {...extraProps} />;
      case 'Miscellaneous Stock Report':
        return <MiscellaneousStockReport {...extraProps} />;
      case 'Procurement':
        return <Procurement {...extraProps} />;
      case 'Shipment Status':
        return <ShipmentStatus {...extraProps} />;
      default:
        return <Placeholder title={activeSection} />;
    }
  };

  return (
    <div className="min-h-screen bg-surface flex">
      <Sidebar activeSection={activeSection} onNavigate={setActiveSection} collapsed={!sidebarVisible} onToggleCollapse={toggleSidebar} />
      <main className="flex-1 overflow-auto">
        <div className="max-w-container mx-auto px-lg py-lg">
          {renderPage({ sidebarVisible, toggleSidebar })}
        </div>
      </main>
    </div>
  );
}

export default App;
