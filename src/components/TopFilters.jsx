import Dropdown from './Dropdown';

const TopFilters = ({ filters, onFilterChange }) => {
  const { invoiceType, donor, procurer } = filters;

  // Filter options
  const INVOICE_TYPE_OPTIONS = ['By Air', 'By Sea'];
  
  const DONOR_OPTIONS = [
    'RDF',
    'SDG',
    'MOH',
    'Ministry of Finance',
    'Susan Thompson Buffett Foundation',
    'Global Fund'
  ];
  
  const PROCURER_OPTIONS = [
    'EPSS',
    'MOH'
  ];

  return (
    <div className="mb-6 flex items-center gap-4 justify-end">
      <Dropdown
        label="Invoice Type"
        placeholder="-- Invoice Type... --"
        options={INVOICE_TYPE_OPTIONS}
        value={invoiceType}
        onChange={(value) => onFilterChange('invoiceType', value)}
      />
      
      <Dropdown
        label="Donor"
        placeholder="-- Donor --"
        options={DONOR_OPTIONS}
        value={donor}
        onChange={(value) => onFilterChange('donor', value)}
      />
      
      <Dropdown
        label="Procurer"
        placeholder="-- Procurer --"
        options={PROCURER_OPTIONS}
        value={procurer}
        onChange={(value) => onFilterChange('procurer', value)}
      />
    </div>
  );
};

export default TopFilters;
