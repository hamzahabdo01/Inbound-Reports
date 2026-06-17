// ─── Clinical Chemistry — dummy data ─────────────────────────────────────────
// All values are illustrative. Replace with real CSV imports when data is ready.

export const CC_PRODUCTS = [
  'Alp', 'Id-D', 'Bil-T', 'Calcium/G\'dng', 'Calibrator', 'Clds',
  'Cont-N', 'Cont-P', 'Crea(250m)', 'Gluc', 'Total Protein', 'Urea',
];

// Stock Status National
export const ccStockRows = [
  { ProductCN: 'Alp',          SS: 'Stocked Out', SOH: 0,  AMC: 12,  MOS: 0,   QuantityPurchaseOrder: 0,   GIT: 0,  Min: 72,   Max: 156  },
  { ProductCN: 'Id-D',         SS: 'Stocked Out', SOH: 0,  AMC: 8,   MOS: 0,   QuantityPurchaseOrder: 0,   GIT: 0,  Min: 48,   Max: 104  },
  { ProductCN: 'Bil-T',        SS: 'Stocked Out', SOH: 0,  AMC: 15,  MOS: 0,   QuantityPurchaseOrder: 0,   GIT: 0,  Min: 90,   Max: 195  },
  { ProductCN: 'Calcium/G\'dng', SS: 'Stocked Out', SOH: 0, AMC: 10, MOS: 0,   QuantityPurchaseOrder: 0,   GIT: 0,  Min: 60,   Max: 130  },
  { ProductCN: 'Calibrator',   SS: 'Stocked Out', SOH: 0,  AMC: 6,   MOS: 0,   QuantityPurchaseOrder: 0,   GIT: 0,  Min: 36,   Max: 78   },
  { ProductCN: 'Clds',         SS: 'Stocked Out', SOH: 0,  AMC: 20,  MOS: 0,   QuantityPurchaseOrder: 0,   GIT: 0,  Min: 120,  Max: 260  },
  { ProductCN: 'Cont-N',       SS: 'Stocked Out', SOH: 0,  AMC: 9,   MOS: 0,   QuantityPurchaseOrder: 0,   GIT: 0,  Min: 54,   Max: 117  },
  { ProductCN: 'Cont-P',       SS: 'Stocked Out', SOH: 0,  AMC: 9,   MOS: 0,   QuantityPurchaseOrder: 0,   GIT: 0,  Min: 54,   Max: 117  },
  { ProductCN: 'Crea(250m)',   SS: 'Stocked Out', SOH: 0,  AMC: 14,  MOS: 0,   QuantityPurchaseOrder: 0,   GIT: 0,  Min: 84,   Max: 182  },
  { ProductCN: 'Gluc',         SS: 'Stocked Out', SOH: 0,  AMC: 25,  MOS: 0,   QuantityPurchaseOrder: 0,   GIT: 0,  Min: 150,  Max: 325  },
  { ProductCN: 'Total Protein', SS: 'Stocked Out', SOH: 0, AMC: 11,  MOS: 0,   QuantityPurchaseOrder: 0,   GIT: 0,  Min: 66,   Max: 143  },
  { ProductCN: 'Urea',         SS: 'Stocked Out', SOH: 0,  AMC: 18,  MOS: 0,   QuantityPurchaseOrder: 0,   GIT: 0,  Min: 108,  Max: 234  },
];

// Hub breakdown (SOH per hub per product)
export const CC_HUB_PRODUCTS = ['Alp', 'Bil-T', 'Calibrator', 'Clds', 'Crea(250m)', 'Gluc'];

export const ccHubRows = [
  { Site: 'Adama Hub',        'Alp': 0, 'Bil-T': 0, 'Calibrator': 0, 'Clds': 0, 'Crea(250m)': 0, 'Gluc': 0 },
  { Site: 'Bahir Dar Hub',    'Alp': 0, 'Bil-T': 0, 'Calibrator': 0, 'Clds': 0, 'Crea(250m)': 0, 'Gluc': 0 },
  { Site: 'Home Office',      'Alp': 0, 'Bil-T': 0, 'Calibrator': 0, 'Clds': 0, 'Crea(250m)': 0, 'Gluc': 0 },
  { Site: 'Dessie Hub',       'Alp': 0, 'Bil-T': 0, 'Calibrator': 0, 'Clds': 0, 'Crea(250m)': 0, 'Gluc': 0 },
  { Site: 'Dire Dawa Hub',    'Alp': 0, 'Bil-T': 0, 'Calibrator': 0, 'Clds': 0, 'Crea(250m)': 0, 'Gluc': 0 },
  { Site: 'Gondar Hub',       'Alp': 0, 'Bil-T': 0, 'Calibrator': 0, 'Clds': 0, 'Crea(250m)': 0, 'Gluc': 0 },
  { Site: 'Addis Ababa Hub',  'Alp': 0, 'Bil-T': 0, 'Calibrator': 0, 'Clds': 0, 'Crea(250m)': 0, 'Gluc': 0 },
  { Site: 'Hawassa Hub',      'Alp': 0, 'Bil-T': 0, 'Calibrator': 0, 'Clds': 0, 'Crea(250m)': 0, 'Gluc': 0 },
  { Site: 'Jimma Hub',        'Alp': 0, 'Bil-T': 0, 'Calibrator': 0, 'Clds': 0, 'Crea(250m)': 0, 'Gluc': 0 },
  { Site: 'Mekele Hub',       'Alp': 0, 'Bil-T': 0, 'Calibrator': 0, 'Clds': 0, 'Crea(250m)': 0, 'Gluc': 0 },
];

// Procurement agents (PO lines per product per donor)
export const ccProcurementByAgent = [
  { label: 'Alp',         segments: [{ label: 'EPSS', value: 2 }, { label: 'MOH', value: 1 }] },
  { label: 'Bil-T',       segments: [{ label: 'EPSS', value: 3 }] },
  { label: 'Calibrator',  segments: [{ label: 'MOH',  value: 2 }] },
  { label: 'Clds',        segments: [{ label: 'EPSS', value: 1 }, { label: 'SDG', value: 1 }] },
  { label: 'Crea(250m)',  segments: [{ label: 'EPSS', value: 2 }] },
  { label: 'Gluc',        segments: [{ label: 'EPSS', value: 4 }, { label: 'MOH', value: 2 }] },
  { label: 'Urea',        segments: [{ label: 'SDG',  value: 1 }] },
  { label: 'Total Protein', segments: [{ label: 'MOH', value: 1 }] },
];

// Procurement agents pie
export const ccDonorChart = [
  { label: 'EPSSDEF', value: 12 },
  { label: 'MOHFUND', value: 6 },
  { label: 'SDGFUND', value: 2 },
];

// Funding source pie
export const ccFundingChart = [
  { label: 'EPSS',    value: 12 },
  { label: 'MOH',     value: 6  },
  { label: 'SDG',     value: 2  },
];

// Distribution by facility type (stacked)
export const ccFacilityDistribution = [
  { label: 'Alp',      segments: [{ label: 'Hospital', value: 120 }, { label: 'Health Center', value: 80 }, { label: 'Others', value: 30 }] },
  { label: 'Bil-T',    segments: [{ label: 'Hospital', value: 200 }, { label: 'Health Center', value: 150 }] },
  { label: 'Calibrator', segments: [{ label: 'Hospital', value: 50 }, { label: 'Health Center', value: 50 }] },
  { label: 'Clds',     segments: [{ label: 'Hospital', value: 90 }, { label: 'Health Center', value: 60 }, { label: 'Others', value: 20 }] },
  { label: 'Crea(250m)', segments: [{ label: 'Hospital', value: 180 }, { label: 'Health Center', value: 100 }] },
  { label: 'Gluc',     segments: [{ label: 'Hospital', value: 300 }, { label: 'Health Center', value: 220 }, { label: 'Others', value: 80 }] },
];

// Distribution by facility type pie
export const ccFacilityTypePie = [
  { label: 'Hospital',      value: 940 },
  { label: 'Health Center', value: 660 },
  { label: 'Others',        value: 130 },
];

// Distribution by ownership type (stacked)
export const ccOwnershipDistribution = [
  { label: 'Alp',        segments: [{ label: 'Ordered', value: 230 }, { label: 'Private', value: 80  }] },
  { label: 'Bil-T',      segments: [{ label: 'Ordered', value: 350 }, { label: 'Private', value: 120 }] },
  { label: 'Calibrator', segments: [{ label: 'Ordered', value: 100 }, { label: 'Public',  value: 50  }] },
  { label: 'Clds',       segments: [{ label: 'Ordered', value: 170 }, { label: 'Private', value: 60  }] },
  { label: 'Crea(250m)', segments: [{ label: 'Ordered', value: 280 }, { label: 'Public',  value: 100 }] },
  { label: 'Gluc',       segments: [{ label: 'Ordered', value: 600 }, { label: 'Private', value: 200 }, { label: 'Public', value: 100 }] },
];

// Distribution by ownership pie
export const ccOwnershipPie = [
  { label: 'Ordered', value: 1730 },
  { label: 'Private', value: 460  },
  { label: 'Public',  value: 250  },
];

// Pipeline incoming shipment (stacked by donor)
export const ccPipelineByDonor = [
  { label: 'Alp',        segments: [{ label: 'EPSS', value: 500  }, { label: 'MOH', value: 200  }] },
  { label: 'Bil-T',      segments: [{ label: 'EPSS', value: 800  }] },
  { label: 'Calibrator', segments: [{ label: 'MOH',  value: 300  }] },
  { label: 'Clds',       segments: [{ label: 'EPSS', value: 400  }, { label: 'SDG', value: 150  }] },
  { label: 'Crea(250m)', segments: [{ label: 'EPSS', value: 700  }] },
  { label: 'Gluc',       segments: [{ label: 'EPSS', value: 1200 }, { label: 'MOH', value: 400  }] },
];

// Pipeline by item (bar)
export const ccPipelineByItem = [
  { label: 'Alp',          value: 700  },
  { label: 'Bil-T',        value: 800  },
  { label: 'Calibrator',   value: 300  },
  { label: 'Clds',         value: 550  },
  { label: 'Crea(250m)',   value: 700  },
  { label: 'Gluc',         value: 1600 },
  { label: 'Urea',         value: 400  },
  { label: 'Total Protein', value: 250 },
];

// Stock utilization (SOH vs gap to max)
export const ccStockUtilization = CC_PRODUCTS.map((p) => ({
  label: p,
  segments: [
    { label: 'SOH',        value: 0   },
    { label: 'Gap to max', value: 100 },
  ],
}));

// MOS chart
export const ccMosChart = CC_PRODUCTS.map((p) => ({
  label: p,
  value: 0,
  color: '#BA1A1A',
}));

// Issued items dummy rows
const HUBS = ['Adama Hub', 'Bahir Dar Hub', 'Addis Ababa Hub', 'Hawassa Hub', 'Jimma Hub'];
const ITEMS_LIST = ['Alp', 'Bil-T', 'Calibrator', 'Clds', 'Crea(250m)', 'Gluc'];
const REGIONS = ['Oromia-East Hararghe-Haramaya', 'Amhara-South Wollo-Dessie', 'SNNP-Sidama-Hawassa', 'Tigray-Central-Mekele'];

export const ccIssuedRows = Array.from({ length: 24 }, (_, i) => ({
  id: `cc-issued-${i}`,
  flowType: i % 2 === 0 ? 'Center to Hub' : 'Hub to Facility',
  item: ITEMS_LIST[i % ITEMS_LIST.length],
  hub: HUBS[i % HUBS.length],
  quantity: (i + 1) * 120,
  invoice: `INV-CC-2026-${String(i + 1).padStart(3, '0')}`,
  date: `2026-0${(i % 6) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
  region: REGIONS[i % REGIONS.length],
  amount: (i + 1) * 4800,
}));

// Manufacturer table
export const ccManufacturers = [
  { label: 'Randox Laboratories',  value: 0, share: '0%' },
  { label: 'Biosystems S.A.',       value: 0, share: '0%' },
  { label: 'Erba Mannheim',         value: 0, share: '0%' },
  { label: 'Audit Diagnostics',     value: 0, share: '0%' },
];

// Supplier table
export const ccSuppliers = [
  { label: 'MedTech Ethiopia',  value: 0, share: '0%' },
  { label: 'DiagnoSupply Ltd',  value: 0, share: '0%' },
  { label: 'Lab Equip Africa',  value: 0, share: '0%' },
];

// Country table
export const ccCountries = [
  { label: 'Ireland',    value: 0, share: '0%' },
  { label: 'Spain',      value: 0, share: '0%' },
  { label: 'Germany',    value: 0, share: '0%' },
  { label: 'UK',         value: 0, share: '0%' },
];
