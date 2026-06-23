/**
 * Registry containing metadata for all tables in the application.
 * Each entry contains:
 * - title: Human-readable name of the table
 * - description: A short description of what the table shows
 * - purpose: Detailed bullet points on why this table exists and what business decisions it drives
 * - period: The reporting time range and update frequency
 * - assumptions: List of assumptions and limitations regarding the data
 * - example: An interactive mockup representation of a single row, specifying column descriptions
 */
export const TABLE_METADATA = {
  'shipment-dwelling-time': {
    title: 'Shipment Dwelling Time',
    description: 'Tracks the duration (in days) that shipments remain at port post-arrival before clearance and delivery.',
    purpose: [
      'Monitor port clearance delays and bottlenecks.',
      'Evaluate efficiency of shipment officers in resolving issues.',
      'Prevent high demurrage fees by flagging shipments over 90 days.'
    ],
    period: 'Updated daily, displaying current active records from fiscal year 2024.',
    assumptions: [
      'Assumes port arrival dates are logged accurately by terminal operators.',
      'Dwelling time calculations do not exclude weekends or official port holidays.',
      'Empty Shipment Officer fields represent unassigned shipments requiring manual routing.'
    ],
    example: {
      columns: {
        'PO Number': { value: 'PO-2024-089', desc: 'Unique Purchase Order identifier' },
        'Item & Details': { value: 'Amoxicillin 250mg Suspension (5,555 Units)', desc: 'Product description and quantity' },
        'Way Bill No': { value: 'WB-99128', desc: 'Ocean freight or air waybill tracking number' },
        'Shipment Officer': { value: 'Birhanu Tesfaye', desc: 'Logistics coordinator assigned to clear this shipment' },
        'Port Arrival': { value: 'May 11th, 2024', desc: 'Date when the vessel docked at the port of entry' },
        'Dwelling Time': { value: '102 days', desc: 'Elapsed days since arrival; >90 days is flagged as Critical (Red)' }
      }
    }
  },
  'purchase-order-follow-up': {
    title: 'Purchase Order Follow-Up',
    description: 'Tracks the workflow of pipeline purchase orders from pre-tender preparation up to final customs clearance.',
    purpose: [
      'Provides supply chain managers visibility into procurement stages.',
      'Identifies stalls in LC CAD, bid preparation, or EFDA approval phases.',
      'Forecasts incoming supply arrivals based on current milestones.'
    ],
    period: 'Refreshed weekly. Data covers active procurement contracts currently in the pipeline.',
    assumptions: [
      'Milestone statuses are pulled from the EPSS ERP system and rely on coordinator input.',
      'Estimated lead times are subject to carrier schedules and customs clearance fluctuations.'
    ],
    example: {
      columns: {
        'Item Name': { value: 'Paracetamol 500mg Tablets', desc: 'Standard generic medicine description' },
        'Activity': { value: 'MOH Procurement Program', desc: 'The specific program/funding scheme this PO belongs to' },
        'PO Number': { value: 'PO-MOH-2024-04', desc: 'Approved purchase order code' },
        'Req. Qty': { value: '1,200,000 packs', desc: 'Quantity initially requested by the health bureau' },
        'PO Qty': { value: '1,000,000 packs', desc: 'Final quantity approved in the purchase order' },
        'Status': { value: 'OnLCProcess', desc: 'Current workflow stage; indicates the Letter of Credit is being processed' }
      }
    }
  },
  'main-stock-report': {
    title: 'National Stock & Hub Distribution',
    description: 'Consolidated national stock status (SOH, MOS) and regional hub inventory allocation breakdown.',
    purpose: [
      'Identify inventory imbalances or shortages across the country.',
      'Coordinate inter-hub transfers to resolve localized stockouts.',
      'Track stock levels against minimum/maximum thresholds.'
    ],
    period: 'Weekly inventory count aggregation across central and regional warehouses.',
    assumptions: [
      'Stock quantities represent physical counts at hubs; transit stock is excluded.',
      'Average Monthly Consumption (AMC) is calculated using historical data from the previous 12 months.'
    ],
    example: {
      columns: {
        'Item Description': { value: 'Metformin 500mg Tablets', desc: 'Product name and dosage formulation' },
        'National SOH': { value: '8,500,000 tabs', desc: 'Total physical Stock on Hand nationally' },
        'National MOS': { value: '4.2 Months', desc: 'Months of Stock on Hand relative to average consumption' },
        'Status': { value: 'Adequate', desc: 'Stock level indicator (Out of Stock, Understocked, Adequate, Overstocked)' },
        'Adama Hub SOH': { value: '1,200,000 tabs', desc: 'Stock quantity held at the Adama regional hub' }
      }
    }
  },
  'national-amc-report': {
    title: 'Average Monthly Consumption (AMC) Baseline',
    description: 'Displays the baseline Average Monthly Consumption (AMC) values for national medical supplies.',
    purpose: [
      'Establishes the consumption rate used to compute Months of Stock (MOS).',
      'Acts as a fundamental baseline for national procurement planning and allocation formulas.'
    ],
    period: 'Recomputed annually or semi-annually based on 12-month issuance reports.',
    assumptions: [
      'Assumes baseline consumption remains steady; does not account for sudden outbreak peaks.',
      'Under-reporting from rural clinics can artificially lower national AMC estimates.'
    ],
    example: {
      columns: {
        'SN': { value: '12', desc: 'Sequence number in the national registry' },
        'Item Name': { value: 'Artemether-Lumefantrine 20/120mg (Co-artem)', desc: 'Antimalarial drug formulation' },
        'Unit': { value: 'Box of 30 tabs', desc: 'Dispensing unit of measure' },
        'National AMC': { value: '15,400 boxes', desc: 'Average monthly quantity issued/consumed nationally' }
      }
    }
  },
  'procurement-tender-process': {
    title: 'Tender Stage Tracking',
    description: 'Monitors the administrative progress of public procurement tenders across 8 key stages.',
    purpose: [
      'Track administrative lead-times of procurements before supplier awards.',
      'Identify stages where tenders are stalled (e.g., technical evaluation or board approval).'
    ],
    period: 'Updated in real-time by the procurement department.',
    assumptions: [
      'Stages 1-8 refer to EPSS standardized procurement milestones.',
      'Target deadlines do not account for administrative extensions or bidder disputes.'
    ],
    example: {
      columns: {
        'Tender No': { value: 'TND-EPSS-2024-032', desc: 'Unique procurement tender reference' },
        'Stage 1 (Prep)': { value: 'Completed', desc: 'Status of bid document preparation' },
        'Stage 4 (Tech Eval)': { value: 'In Progress (12d)', desc: 'Tender is under technical review for 12 days' },
        'Days Consumed': { value: '45 days', desc: 'Total elapsed calendar days since tender initiation' },
        'Days Remaining': { value: '15 days', desc: 'Days left until target award date' }
      }
    }
  },
  'procurement-contract-process': {
    title: 'Contract Process Pipeline',
    description: 'Monitors purchase contracts post-award up to warehouse delivery, focusing on supplier milestones.',
    purpose: [
      'Evaluate supplier execution and contract compliance.',
      'Track security deposit bonds and payment processing times.'
    ],
    period: 'Weekly updates from the contract management team.',
    assumptions: [
      'Relies on external bank updates for Letter of Credit (LC) notifications.',
      'Excludes supplier-side manufacturing delays not reported to EPSS.'
    ],
    example: {
      columns: {
        'Contract No': { value: 'CTR-PH-2024-001', desc: 'Signed supplier contract reference' },
        'Supplier': { value: 'AstraZeneca PLC', desc: 'Awarded pharmaceutical manufacturer' },
        'Value': { value: '$2,500,000', desc: 'Total monetary value of the contract in USD' },
        'LC Opened': { value: 'Yes (May 10)', desc: 'Milestone showing LC activation date' },
        'Bond Status': { value: 'Deposited', desc: 'Performance bond status (10% contract value)' }
      }
    }
  },
  'shipment-status-epss': {
    title: 'Shipment Tracking',
    description: 'Monitors transit, port customs status, and warehouse reception status of incoming freight.',
    purpose: [
      'Provide logistics coordinators arrival timelines to schedule transport.',
      'Flag custom documentation delays before demurrage charges accumulate.'
    ],
    period: 'Hourly synchronization with maritime shipping lines and port portals.',
    assumptions: [
      'Vessel tracking matches carrier feeds and is subject to weather delays.',
      'GRNF completion percentage relies on warehouse intake scans.'
    ],
    example: {
      columns: {
        'PO Number': { value: 'PO-2024-102', desc: 'Associated Purchase Order identifier' },
        'Invoice Number': { value: 'INV-449102', desc: 'Supplier shipping invoice number' },
        'Carrier': { value: 'Maersk Line', desc: 'Ocean cargo carrier name' },
        'Customs Status': { value: 'Under Clearance', desc: 'Clearance milestone at Djibouti port' },
        'GRNF Status': { value: '92% Completed', desc: 'Percent of received goods verified at the central warehouse' }
      }
    }
  },
  'po-detail-report': {
    title: 'Purchase Order Detail Report',
    description: 'Granular line-item audit of purchase contracts, pricing, and packaging details.',
    purpose: [
      'Audit shipment contents against the original purchase contract.',
      'Verify unit pricing and manufacturer compliance during receiving.'
    ],
    period: 'Specific to the selected shipment cargo under review.',
    assumptions: [
      'Prices are locked in the native contract currency; conversion rates are fixed.'
    ],
    example: {
      columns: {
        'Item Description': { value: 'Disposable Syringes 5ml with Needle', desc: 'Medical consumable description' },
        'Manufacturer': { value: 'SinoMed Co. Ltd', desc: 'Approved manufacturing entity' },
        'Unit Price': { value: '$0.045', desc: 'Contracted price per unit packaging' },
        'Total Amount': { value: '$4,500.00', desc: 'Line item total value (Qty x Unit Price)' },
        'Funding Source': { value: 'Global Fund', desc: 'International donor funding this procurement' }
      }
    }
  },
  'program-hub-heatmap': {
    title: 'Regional Hub Stock Distribution Heatmap',
    description: 'Inventory quantities and Months of Stock (MOS) matrix mapped across 21 regional distribution hubs.',
    purpose: [
      'Enable rapid visual spot-checks of geographic stock imbalances.',
      'Decide whether to redirect incoming port shipments directly to regional hubs.'
    ],
    period: 'Daily warehouse inventory snapshots.',
    assumptions: [
      'Excludes stocks currently in transit between the central depot and hubs.'
    ],
    example: {
      columns: {
        'Hub Location': { value: 'Hawassa regional hub', desc: 'Regional EPSS warehouse' },
        'SOH': { value: '45,000 kits', desc: 'Stock on Hand currently physically present in the warehouse' },
        'MOS': { value: '1.8 Months', desc: 'Months of Stock available; <3.0 is highlighted as Understocked (Orange)' }
      }
    }
  },
  'program-issued-items': {
    title: 'Central Stock Issuance Log',
    description: 'Chronological log of medical inventory issued from the central EPSS warehouse to regional health bureaus.',
    purpose: [
      'Verify allocations comply with national program distribution guidelines.',
      'Audit dispatch notes against hub receipt vouchers.'
    ],
    period: 'Daily log of central warehouse dispatch events.',
    assumptions: [
      'Represents issued stock from central storage, not actual consumption by patients at the clinic level.'
    ],
    example: {
      columns: {
        'Issue Date': { value: 'June 18, 2024', desc: 'Date goods left the central warehouse gate' },
        'Recipient': { value: 'Amhara Regional Health Bureau', desc: 'Government recipient health board' },
        'Item description': { value: 'Measles Vaccine Vials (10-dose)', desc: 'Supplied commodity generic name' },
        'Qty Issued': { value: '15,000 vials', desc: 'Number of units dispatched' }
      }
    }
  },
  'program-national-stock': {
    title: 'National Program Stock Status Summary',
    description: 'Aggregated national stock levels (SOH, AMC, MOS) and stock status categorization for program commodities.',
    purpose: [
      'High-level overview for donor reporting and program managers.',
      'Track national supply security and alert on impending national stockouts.'
    ],
    period: 'Weekly stock status recalculation.',
    assumptions: [
      'Aggregated nationally; localized stockouts at remote hubs may be masked by high inventory at central levels.'
    ],
    example: {
      columns: {
        'Product CN': { value: 'RDT Malaria Kits (100s)', desc: 'Malaria Rapid Diagnostic Test pack' },
        'National SOH': { value: '25,000 packs', desc: 'Aggregated national physical stock' },
        'National MOS': { value: '8.4 Months', desc: 'Overstocked status indicator (>6.0 MOS)' },
        'SS Status': { value: 'Excess', desc: 'Stock status category (Stocked Out, Understocked, Normal, Excess)' }
      }
    }
  },
  'program-mini-table': {
    title: 'Program Detail Breakdown',
    description: 'Context-specific item details, batch numbers, and expiry trackers.',
    purpose: [
      'Drill down into specific item details without leaving the main dashboard view.',
      'Review expiry profiles of stocks to apply First-Expiry, First-Out (FEFO) rules.'
    ],
    period: 'Dynamic query from active page states.',
    assumptions: [
      'Limited to items matching the selected filters.'
    ],
    example: {
      columns: {
        'Batch No': { value: 'BAT-2024-X88', desc: 'Manufacturer batch or lot number' },
        'Expiry Date': { value: 'Dec 2025', desc: 'Date when the batch will expire and must be discarded' },
        'Quantity': { value: '5,000 boxes', desc: 'Stock volume remaining in this specific batch' }
      }
    }
  },
  'program-purchase-order': {
    title: 'Program Procurement Pipeline',
    description: 'Program-specific incoming purchase orders, shipment progress, and expected warehouse arrival dates.',
    purpose: [
      'Plan distributions by matching upcoming shipments with regional gap forecasts.',
      'Chase outstanding supplier shipments that exceed lead time targets.'
    ],
    period: 'Weekly pipeline milestone updates.',
    assumptions: [
      'Estimated Arrival Dates (ETA) are subject to shipping liner revisions.'
    ],
    example: {
      columns: {
        'PO Number': { value: 'PO-MAL-2024-002', desc: 'Malaria Program purchase order' },
        'Order Qty': { value: '500,000 nets', desc: 'Total ordered quantity of bednets' },
        'Delivered Qty': { value: '300,000 nets', desc: 'Quantity already received and GRVed at warehouse' },
        'Pending Qty': { value: '200,000 nets', desc: 'Nets still in transit or production' }
      }
    }
  },
  'program-recent-receives': {
    title: 'Warehouse Goods Receiving Report',
    description: 'Log of recently completed inventory receptions at the central warehouse, confirming supply arrivals.',
    purpose: [
      'Document newly arrived supplies for stock allocation release.',
      'Verify warehouse team efficiency in cataloging inbound freight.'
    ],
    period: 'Rolling 30-day receiving history.',
    assumptions: [
      'Includes only items that have successfully passed physical inspection and cataloging.'
    ],
    example: {
      columns: {
        'GRN Number': { value: 'GRN-2024-0988', desc: 'Goods Receipt Note code' },
        'Receive Date': { value: 'June 22, 2024', desc: 'Date inventory was logged into warehouse management system' },
        'Supplier': { value: 'UNICEF Supply Division', desc: 'Agency or vendor supplying the goods' },
        'Value (Birr)': { value: '4,500,000 ETB', desc: 'Estimated ETB value of the received inventory' }
      }
    }
  },
  'po-compliance-generic': {
    title: 'PO Performance & Compliance Metrics',
    description: 'Monitors contract terms, supplier lead-times, performance indicators, and financial letter of credit milestones.',
    purpose: [
      'Assess supplier scorecard parameters (on-time, in-full delivery rates).',
      'Track security performance bonds to protect EPSS capital.',
      'Optimize financial cycles by identifying delays in CAD/LC approvals.'
    ],
    period: 'Calculated monthly on rolling annual contract executions.',
    assumptions: [
      'Lead-time deviations are compared against the initial contracted delivery schedule.',
      'Excludes force majeure events approved by the EPSS legal department.'
    ],
    example: {
      columns: {
        'Contract Reference': { value: 'CTR-EPSS-2024-049', desc: 'Legal contract identifier' },
        'Supplier Name': { value: 'Shanghai Pharmaceuticals', desc: 'Contracted medicine supplier' },
        'On-Time Delivery %': { value: '94.2%', desc: 'Supplier performance rating' },
        'LC Release Delay': { value: '4 days', desc: 'Days elapsed beyond standard bank processing timeline' }
      }
    }
  }
};
