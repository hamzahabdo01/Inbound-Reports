import { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import MobileHeader from './components/MobileHeader';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import InboundReports from './pages/InboundReports';
import Procurement from './pages/Procurement';
import MiscellaneousStockReport from './pages/MiscellaneousStockReport';
import ShipmentStatus from './pages/ShipmentStatus';
import PerformanceAndLeadtime from './pages/PerformanceAndLeadtime';
import ProgramDashboard from './pages/ProgramDashboard';

function Placeholder({ title }: any) {
  const iconMap = {
    Dashboard: 'fa-chart-pie',
    Program: 'fa-cubes',
    Location: 'fa-location-dot',
    'Item Summary': 'fa-cube',
    'Item Price': 'fa-tag',
    eRIS: 'fa-file-shield',
    AEFI: 'fa-triangle-exclamation',
    'Miscellaneous Stock Report': 'fa-boxes-stacked',
    'Shipment Status': 'fa-truck',
    Procurement: 'fa-cart-shopping',
    'Performance and Leadtime': 'fa-chart-bar',
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

function AppContent() {
  const { loggedIn, validating, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('Program');
  const [sidebarVisible, setSidebarVisible] = useState(() => window.innerWidth >= 1280);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const mainRef = useRef(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [activeSection]);

  useEffect(() => {
    let frameId: number;
    const onResize = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        const mobile = window.innerWidth < 768;
        setIsMobile(mobile);
        if (!mobile && window.innerWidth < 1280) setSidebarVisible(false);
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobile && sidebarVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, sidebarVisible]);

  if (validating) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-body-sm text-on-surface-variant">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!loggedIn) {
    return <Login />;
  }

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
      case 'Performance and Leadtime':
        return <PerformanceAndLeadtime {...extraProps} />;
      default:
        return <Placeholder title={activeSection} />;
    }
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {isMobile ? (
        <div className="overflow-clip w-full">
          <Sidebar activeSection={activeSection} onNavigate={setActiveSection} collapsed={!sidebarVisible} onToggleCollapse={toggleSidebar} onLogout={logout} isMobile onClose={() => setSidebarVisible(false)} />
          <div className="flex-1 flex flex-col min-h-screen min-w-0">
            <MobileHeader onToggleSidebar={toggleSidebar} />
            <main ref={mainRef} className="flex-1 max-h-screen overflow-auto pt-[56px]" style={{ scrollbarGutter: 'stable' }}>
              <div className="max-w-container mx-auto px-lg pb-lg">
                {renderPage({ sidebarVisible, toggleSidebar })}
              </div>
            </main>
          </div>
        </div>
      ) : (
        <>
          <Sidebar activeSection={activeSection} onNavigate={setActiveSection} collapsed={!sidebarVisible} onToggleCollapse={toggleSidebar} onLogout={logout} />
          <main ref={mainRef} className="flex-1 max-h-screen overflow-auto" style={{ scrollbarGutter: 'stable' }}>
            <div className="max-w-container mx-auto px-lg pb-lg">
              {renderPage({ sidebarVisible, toggleSidebar })}
            </div>
          </main>
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
