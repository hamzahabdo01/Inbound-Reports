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
  },
  'po-overdue': {
    title: 'Overdue Purchase Orders',
    description: 'Tracks purchase orders that have exceeded their contractual delivery dates, highlighting delays requiring escalation.',
    purpose: [
      'Flag suppliers failing to meet contractual delivery windows.',
      'Prioritize escalation actions for critically overdue shipments.',
      'Provide management visibility into systemic procurement delays.'
    ],
    period: 'Updated weekly from the EPSS contract management system.',
    assumptions: [
      'Overdue status is calculated against the contracted delivery date, not the estimated date.',
      'Partial shipments may appear as overdue even if partial quantities have been received.'
    ],
    example: {
      columns: {
        'PO Number': { value: 'PO-EPSS-2024-112', desc: 'Overdue purchase order reference' },
        'Supplier': { value: 'PharmaCorp Ltd.', desc: 'Contracted supplier name' },
        'Days Overdue': { value: '34 days', desc: 'Calendar days past the contractual delivery date' },
        'Order Value': { value: '$1,200,000', desc: 'Total value of the overdue purchase order' }
      }
    }
  },
  'po-contract-vs-po': {
    title: 'Contract vs PO — Consumption & Remaining',
    description: 'Compares original contract quantities against actual purchase orders, consumed amounts, and remaining balances per contract.',
    purpose: [
      'Track contract utilization rates to avoid over- or under-procurement.',
      'Identify contracts where remaining balances may expire unused.',
      'Support re-procurement planning based on consumption trends.'
    ],
    period: 'Monthly refresh aligned with financial close cycles.',
    assumptions: [
      'Consumption data is pulled from warehouse issuance records and may lag by up to 2 weeks.',
      'Remaining balances exclude pending deliveries not yet invoiced.'
    ],
    example: {
      columns: {
        'Contract Ref': { value: 'CTR-EPSS-2024-032', desc: 'Original contract identifier' },
        'PO Value': { value: '$2,500,000', desc: 'Total purchase order value raised against the contract' },
        'Consumed': { value: '$1,800,000', desc: 'Value of goods received and issued to date' },
        'Remaining': { value: '$700,000', desc: 'Unspent balance remaining on the contract' }
      }
    }
  },
  'po-lc-cad': {
    title: 'LC / CAD Expiry Report',
    description: 'Tracks Letter of Credit and Cash Against Document expiry dates to prevent financial instruments from lapsing.',
    purpose: [
      'Prevent demurrage and penalty charges from expired LCs.',
      'Coordinate with banks to renew or extend expiring instruments.',
      'Maintain supplier confidence by ensuring payment instruments remain valid.'
    ],
    period: 'Daily monitoring with alerts triggered 30 days before expiry.',
    assumptions: [
      'LC opening dates are sourced from the issuing bank and may have a processing delay.',
      'Extensions applied after the expiry date may incur additional bank fees.'
    ],
    example: {
      columns: {
        'PO Number': { value: 'PO-EPSS-2024-088', desc: 'Purchase order linked to the LC' },
        'LC Ref': { value: 'LC-2024-EPSS-441', desc: 'Letter of Credit reference number from the issuing bank' },
        'Expiry Date': { value: 'Dec 15, 2025', desc: 'Date after which the LC is no longer valid' },
        'Status': { value: 'At Risk — 45 days', desc: 'Current status with days remaining until expiry' }
      }
    }
  },
  'po-pipeline': {
    title: 'Contract vs PO vs Inbound Delivery vs Received',
    description: 'Full procurement pipeline tracking from contract award through purchase order placement, inbound shipment, and final goods reception.',
    purpose: [
      'End-to-end visibility of procurement cycle for each contract.',
      'Identify bottlenecks between PO placement and warehouse reception.',
      'Forecast incoming stock availability for distribution planning.'
    ],
    period: 'Updated weekly with data from EPSS ERP and shipping manifests.',
    assumptions: [
      'Inbound delivery dates are based on carrier ETAs and may shift.',
      'Received quantities reflect warehouse GRV entries, which may have processing delays.'
    ],
    example: {
      columns: {
        'Contract': { value: 'CTR-EPSS-2024-102', desc: 'Parent contract identifier' },
        'PO Qty': { value: '500,000 units', desc: 'Quantity ordered via purchase order' },
        'Inbound Qty': { value: '500,000 units', desc: 'Quantity reported as shipped by the supplier' },
        'Received Qty': { value: '200,000 units', desc: 'Quantity physically received and GRV processed' }
      }
    }
  },
  'po-moh-wbs': {
    title: 'Procurement by MOH WBS',
    description: 'Breaks down procurement activities and expenditure by the Ministry of Health Work Breakdown Structure categories.',
    purpose: [
      'Align procurement spend with MOH budgetary work packages.',
      'Ensure funding allocation matches approved WBS codes.',
      'Facilitate financial audit traceability for donor-funded programs.'
    ],
    period: 'Monthly reconciliation against MOH budget execution reports.',
    assumptions: [
      'WBS codes are assigned at contract inception and may not reflect re-allocations.',
      'Expenditure figures represent committed amounts, not necessarily disbursed.'
    ],
    example: {
      columns: {
        'WBS Code': { value: 'MOH-WBS-2024-07', desc: 'Ministry work breakdown structure code' },
        'Activity': { value: 'Malaria Prevention Program', desc: 'Procurement activity under this WBS' },
        'Budget': { value: '$5,000,000', desc: 'Approved budget for the WBS line item' },
        'Expenditure': { value: '$3,200,000', desc: 'Cumulative expenditure against the budget' }
      }
    }
  },
  'po-bond': {
    title: 'Performance Bond Report',
    description: 'Tracks supplier performance bonds across their lifecycle: received, verified, expired, confiscated, or extended.',
    purpose: [
      'Ensure all active contracts have valid performance bonds on file.',
      'Prevent financial exposure from lapsed or insufficient bonds.',
      'Track bond confiscation events for supplier performance reviews.'
    ],
    period: 'Monthly review aligned with contract milestone reporting.',
    assumptions: [
      'Bond verification status depends on bank confirmation which may lag.',
      'Bond amounts are typically 10% of contract value per EPSS standard terms.'
    ],
    example: {
      columns: {
        'Contract': { value: 'CTR-EPSS-2024-055', desc: 'Contract covered by the bond' },
        'Supplier': { value: 'MedSupply Co.', desc: 'Supplier who provided the bond' },
        'Bond Amount': { value: '$250,000', desc: 'Value of the performance bond (10% contract value)' },
        'Status': { value: 'Verified', desc: 'Current bond status: Received, Verified, Expired, Confiscated, or Extended' }
      }
    }
  },
  'po-leadtime': {
    title: 'Leadtime Analysis',
    description: 'Analyzes average processing times across key procurement stages from tender to final delivery.',
    purpose: [
      'Identify stages with the longest processing delays for process improvement.',
      'Establish baseline leadtime benchmarks for procurement planning.',
      'Compare supplier performance against average industry leadtimes.'
    ],
    period: 'Calculated quarterly on a rolling 12-month window of completed procurements.',
    assumptions: [
      'Leadtimes are calculated from stage entry to stage exit based on system timestamps.',
      'Outliers caused by force majeure or administrative holds are excluded from averages.'
    ],
    example: {
      columns: {
        'Stage': { value: 'Tender to Contract Award', desc: 'Procurement stage being measured' },
        'Avg Days': { value: '42 days', desc: 'Average calendar days to complete this stage' },
        'Min Days': { value: '18 days', desc: 'Fastest recorded completion time for this stage' },
        'Max Days': { value: '97 days', desc: 'Longest recorded completion time for this stage' }
      }
    }
  },
  'po-proc-status': {
    title: 'Procurement Status Overview',
    description: 'Visual pipeline showing the end-to-end status of procurements across Contract → PO → LC Opened → Port Arrival → Received stages.',
    purpose: [
      'Provide a quick executive summary of procurement health at each milestone.',
      'Identify where the largest volume of procurements are currently stalled.',
      'Support resource allocation decisions to clear bottlenecks.'
    ],
    period: 'Real-time snapshot from the EPSS procurement system.',
    assumptions: [
      'Stage progression requires manual status updates by procurement officers.',
      'Some stages may be skipped or combined depending on procurement method.'
    ],
    example: {
      columns: {
        'Stage': { value: 'Port Arrival', desc: 'Current milestone stage in the procurement lifecycle' },
        'Count': { value: '24', desc: 'Number of procurements currently at this stage' },
        'Percentage': { value: '18.5%', desc: 'Share of total active procurements at this stage' },
        'Avg Days in Stage': { value: '12 days', desc: 'Average time procurements have spent at this stage' }
      }
    }
  },
  'po-supplier-perf': {
    title: 'Supplier Performance Tracking',
    description: 'Evaluates supplier performance based on average lead times and on-time delivery percentages.',
    purpose: [
      'Score and rank suppliers by delivery reliability for future tender evaluations.',
      'Identify consistently underperforming suppliers for corrective action.',
      'Negotiate improved terms with top-performing suppliers.'
    ],
    period: 'Rolling 12-month performance window, updated monthly.',
    assumptions: [
      'On-time delivery is measured against the contractual delivery date, not supplier-proposed dates.',
      'Partial deliveries are counted as on-time only if the full order quantity is received by the due date.'
    ],
    example: {
      columns: {
        'Supplier': { value: 'GlobalPharma Inc.', desc: 'Name of the evaluated supplier' },
        'Avg Lead Time': { value: '68 days', desc: 'Average days from PO placement to delivery' },
        'On-Time %': { value: '87.5%', desc: 'Percentage of orders delivered on or before the contractual date' },
        'Total Orders': { value: '32', desc: 'Total number of completed orders in the evaluation period' }
      }
    }
  },
  'program-procurement-agents': {
    title: 'Procurement Agents Distribution',
    description: 'Pie chart showing the share of purchase order lines distributed among procurement agents and funding sources.',
    purpose: [
      'Visualize which procurement agents handle the largest PO volumes.',
      'Identify concentration risk if a single agent dominates procurement.',
      'Support balanced workload distribution across agents.'
    ],
    period: 'Real-time based on active purchase order data.',
    assumptions: [
      'Each PO line is attributed to the agent recorded in the ERP system.',
      'Unassigned POs are excluded from the agent distribution calculation.'
    ],
    example: {
      columns: {
        'Agent': { value: 'EPSS', desc: 'Procurement agent or funding source name' },
        'Share': { value: '45%', desc: 'Percentage of total PO lines handled by this agent' },
        'PO Count': { value: '28', desc: 'Number of purchase order lines attributed to this agent' }
      }
    }
  },
  'program-funding-source': {
    title: 'Funding Source Distribution',
    description: 'Pie chart breaking down incoming shipments and procurements by their funding source or donor.',
    purpose: [
      'Understand which donors fund the majority of incoming shipments.',
      'Ensure funding allocation matches program priorities.',
      'Support donor reporting with visual funding distribution data.'
    ],
    period: 'Real-time based on active shipment and PO data.',
    assumptions: [
      'Funding source is taken from the PO or contract header in the ERP system.',
      'Co-funded shipments are attributed to the primary funding source only.'
    ],
    example: {
      columns: {
        'Funding Source': { value: 'Global Fund', desc: 'Donor or funding source name' },
        'Share': { value: '38%', desc: 'Percentage of total value attributed to this funding source' },
        'Value': { value: '$3,200,000', desc: 'Total value of shipments funded by this source' }
      }
    }
  },
  'program-facility-distribution': {
    title: 'Facility Type Distribution',
    description: 'Pie chart showing the distribution of received quantities by facility type or source country.',
    purpose: [
      'Identify which facility types or countries supply the majority of products.',
      'Track supply source diversity to reduce dependency on single sources.',
      'Support strategic sourcing decisions based on facility performance.'
    ],
    period: 'Based on recent receives data from the warehouse management system.',
    assumptions: [
      'Facility type is derived from the supplier or sending warehouse classification.',
      'Countries of origin are based on the supplier\'s registered address.'
    ],
    example: {
      columns: {
        'Facility / Country': { value: 'Ethiopia — Adama Hub', desc: 'Source facility or country name' },
        'Share': { value: '28%', desc: 'Percentage of total received quantity from this source' },
        'Quantity': { value: '125,000 units', desc: 'Total received quantity from this source' }
      }
    }
  },
  'program-ownership-distribution': {
    title: 'Ownership Type Distribution',
    description: 'Pie chart showing the distribution of products by accountability or ownership category.',
    purpose: [
      'Understand what proportion of stock falls under each ownership type.',
      'Ensure accountability tracking aligns with program and donor requirements.',
      'Support audit readiness by maintaining clear ownership records.'
    ],
    period: 'Real-time based on current stock and PO ownership data.',
    assumptions: [
      'Ownership type is assigned at the contract or PO level.',
      'Transferred stock retains the original ownership classification until final issuance.'
    ],
    example: {
      columns: {
        'Ownership Type': { value: 'MOH Pooled', desc: 'Accountability category for the stock' },
        'Share': { value: '52%', desc: 'Percentage of stock under this ownership type' },
        'Value': { value: '$4,100,000', desc: 'Total value of stock under this ownership type' }
      }
    }
  },
  'program-account-distribution': {
    title: 'Account Distribution',
    description: 'Pie chart showing the breakdown of quantities by funding account or budget line.',
    purpose: [
      'Track how quantities are distributed across different funding accounts.',
      'Ensure account utilization aligns with approved budgets.',
      'Identify accounts with disproportionate allocation for rebalancing.'
    ],
    period: 'Based on current procurement and issuance data.',
    assumptions: [
      'Account codes are assigned at PO creation and may not reflect later re-allocations.',
      'Some accounts may show zero utilization if procurements are still in early stages.'
    ],
    example: {
      columns: {
        'Account': { value: 'GF-ETH-2024-MAL', desc: 'Funding account or budget line code' },
        'Share': { value: '62%', desc: 'Percentage of total quantity allocated to this account' },
        'Quantity': { value: '310,000 units', desc: 'Total quantity allocated to this account' }
      }
    }
  },
  'po-commodity-type': {
    title: 'Procurement Amount by Material Type',
    description: 'Breaks down total procurement value across material type categories (Medicine, Medical Device, Laboratory Commodity, Medical Supply) with share percentages.',
    purpose: [
      'Identify which material types consume the largest share of procurement budget.',
      'Support strategic sourcing decisions by material category.',
      'Monitor procurement balance across therapeutic and supply categories.',
      'Facilitate budget allocation planning by material type.'
    ],
    period: 'Real-time aggregation from all active and completed purchase orders.',
    assumptions: [
      'Each PO line is attributed to a single material type based on the item classification.',
      'Amount share percentages may not sum to exactly 100% due to independent rounding.',
      'Material type counts (Medicine, Medical Device, etc.) follow EPSS standard classification codes.'
    ],
    example: {
      columns: {
        'Material Type': { value: 'Medicine (ZME)', desc: 'EPSS material type classification code and name' },
        'Amount': { value: '74.1B ETB', desc: 'Total procurement value for this material type' },
        'Share': { value: '54.2%', desc: 'Percentage of total procurement value' },
        'POs': { value: '1,133', desc: 'Number of purchase orders in this material type' }
      }
    }
  },
  'po-po-type': {
    title: 'Procurement Amount by PO Type',
    description: 'Distributes total procurement value across purchase order types: Health Programs, RDF International, RDF Local, and Framework Orders.',
    purpose: [
      'Understand the funding and procurement channel mix (Health Programs vs RDF).',
      'Monitor RDF Local vs International procurement balance for domestic industry support.',
      'Track Framework Order adoption and its share of total procurement.',
      'Support policy decisions on procurement channel strategy.'
    ],
    period: 'Real-time aggregation from all active and completed purchase orders.',
    assumptions: [
      'PO type is assigned at order creation based on the funding source and procurement channel.',
      'RDF  local and RDF International are treated as distinct procurement channels.',
      'Amount share percentages may not sum to exactly 100% due to independent rounding.'
    ],
    example: {
      columns: {
        'PO Type': { value: 'By Health Program', desc: 'Purchase order type classification' },
        'Amount': { value: '82.8B ETB', desc: 'Total procurement value for this PO type' },
        'Share': { value: '60.6%', desc: 'Percentage of total procurement value' },
        'Suppliers': { value: '205', desc: 'Number of suppliers in this PO type' }
      }
    }
  },
  'procurement-local-intl': {
    title: 'Local vs International Procurement',
    description: 'Pie chart comparing the value of locally sourced versus international procurement.',
    purpose: [
      'Track the balance between domestic and foreign procurement for strategic planning.',
      'Support local industry development by monitoring local procurement share.',
      'Identify opportunities to increase local sourcing where feasible.'
    ],
    period: 'Year-to-date aggregation from all active and completed procurements.',
    assumptions: [
      'Local procurement refers to goods sourced from domestic manufacturers or suppliers.',
      'International procurement includes all imports regardless of the funding source.'
    ],
    example: {
      columns: {
        'Origin': { value: 'Local', desc: 'Procurement origin — Local or International' },
        'Amount': { value: '$2,500,000', desc: 'Total procurement value for this origin category' },
        'Percentage': { value: '35%', desc: 'Share of total procurement value' }
      }
    }
  },
  'procurement-stage-visualizer': {
    title: 'Procurement Stage Visualizer',
    description: 'Interactive pipeline, delay pie chart, and delay trend views of procurement stages showing counts and progression.',
    purpose: [
      'Visualize the flow of procurements through each stage of the pipeline.',
      'Identify stages where the most delays are concentrated for targeted intervention.',
      'Track delay trends over time to measure process improvement impact.'
    ],
    period: 'Real-time snapshot from the procurement management system.',
    assumptions: [
      'Stage progress is recorded when procurement officers update the system.',
      'Delay calculations use target completion dates, which may differ from contractual dates.'
    ],
    example: {
      columns: {
        'Stage': { value: 'Technical Evaluation', desc: 'Procurement stage name' },
        'Count': { value: '18', desc: 'Number of procurements currently at this stage' },
        'Delay %': { value: '12.5%', desc: 'Percentage of procurements at this stage that are delayed' }
      }
    }
  },
  'shipment-grnf-distribution': {
    title: 'GRNF Status Distribution',
    description: 'Pie chart showing the breakdown of shipments by their Goods Receipt Note Fill (GRNF) completion levels.',
    purpose: [
      'Monitor warehouse receipt completion rates across all active shipments.',
      'Identify shipments with critically low GRNF completion requiring investigation.',
      'Track GRNF processing efficiency as a warehouse KPI.'
    ],
    period: 'Real-time from the warehouse management system.',
    assumptions: [
      'GRNF percentage reflects physical receipt verification, not invoice matching.',
      'Shipments at 0% GRNF may be in transit or held at customs.'
    ],
    example: {
      columns: {
        'GRNF Range': { value: '≥99% Complete', desc: 'GRNF completion percentage range' },
        'Count': { value: '42', desc: 'Number of shipments in this GRNF range' },
        'Percentage': { value: '35.6%', desc: 'Share of total shipments in this range' }
      }
    }
  }
};
