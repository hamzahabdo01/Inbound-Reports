export interface ShipmentRecord {
  PurchaseOrderNumber: string;
  Item: string;
  Unit: string;
  InvoiceNumber: string;
  InvoiceOrder: number | string;
  InvoicedQuantity: string;
  WayBillNumber: string;
  ShipmentOfficer: string;
  PortArrivalDate: string;
  DwellingTime: number | string;
  [key: string]: any;
}

export interface AuthContextValue {
  loggedIn: boolean;
  validating: boolean;
  token: string | null;
  login: (username: string, password: string, environmentCode: string) => Promise<void>;
  logout: () => void;
}

export interface ColumnFilter {
  column: string;
  operator: string;
  value: string;
}

export interface FilterState {
  invoiceType: string | null;
  donor: string | null;
  procurer: string | null;
  columnFilters: ColumnFilter[];
}

export interface VisibleColumns {
  [key: string]: boolean;
}

export interface PaginationState {
  currentPage: number;
  rowsPerPage: number;
}
