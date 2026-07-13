import axios from 'axios'
import type { AxiosInstance, AxiosResponse } from 'axios'

const fanosClient: AxiosInstance = axios.create({
  baseURL: 'https://fanosdash-api.moh.gov.et',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
})

export function setFanosAuthKey(key: string) {
  if (key) {
    fanosClient.defaults.headers.common['Authorization'] = `Basic ${key}`
  } else {
    delete fanosClient.defaults.headers.common['Authorization']
  }
}

// Restore auth key from sessionStorage on module load
const storedKey = typeof window !== 'undefined' ? sessionStorage.getItem('platformKey') : null
if (storedKey) {
  setFanosAuthKey(storedKey)
}

// ─── Auth response interceptor ──────────────────────────────────────────────

fanosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      sessionStorage.removeItem('platformKey')
      setFanosAuthKey('')
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:expired'))
      }
    }
    return Promise.reject(error)
  }
)

export async function validateAuthKey(): Promise<boolean> {
  try {
    await fanosClient.get('/api/AccountManager/UserLog', { params: { $top: 1 } })
    return true
  } catch {
    return false
  }
}

// ─── Common response wrappers used across modules ──────────────────────────

export interface ListResult<T> {
  Data: T[]
  TotalRows: number
  PageNo: number
  PageSize: number
  ElapsedTime: number
  ContextFilters: string[]
  SentFilters: string[]
  UsedFilters: string[]
}

export interface IHttpActionResult {}

// ─── AccountManager ────────────────────────────────────────────────────────

export interface AccountInformation {
  UserName: string
  Password: string
  EnvironmentCode: string
}

export interface DevicesModel {
  FullName: string
  DeviceType: string
  DeviceIdentifier: string
  PushNotificationIdentifier: string
  OtherInfo: string
  Environment: string
  EnvironmentCode: string
  LastLogin: string
  JobTitle: string
}

export interface UserLogModel {
  FullName: string
  PublicIPAddress: string
  DeviceType: string
  UserAgent: string
  HCMISVersion: string
  OtherInfo: string
  LastLogin: string
  Environment: string
  EnvironmentCode: string
  Jobtitle: string
  OperatingSystem: string
  DeviceName: string
  Browser: string
}

export type DevicesResult = ListResult<DevicesModel>
export type UserLogResult = ListResult<UserLogModel>

export interface PlatformAuthResponse {
  key?: string
  Key?: string
  [key: string]: unknown
}

export const AccountManager = {
  /** GET/POST query-param authenticate */
  authenticate(
    username: string,
    password: string,
    environmentCode?: string,
    method: 'GET' | 'POST' = 'POST',
  ): Promise<AxiosResponse<IHttpActionResult>> {
    return fanosClient({
      method,
      url: '/api/AccountManager/Authenticate',
      params: { username, password, environmentCode },
    })
  },

  /** POST body authenticate */
  authenticateWithBody(
    accountInformation: AccountInformation,
  ): Promise<AxiosResponse<IHttpActionResult>> {
    return fanosClient.post('/api/AccountManager/Authenticate', accountInformation)
  },

  /** GET/POST with platform identifier and device info */
  authenticateWithPlatformIdentifier(
    username: string,
    password: string,
    environmentCode?: string,
    extra?: {
      browser?: string
      deviceName?: string
      operatingSystem?: string
      hcmisVersion?: string
      otherInfo?: string
      deviceIdentifier?: string
      userAgent?: string
      deviceType?: string
    },
    method: 'GET' | 'POST' = 'POST',
  ): Promise<AxiosResponse<IHttpActionResult>> {
    return fanosClient({
      method,
      url: '/api/AccountManager/AuthenticateWithPlatformIdentifier',
      params: { username, password, environmentCode, ...extra },
    })
  },

  /** The endpoint currently used by the app — POST with query params */
  authenticateWithPlatformIdentifiera(
    username: string,
    password: string,
    environmentCode?: string,
    extra?: {
      browser?: string
      deviceName?: string
      operatingSystem?: string
      hcmisVersion?: string
      otherInfo?: string
      deviceIdentifier?: string
      userAgent?: string
      deviceType?: string
    },
    method: 'GET' | 'POST' = 'POST',
  ): Promise<AxiosResponse<PlatformAuthResponse>> {
    return fanosClient({
      method,
      url: '/api/AccountManager/AuthenticateWithPlatformIdentifiera',
      params: { username, password, environmentCode, ...extra },
    })
  },

  /** Convenience: platform auth with known defaults */
  platformAuth(
    username: string,
    password: string,
    environmentCode: string,
  ): Promise<AxiosResponse<PlatformAuthResponse>> {
    return AccountManager.authenticateWithPlatformIdentifiera(
      username,
      password,
      environmentCode || '',
      { deviceIdentifier: 'unknown', deviceType: 'web', hcmisVersion: 'unknown' },
      'POST',
    )
  },

  getDevices(): Promise<AxiosResponse<DevicesResult>> {
    return fanosClient.get('/api/AccountManager/Devices')
  },

  loginsso(
    username: string,
    environmentCode?: string,
    method: 'GET' | 'POST' = 'POST',
  ): Promise<AxiosResponse<IHttpActionResult>> {
    return fanosClient({ method, url: '/api/AccountManager/loginsso', params: { username, environmentCode } })
  },

  getUserLog(): Promise<AxiosResponse<UserLogResult>> {
    return fanosClient.get('/api/AccountManager/UserLog')
  },
}

// ─── EN_WebApi ─────────────────────────────────────────────────────────────

export interface En_ByEnvironmentCodeModel {
  RowNumber: number
  Environment: string
  EnvironmentCode: string
  EnvironmentGroup: string
  EnvironmentGroupCode: string
  CommonName: string
  EnvironmentID: number
}

export type En_ByEnvironmentCodeResult = ListResult<En_ByEnvironmentCodeModel>

export interface EnvironmentLastUpdateDateForTransactionsModel {
  RowNumber: number
  Environment: string
  EnvironmentCode: string
  EnvironmentGroup: string
  EnvironmentGroupCode: string
  All: string
  IssueH: string
  IssueD: string
  ReceiptH: string
  ReceiptD: string
  PurchaseOrderH: string
  PurchaseOrderD: string
  RequisitionH: string
  RequisitionD: string
  PickListH: string
  PickListD: string
  ReceiptInvoiceH: string
  ReceiptInvoiceD: string
  ReceiptPallet: string
  DeletedPickList: string
  DeletedReceipt: string
  DeletedIssue: string
}

export type EnvironmentLastUpdateDateForTransactionsResult = ListResult<EnvironmentLastUpdateDateForTransactionsModel>

export interface EnvironmentLastUpdateDateByCountModel {
  RowNumber: number
  DMEnvironment: string
  EnvironmentCode: string
  EnvironmentGroup: string
  EnvironmentGroupCode: string
  IssueH: number
  IssueD: number
  ReceiptH: number
  ReceiptD: number
  PurchaseOrderH: number
  PurchaseOrderD: number
  RequisitionH: number
  RequisitionD: number
  PickListH: number
  PickListD: number
  ReceiptInvoiceH: number
  ReceiptInvoiceD: number
  ReceiptPallet_DM: number
  DeletedPickList_DM: number
  DeletedReceipt_DM: number
  DeletedIssue_DM: number
  LedgerLite: number
  LogReceiptStatus: number
  MAH: number
  UserAccount: number
  Institution: number
  InventoryPeriod: number
  PalletLocation: number
  PhysicalStore: number
  SectionUnit: number
  Supplier: number
  Cluster: number
  Warehouse: number
  Environment: string
  RequisitionHeader: number
  RequisitionDetail: number
  PicklistHeader: number
  PicklistDetail: number
  IssueHeader: number
  IssueDetail: number
  PurchaseOrderHeader: number
  PurchaseOrderDetail: number
  ReceiptInvoiceHeader: number
  ReceiptInvoiceDetail: number
  ReceiptHeader: number
  ReceiptDetail: number
  ReceiptPallet: number
  DeletedIssue: number
  DeletedReceipt: number
  DeletedPicklist: number
  LedgerLiteInternal: number
  LogReceiptStatusInternal: number
  MAHInternal: number
  UserInternal: number
  StockoutInternal: number
  InstitutionPrerequisite: number
  InventoryPeriodPrerequisite: number
  PalletLocationPrerequisite: number
  PhysicalStorePrerequisite: number
  SectionUnitPrerequisite: number
  SupplierPrerequisite: number
  ClusterPrerequisite: number
  WarehousePrerequisite: number
}

export type EnvironmentLastUpdateDateByCountResult = ListResult<EnvironmentLastUpdateDateByCountModel>

export interface EnvironmentLastUpdateDateRowCountModel {
  RowNumber: number
  Environment: string
  EnvironmentCode: string
  DeletedIssue: number
  DeletedPicklist: number
  DeletedReceipt: number
  IssueDetail: number
  IssueHeader: number
  PicklistDetail: number
  PicklistHeader: number
  PurchaseOrderDetail: number
  PurchaseOrderHeader: number
  ReceiptDetail: number
  ReceiptHeader: number
  ReceiptInvoiceDetail: number
  ReceiptInvoiceHeader: number
  ReceiptPallet: number
  RequisitionDetail: number
  RequisitionHeader: number
  LedgerLiteInternal: number
  LogReceiptStatusInternal: number
  MAHInternal: number
  UserAccountInternal: number
  StockoutInternal: number
  InstitutionPrerequisite: number
  InventoryPeriodPrerequisite: number
  PalletLocationPrerequisite: number
  PhysicalStorePrerequisite: number
  SectionUnitPrerequisite: number
  SupplierPrerequisite: number
  ClusterPrerequisite: number
  WarehousePrerequisite: number
  Cluster_w: number
  Institution_w: number
  InventoryPeriod_w: number
  Issue_w: number
  IssueDetail_w: number
  LedgerLite_w: number
  LogReceiptStatus_w: number
  MovingAverageHistory_w: number
  PalletLocation_w: number
  PhysicalStore_w: number
  Picklist_w: number
  PicklistDetail_w: number
  SectionUnit_w: number
  Stockout_w: number
  Supplier_w: number
  vwPurchaseOrder_w: number
  vwPurchaseOrderDetail_w: number
  vwReceipt_w: number
  vwReceiptDetail_w: number
  vwReceiptInvoice_w: number
  vwReceiptInvoiceDetail_w: number
  vwReceiptPallet_w: number
  vwRequisition_w: number
  vwRequisitionDetail_w: number
  Warehouse_w: number
}

export type EnvironmentLastUpdateDateRowCountResult = ListResult<EnvironmentLastUpdateDateRowCountModel>

export interface EnvironmentLastUpdateDateModel {
  RowNumber: number
  Environment: string
  EnvironmentCode: string
  DeletedIssue: string
  DeletedPicklist: string
  DeletedReceipt: string
  IssueDetail: string
  IssueHeader: string
  PicklistDetail: string
  PicklistHeader: string
  PurchaseOrderDetail: string
  PurchaseOrderHeader: string
  ReceiptDetail: string
  ReceiptHeader: string
  ReceiptInvoiceDetail: string
  ReceiptInvoiceHeader: string
  ReceiptPallet: string
  RequisitionDetail: string
  RequisitionHeader: string
}

export type EnvironmentLastUpdateDateResult = ListResult<EnvironmentLastUpdateDateModel>

export interface ColdRoomLastUpdateDateModel {
  RowNumber: number
  Environment: string
  EnvironmentCode: string
  ColdRoomFileCreatedDate: string
  DMEnvironment: string
}

export type ColdRoomLastUpdateDateResult = ListResult<ColdRoomLastUpdateDateModel>

export interface DatamartSourceTablesRowCountModel {
  RowNumber: number
  SourceTableName: string
  RowCount: number
}

export type DatamartSourceTablesRowCountResult = ListResult<DatamartSourceTablesRowCountModel>

export interface EnvironmentLastAccessDateModel {
  RowNumber: number
  Environment: string
  EnvironmentCode: string
  LastAccessDate: string
}

export type EnvironmentLastAccessDateResult = ListResult<EnvironmentLastAccessDateModel>

export interface EnvironmentlastFileSizeModel {
  RowNumber: number
  Environment: string
  EnvironmentCode: string
  EnvironmentGroup: string
  EnvironmentGroupCode: string
  FileSize: string
}

export type EnvironmentlastFileSizeResult = ListResult<EnvironmentlastFileSizeModel>

export interface EnvironmentSTVCountModel {
  RowNumber: number
  Environment: string
  EnvironmentCode: string
  STVCount: number
}

export type EnvironmentSTVCountResult = ListResult<EnvironmentSTVCountModel>

export interface EnvironmentSTVTypeModel {
  RowNumber: number
  STVType: string
  Environment: string
  EnvironmentCode: string
  Count: number
}

export type EnvironmentSTVTypeModelResult = ListResult<EnvironmentSTVTypeModel>

export interface EnvLastTransactionDateModel {
  RowNumber: number
  Environment: string
  EnvironmentCode: string
  LastTransactionDate: string
}

export type EnvLastTransactionDateResult = ListResult<EnvLastTransactionDateModel>

export interface HCMISRowCountModel {
  RowNumber: number
  TableName: string
  RowCount: number
}

export interface IamOnlineModel {
  RowNumber: number
  EnvironmentCode: string
  IsOnline: boolean
}

export interface JobStatusModel {
  RowNumber: number
  Environment: string
  EnvironmentCode: string
  JobStatus: string
}

export type JobStatusResult = ListResult<JobStatusModel>

export interface JobStatusSiteModel {
  RowNumber: number
  Environment: string
  EnvironmentCode: string
  JobStatus: string
  LastSyncDate: string
}

export type JobStatusSiteResult = ListResult<JobStatusSiteModel>

export interface KPIIndicatorlastmodifiedModel {
  RowNumber: number
  TableName: string
  LastModifiedDate: string
}

export type KPIIndicatorlastmodifiedResult = ListResult<KPIIndicatorlastmodifiedModel>

export interface KPIIndicatorNVlaueModel {
  RowNumber: number
  IndicatorName: string
  IndicatorValue: string
}

export type KPIIndicatorNVlaueResult = ListResult<KPIIndicatorNVlaueModel>

export interface KpiRowCountModel {
  RowNumber: number
  kpiName: string
  kpiRowCount: number
}

export type KpiRowCountResult = ListResult<KpiRowCountModel>

export interface LiveStatusModel {
  RowNumber: number
  Environment: string
  EnvironmentCode: string
  LiveStatus: string
}

export type LiveStatusResult = ListResult<LiveStatusModel>

export interface LiveStatusForAnHourModel {
  RowNumber: number
  Environment: string
  EnvironmentCode: string
  EnvironmentGroup: string
  EnvironmentGroupCode: string
  Success: number
  Fail: number
}

export type LiveStatusForAnHourResult = ListResult<LiveStatusForAnHourModel>

export interface TableViewRowCountModel {
  RowNumber: number
  TableName: string
  RowCount: number
}

export type TableViewRowCountResult = ListResult<TableViewRowCountModel>

export const EN_WebApi = {
  /** Returns EnvironmentName, EnvironmentCode and EnvironmentID */
  getByEnvironmentCode(environmentCode?: string, environmentGroupCode?: string): Promise<AxiosResponse<En_ByEnvironmentCodeResult>> {
    return fanosClient.get('/api/EN_WebApi/ByEnvironmentCode', {
      params: { EnvironmentCode: environmentCode, EnvironmentGroupCode: environmentGroupCode },
    })
  },

  getColdRoomLastFileCreatedDate(environmentCode?: string, environmentGroupCode?: string): Promise<AxiosResponse<ColdRoomLastUpdateDateResult>> {
    return fanosClient.get('/api/EN_WebApi/ColdRoomLastFileCreatedDate', {
      params: { EnvironmentCode: environmentCode, EnvironmentGroupCode: environmentGroupCode },
    })
  },

  getDatamartSourceTablesRowCount(): Promise<AxiosResponse<DatamartSourceTablesRowCountResult>> {
    return fanosClient.get('/api/EN_WebApi/DatamartSourceTablesRowCount')
  },

  getEnvironmentLastAccessDate(): Promise<AxiosResponse<EnvironmentLastAccessDateResult>> {
    return fanosClient.get('/api/EN_WebApi/EnvironmentLastAccessDate')
  },

  getEnvironmentLastFileCreatedDate(environmentCode?: string, environmentGroupCode?: string): Promise<AxiosResponse<EnvironmentLastUpdateDateResult>> {
    return fanosClient.get('/api/EN_WebApi/EnvironmentLastFileCreatedDate_152', {
      params: { EnvironmentCode: environmentCode, EnvironmentGroupCode: environmentGroupCode },
    })
  },

  getEnvironmentlastFileSize(): Promise<AxiosResponse<EnvironmentlastFileSizeResult>> {
    return fanosClient.get('/api/EN_WebApi/EnvironmentlastFileSize')
  },

  getEnvironmentLastSyncUpdate(environmentCode?: string, environmentGroupCode?: string): Promise<AxiosResponse<EnvironmentLastUpdateDateRowCountResult>> {
    return fanosClient.get('/api/EN_WebApi/EnvironmentLastSyncUpdate_149', {
      params: { EnvironmentCode: environmentCode, EnvironmentGroupCode: environmentGroupCode },
    })
  },

  getEnvironmentLastTransactionUpdate(environmentCode?: string, environmentGroupCode?: string): Promise<AxiosResponse<EnvironmentLastUpdateDateForTransactionsResult>> {
    return fanosClient.get('/api/EN_WebApi/EnvironmentLastTransactionUpdate_111', {
      params: { EnvironmentCode: environmentCode, EnvironmentGroupCode: environmentGroupCode },
    })
  },

  getEnvironmentLastUpdateByCount(environmentCode?: string, environmentGroupCode?: string): Promise<AxiosResponse<EnvironmentLastUpdateDateByCountResult>> {
    return fanosClient.get('/api/EN_WebApi/EnvironmentLastUpdateByCount_121', {
      params: { EnvironmentCode: environmentCode, EnvironmentGroupCode: environmentGroupCode },
    })
  },

  getEnvironmentSTVCount(): Promise<AxiosResponse<EnvironmentSTVCountResult>> {
    return fanosClient.get('/api/EN_WebApi/EnvironmentSTVCount_184')
  },

  getEnvironmentSTVType(): Promise<AxiosResponse<EnvironmentSTVTypeModelResult>> {
    return fanosClient.get('/api/EN_WebApi/EnvironmentSTVType_185')
  },

  getEnvLastTransactionDate(): Promise<AxiosResponse<EnvLastTransactionDateResult>> {
    return fanosClient.get('/api/EN_WebApi/EnvLastTransactionDate')
  },

  getHCMISRowCount(): Promise<AxiosResponse<HCMISRowCountModel>> {
    return fanosClient.get('/api/EN_WebApi/HCMISRowCount')
  },

  getIamOnline(environmentCode?: string, attempt?: number): Promise<AxiosResponse<IamOnlineModel>> {
    return fanosClient.get('/api/EN_WebApi/IamOnline', {
      params: { EnvironmentCode: environmentCode, Attempt: attempt },
    })
  },

  getInternalPreRequisiteDeletedCount(environmentCode?: string, environmentGroupCode?: string): Promise<AxiosResponse<EnvironmentLastUpdateDateByCountResult>> {
    return fanosClient.get('/api/EN_WebApi/InternalPreRequisiteDeletedCount', {
      params: { EnvironmentCode: environmentCode, EnvironmentGroupCode: environmentGroupCode },
    })
  },

  getJobHistory(environmentCode?: string, environmentGroupCode?: string): Promise<AxiosResponse<JobStatusResult>> {
    return fanosClient.get('/api/EN_WebApi/JobHistory', {
      params: { EnvironmentCode: environmentCode, EnvironmentGroupCode: environmentGroupCode },
    })
  },

  getJobHistoryPerSite(environmentCode?: string, environmentGroupCode?: string): Promise<AxiosResponse<JobStatusResult>> {
    return fanosClient.get('/api/EN_WebApi/JobHistoryPerSite', {
      params: { EnvironmentCode: environmentCode, EnvironmentGroupCode: environmentGroupCode },
    })
  },

  getJobHistoryPerSiteL1(environmentCode?: string, environmentGroupCode?: string): Promise<AxiosResponse<JobStatusResult>> {
    return fanosClient.get('/api/EN_WebApi/JobHistoryPerSiteL1', {
      params: { EnvironmentCode: environmentCode, EnvironmentGroupCode: environmentGroupCode },
    })
  },

  getJobStatus(environmentCode?: string, environmentGroupCode?: string): Promise<AxiosResponse<JobStatusResult>> {
    return fanosClient.get('/api/EN_WebApi/JobStatus', {
      params: { EnvironmentCode: environmentCode, EnvironmentGroupCode: environmentGroupCode },
    })
  },

  getJobStatusPerSite(environmentCode?: string, environmentGroupCode?: string): Promise<AxiosResponse<JobStatusSiteResult>> {
    return fanosClient.get('/api/EN_WebApi/JobStatusPerSite', {
      params: { EnvironmentCode: environmentCode, EnvironmentGroupCode: environmentGroupCode },
    })
  },

  getKPIIndicatorlastmodified(): Promise<AxiosResponse<KPIIndicatorlastmodifiedResult>> {
    return fanosClient.get('/api/EN_WebApi/KPIIndicatorlastmodified')
  },

  getKPIIndicatorNVlaue(): Promise<AxiosResponse<KPIIndicatorNVlaueResult>> {
    return fanosClient.get('/api/EN_WebApi/KPIIndicatorNVlaue')
  },

  getKpiRowCountLastModified(): Promise<AxiosResponse<KpiRowCountResult>> {
    return fanosClient.get('/api/EN_WebApi/KpiRowCountLastModified')
  },

  getLiveStatus(): Promise<AxiosResponse<LiveStatusResult>> {
    return fanosClient.get('/api/EN_WebApi/LiveStatus')
  },

  getLiveStatusForAnHour(): Promise<AxiosResponse<LiveStatusForAnHourResult>> {
    return fanosClient.get('/api/EN_WebApi/liveStatusForAnHour')
  },

  getTableViewRowCount(environmentCode?: string, environmentGroupCode?: string): Promise<AxiosResponse<TableViewRowCountResult>> {
    return fanosClient.get('/api/EN_WebApi/TableViewRowCount', {
      params: { EnvironmentCode: environmentCode, EnvironmentGroupCode: environmentGroupCode },
    })
  },
}

// ─── MainDashboard_WebApi ──────────────────────────────────────────────────

export interface ValueModel {
  RowNumber: number
  AmountOrdered: number
  AmountReceived: number
  AmountReceivedBirr: number
  QuantityReceived: number
  AmountIssued: number
  Manufacturer: string
  Supplier: string
  Country: string
  Environment: string
  SOHValue: number
  Item: string
  ProductCN: string
  Institution: string
  AverageDeliveryLeadTime: number
  AverageProcessLeadTime: number
  OFR: number
  Users: number
  PercentageConfirmed: number
  FullDate: string
  SupplierSN: number
  ManufacturerSN: number
  Share: number
  HUB: string
  EnvironmentCode: string
  FundingSource: string
  Procurer: string
}

export type ValueResult = ListResult<ValueModel>

export interface DetailModel {
  FullItemName: string
  ProductCN: string
  AmountReceived: number
}

export type DetailResult = ListResult<DetailModel>

export interface ManufacturerListModel {
  RowNumber: number
  ManufacturerSN: number
  Name: string
  CountryOfOrigin: string
}

export type ManufacturerListResult = ListResult<ManufacturerListModel>

export const MainDashboard_WebApi = {
  getAvgUsersPerday(programCode?: string, itemSN?: number, unitSN?: number): Promise<AxiosResponse<ValueResult>> {
    return fanosClient.get('/api/MainDashboard_WebApi/AvgUsersPerday', {
      params: { ProgramCode: programCode, ItemSN: itemSN, UnitSN: unitSN },
    })
  },

  getCenterFillRateToHub(programCode?: string, itemSN?: number, unitSN?: number): Promise<AxiosResponse<ValueResult>> {
    return fanosClient.get('/api/MainDashboard_WebApi/CenterFillRateToHub', {
      params: { ProgramCode: programCode, ItemSN: itemSN, UnitSN: unitSN },
    })
  },

  getCountry(programCode?: string, itemSN?: number, unitSN?: number): Promise<AxiosResponse<ValueResult>> {
    return fanosClient.get('/api/MainDashboard_WebApi/Country', {
      params: { ProgramCode: programCode, ItemSN: itemSN, UnitSN: unitSN },
    })
  },

  getDeliveryTimeCTH(programCode?: string, itemSN?: number, unitSN?: number): Promise<AxiosResponse<ValueResult>> {
    return fanosClient.get('/api/MainDashboard_WebApi/DeliveryTimeCTH', {
      params: { ProgramCode: programCode, ItemSN: itemSN, UnitSN: unitSN },
    })
  },

  getDetail(programCode?: string, itemSN?: number, unitSN?: number): Promise<AxiosResponse<DetailResult>> {
    return fanosClient.get('/api/MainDashboard_WebApi/Detail', {
      params: { ProgramCode: programCode, ItemSN: itemSN, UnitSN: unitSN },
    })
  },

  getDispatchConfirmed(programCode?: string, itemSN?: number, unitSN?: number): Promise<AxiosResponse<ValueResult>> {
    return fanosClient.get('/api/MainDashboard_WebApi/DispatchConfirmed', {
      params: { ProgramCode: programCode, ItemSN: itemSN, UnitSN: unitSN },
    })
  },

  getDonor(programCode?: string, itemSN?: number, unitSN?: number): Promise<AxiosResponse<ValueResult>> {
    return fanosClient.get('/api/MainDashboard_WebApi/Donor', {
      params: { ProgramCode: programCode, ItemSN: itemSN, UnitSN: unitSN },
    })
  },

  getFillRate(programCode?: string, itemSN?: number, unitSN?: number): Promise<AxiosResponse<ValueResult>> {
    return fanosClient.get('/api/MainDashboard_WebApi/FillRate', {
      params: { ProgramCode: programCode, ItemSN: itemSN, UnitSN: unitSN },
    })
  },

  getHubDispatchConfirmationRanking(programCode?: string, itemSN?: number, unitSN?: number): Promise<AxiosResponse<ValueResult>> {
    return fanosClient.get('/api/MainDashboard_WebApi/HubDispatchConfirmationRanking', {
      params: { ProgramCode: programCode, ItemSN: itemSN, UnitSN: unitSN },
    })
  },

  getHubRankingIssue(programCode?: string, itemSN?: number, unitSN?: number): Promise<AxiosResponse<ValueResult>> {
    return fanosClient.get('/api/MainDashboard_WebApi/HubRankingIssue', {
      params: { ProgramCode: programCode, ItemSN: itemSN, UnitSN: unitSN },
    })
  },

  getHubRankingReceive(programCode?: string, itemSN?: number, unitSN?: number): Promise<AxiosResponse<ValueResult>> {
    return fanosClient.get('/api/MainDashboard_WebApi/HubRankingReceive', {
      params: { ProgramCode: programCode, ItemSN: itemSN, UnitSN: unitSN },
    })
  },

  getHubRankingSOH(programCode?: string, itemSN?: number, unitSN?: number): Promise<AxiosResponse<ValueResult>> {
    return fanosClient.get('/api/MainDashboard_WebApi/HubRankingSOH', {
      params: { ProgramCode: programCode, ItemSN: itemSN, UnitSN: unitSN },
    })
  },

  getHubsFillRateToFa(programCode?: string, itemSN?: number, unitSN?: number): Promise<AxiosResponse<ValueResult>> {
    return fanosClient.get('/api/MainDashboard_WebApi/HubsFillRateToFa', {
      params: { ProgramCode: programCode, ItemSN: itemSN, UnitSN: unitSN },
    })
  },

  getInstitution(programCode?: string, itemSN?: number, unitSN?: number): Promise<AxiosResponse<ValueResult>> {
    return fanosClient.get('/api/MainDashboard_WebApi/Institution', {
      params: { ProgramCode: programCode, ItemSN: itemSN, UnitSN: unitSN },
    })
  },

  getIssue(programCode?: string, itemSN?: number, unitSN?: number): Promise<AxiosResponse<ValueResult>> {
    return fanosClient.get('/api/MainDashboard_WebApi/Issue', {
      params: { ProgramCode: programCode, ItemSN: itemSN, UnitSN: unitSN },
    })
  },

  getIssueTrend(programCode?: string, itemSN?: number, unitSN?: number): Promise<AxiosResponse<ValueResult>> {
    return fanosClient.get('/api/MainDashboard_WebApi/IssueTrend', {
      params: { ProgramCode: programCode, ItemSN: itemSN, UnitSN: unitSN },
    })
  },

  getLocation(programCode?: string, itemSN?: number, unitSN?: number): Promise<AxiosResponse<ValueResult>> {
    return fanosClient.get('/api/MainDashboard_WebApi/Location', {
      params: { ProgramCode: programCode, ItemSN: itemSN, UnitSN: unitSN },
    })
  },

  getManufacturerList(programCode?: string, itemSN?: number, unitSN?: number): Promise<AxiosResponse<ManufacturerListResult>> {
    return fanosClient.get('/api/MainDashboard_WebApi/ManufacturerList', {
      params: { ProgramCode: programCode, ItemSN: itemSN, UnitSN: unitSN },
    })
  },

  getOrder(programCode?: string, itemSN?: number, unitSN?: number): Promise<AxiosResponse<ValueResult>> {
    return fanosClient.get('/api/MainDashboard_WebApi/Order', {
      params: { ProgramCode: programCode, ItemSN: itemSN, UnitSN: unitSN },
    })
  },

  getProcurer(programCode?: string, itemSN?: number, unitSN?: number): Promise<AxiosResponse<ValueResult>> {
    return fanosClient.get('/api/MainDashboard_WebApi/Procurer', {
      params: { ProgramCode: programCode, ItemSN: itemSN, UnitSN: unitSN },
    })
  },

  getProgram(programCode?: string, itemSN?: number, unitSN?: number): Promise<AxiosResponse<ValueResult>> {
    return fanosClient.get('/api/MainDashboard_WebApi/Program', {
      params: { ProgramCode: programCode, ItemSN: itemSN, UnitSN: unitSN },
    })
  },

  getReceive(programCode?: string, itemSN?: number, unitSN?: number): Promise<AxiosResponse<ValueResult>> {
    return fanosClient.get('/api/MainDashboard_WebApi/Receive', {
      params: { ProgramCode: programCode, ItemSN: itemSN, UnitSN: unitSN },
    })
  },

  getReceiveTrend(params?: {
    ModeCode?: string
    EnvironmentCode?: string
    ProgramCode?: string
    ItemSN?: number
    UnitSN?: number
    ProductSN?: string
  }): Promise<AxiosResponse<ValueResult>> {
    return fanosClient.get('/api/MainDashboard_WebApi/ReceiveTrend', { params })
  },

  getSOH(programCode?: string, itemSN?: number, unitSN?: number): Promise<AxiosResponse<ValueResult>> {
    return fanosClient.get('/api/MainDashboard_WebApi/SOH', {
      params: { ProgramCode: programCode, ItemSN: itemSN, UnitSN: unitSN },
    })
  },

  getSupplier(programCode?: string, itemSN?: number, unitSN?: number): Promise<AxiosResponse<ValueResult>> {
    return fanosClient.get('/api/MainDashboard_WebApi/Supplier', {
      params: { ProgramCode: programCode, ItemSN: itemSN, UnitSN: unitSN },
    })
  },

  getSupplierPerformance(programCode?: string, itemSN?: number, unitSN?: number): Promise<AxiosResponse<ValueResult>> {
    return fanosClient.get('/api/MainDashboard_WebApi/SupplierPerformance', {
      params: { ProgramCode: programCode, ItemSN: itemSN, UnitSN: unitSN },
    })
  },

  getTrend(programCode?: string, itemSN?: number, unitSN?: number): Promise<AxiosResponse<ValueResult>> {
    return fanosClient.get('/api/MainDashboard_WebApi/Trend', {
      params: { ProgramCode: programCode, ItemSN: itemSN, UnitSN: unitSN },
    })
  },

  getUserLog(programCode?: string, itemSN?: number, unitSN?: number): Promise<AxiosResponse<ValueResult>> {
    return fanosClient.get('/api/MainDashboard_WebApi/UserLog', {
      params: { ProgramCode: programCode, ItemSN: itemSN, UnitSN: unitSN },
    })
  },

  getUsers(programCode?: string, itemSN?: number, unitSN?: number): Promise<AxiosResponse<ValueResult>> {
    return fanosClient.get('/api/MainDashboard_WebApi/Users', {
      params: { ProgramCode: programCode, ItemSN: itemSN, UnitSN: unitSN },
    })
  },
}

// ─── LookUp ────────────────────────────────────────────────────────────────

export interface CurrentDateModel {
  CurrentDate: string
  NoMonth: number
  NoDay: number
  NameYear: string
  NameMonth: string
  NameDay: string
}

export type CurrentDateResult = ListResult<CurrentDateModel>

export interface CurrentFiscalYearModel {
  FiscalYear: string
}

export type CurrentFiscalYearResult = ListResult<CurrentFiscalYearModel>

export interface FiscalYearsListModel {
  FiscalYear: string
  IsCurrent: boolean
  StartDate: string
  EndDate: string
}

export type FiscalYearsListResult = ListResult<FiscalYearsListModel>

export interface UserEnvironmentListModel {
  Environment: string
  EnvironmentCode: string
  EnvironmentGroup: string
  EnvironmentGroupCode: string
}

export type UserEnvironmentListResult = ListResult<UserEnvironmentListModel>

export const LookUp = {
  getCurrentDate(): Promise<AxiosResponse<CurrentDateResult>> {
    return fanosClient.get('/api/LookUp/CurrentDate')
  },

  getCurrentFiscalYear(): Promise<AxiosResponse<CurrentFiscalYearResult>> {
    return fanosClient.get('/api/LookUp/CurrentFiscalYear')
  },

  getFiscalYearList(): Promise<AxiosResponse<FiscalYearsListResult>> {
    return fanosClient.get('/api/LookUp/FiscalYearList')
  },

  getUserEnvironmentList(): Promise<AxiosResponse<UserEnvironmentListResult>> {
    return fanosClient.get('/api/LookUp/UserEnvironmentList')
  },
}

// ─── MenuItem_WebApi ───────────────────────────────────────────────────────

export interface MenuItemModel {
  MenuItemID: number
  DisplayText: string
  URL: number
  DisplayOrder: string
  ParentMenuItemID: number
  CommodityTypeID: number
  ItemNameSH: string
  IsActive: boolean
  ResourceType: string
}

export type MenuItemResult = ListResult<MenuItemModel>

export interface MenuItemExtendedDescriptionModel {
  RowNumber: number
  MenuItemID: number
  DisplayText: string
  Description: string
  DescriptionExtended: string
  URL: string
  fulllink: string
}

export type MenuItemExtendedDescriptionResult = ListResult<MenuItemExtendedDescriptionModel>

export const MenuItem_WebApi = {
  getExtendedDescription(menuItemID?: string, displayText?: string, description?: string, descriptionExtended?: string, url?: string, fullLink?: string): Promise<AxiosResponse<MenuItemExtendedDescriptionResult>> {
    return fanosClient.get('/api/MenuItem_WebApi/ExtendedDescription', {
      params: { MenuItemID: menuItemID, DisplayText: displayText, Description: description, DescriptionExtended: descriptionExtended, URL: url, fulllink: fullLink },
    })
  },

  getMenuItem(username?: string): Promise<AxiosResponse<MenuItemResult>> {
    return fanosClient.get('/api/MenuItem_WebApi/MenuItem', {
      params: { Username: username },
    })
  },
}

// ─── Permission ────────────────────────────────────────────────────────────

export interface PagesModel {
  PageID: number
  PageName: string
  PageDescription: string
  PageUrl: string
  IsActive: boolean
}

export type PagesResult = ListResult<PagesModel>

export interface GroupModel {
  GroupID: number
  GroupName: string
  GroupCode: string
  GroupDescription: string
  IsActive: boolean
}

export type GroupResult = ListResult<GroupModel>

export interface GroupPagesModel {
  GroupPageID: number
  GroupID: number
  GroupName: string
  PageID: number
  PageName: string
}

export type GroupPagesResult = ListResult<GroupPagesModel>

export interface ProgramGroupModel {
  ProgramGroupID: number
  ProgramID: number
  ProgramName: string
  GroupID: number
  GroupName: string
  ProgramCode: string
}

export type ProgramGroupResult = ListResult<ProgramGroupModel>

export interface UserPagesModel {
  UserPageID: number
  UserID: number
  PageID: number
  FullName: string
  PageName: string
}

export type UserPagesResult = ListResult<UserPagesModel>

export const Permission = {
  adminAddGroup(groupModel: GroupModel[]): Promise<AxiosResponse<IHttpActionResult>> {
    return fanosClient.post('/api/Permission/adminAddGroup', groupModel)
  },

  adminAddGroupPages(groupPagesModel: GroupPagesModel[]): Promise<AxiosResponse<IHttpActionResult>> {
    return fanosClient.post('/api/Permission/adminAddGroupPages', groupPagesModel)
  },

  adminAddPages(pagesModel: PagesModel[]): Promise<AxiosResponse<IHttpActionResult>> {
    return fanosClient.post('/api/Permission/adminAddPages', pagesModel)
  },

  adminAddProgramGroup(programGroupModel: ProgramGroupModel[]): Promise<AxiosResponse<IHttpActionResult>> {
    return fanosClient.post('/api/Permission/adminAddProgramGroup', programGroupModel)
  },

  adminAddUserOnlyPagePermissions(userPagesModel: UserPagesModel[]): Promise<AxiosResponse<IHttpActionResult>> {
    return fanosClient.post('/api/Permission/adminAddUserOnlyPagePermissions', userPagesModel)
  },

  adminDeleteGroupPages(groupPagesModel: GroupPagesModel[]): Promise<AxiosResponse<IHttpActionResult>> {
    return fanosClient.post('/api/Permission/adminDeleteGroupPages', groupPagesModel)
  },

  adminDeleteProgramGroup(programGroupModel: ProgramGroupModel[]): Promise<AxiosResponse<IHttpActionResult>> {
    return fanosClient.post('/api/Permission/adminDeleteProgramGroup', programGroupModel)
  },

  adminDeleteUserOnlyPagePermissions(userPagesModel: UserPagesModel[]): Promise<AxiosResponse<IHttpActionResult>> {
    return fanosClient.post('/api/Permission/adminDeleteUserOnlyPagePermissions', userPagesModel)
  },

  adminGetAllGroupPages(): Promise<AxiosResponse<GroupPagesResult>> {
    return fanosClient.get('/api/Permission/adminGetAllGroupPages')
  },

  adminGetAllGroups(): Promise<AxiosResponse<GroupResult>> {
    return fanosClient.get('/api/Permission/adminGetAllGroups')
  },

  adminGetAllPages(): Promise<AxiosResponse<PagesResult>> {
    return fanosClient.get('/api/Permission/adminGetAllPages')
  },

  adminGetAllProgramGroup(): Promise<AxiosResponse<ProgramGroupResult>> {
    return fanosClient.get('/api/Permission/adminGetAllProgramGroup')
  },

  adminGetUserOnlyPages(): Promise<AxiosResponse<UserPagesResult>> {
    return fanosClient.get('/api/Permission/adminGetUserOnlyPages')
  },

  adminUpdateGroup(groupModel: GroupModel[]): Promise<AxiosResponse<IHttpActionResult>> {
    return fanosClient.post('/api/Permission/adminUpdateGroup', groupModel)
  },

  adminUpdateGroupPages(groupPagesModel: GroupPagesModel[]): Promise<AxiosResponse<IHttpActionResult>> {
    return fanosClient.post('/api/Permission/adminUpdateGroupPages', groupPagesModel)
  },

  adminUpdatePages(pagesModel: PagesModel[]): Promise<AxiosResponse<IHttpActionResult>> {
    return fanosClient.post('/api/Permission/adminUpdatePages', pagesModel)
  },

  adminUpdateProgramGroup(programGroupModel: ProgramGroupModel[]): Promise<AxiosResponse<IHttpActionResult>> {
    return fanosClient.post('/api/Permission/adminUpdateProgramGroup', programGroupModel)
  },

  adminUpdateUserOnlyPagePermissions(userPagesModel: UserPagesModel[]): Promise<AxiosResponse<IHttpActionResult>> {
    return fanosClient.post('/api/Permission/adminUpdateUserOnlyPagePermissions', userPagesModel)
  },
}

// ─── SS_WebApi ──────────────────────────────────────────────────────────────

export interface NationalstockutilizationModel {
  RowNumber: number
  ProductName: string
  ProductNameSH: string
  ProductSN: number
  ProductCN: string
  unit: string
  SOH: number
  AMC: number
  QuantityReceived: number
  QuantityIssued: number
  QuantityExpired: number
  QuantityDamaged: number
  QuantityReserved: number
  QuantitySuspended: number
  InventoryIssued: number
  SOHAmtBirr: number
  ReceivedAmtBirr: number
  IssuedAmtBirr: number
  ExpiredAmtBirr: number
  DamagedAmtBirr: number
  ReservedAmtBirr: number
  SuspendedAmtBirr: number
}

export type NationalstockutilizationResult = ListResult<NationalstockutilizationModel>

export const SS_WebApi = {
  getNationalstockutilization(params?: {
    ModeCode?: string
    ProgramCode?: string
    OrderBy?: string
  }): Promise<AxiosResponse<NationalstockutilizationResult>> {
    return fanosClient.get('/api/SS_WebApi/Nationalstockutilization', { params })
  },

  getMOSShareBySite(params?: {
    ModeCode?: string
    ProgramCode?: string
    OrderBy?: string
    EnvironmentGroupCode?: string
  }): Promise<AxiosResponse<ListResult<Record<string, unknown>>>> {
    return fanosClient.get('/api/SS_WebApi/MOSShareBySite', { params })
  },

  getEnvironmentSOHByDate(params?: {
    ModeCode?: string
    EnvironmentGroupCode?: string
    OrderBy?: string
    TransactionDate?: string
    ProgramCode?: string
  }): Promise<AxiosResponse<ListResult<Record<string, unknown>>>> {
    return fanosClient.get('/api/SS_WebApi/EnvironmentSOHByDate', { params })
  },

  getPoRiRcByDP(params?: {
    ModeCode?: string
    ProgramCode?: string
    ProductSN?: string
  }): Promise<AxiosResponse<ListResult<Record<string, unknown>>>> {
    return fanosClient.get('/api/SS_WebApi/PoRiRcByDP', { params })
  },

  getSS_UnitSOH(params?: {
    ModeCode?: string
    ProgramCode?: string
    ProductSN?: string
  }): Promise<AxiosResponse<ListResult<Record<string, unknown>>>> {
    return fanosClient.get('/api/SS_WebApi/SS_UnitSOH', { params })
  },

  getSOHbyIWACC(params?: {
    ModeCode?: string
    ProductSN?: string
    OrderBy?: string
    ProgramCode?: string
  }): Promise<AxiosResponse<ListResult<Record<string, unknown>>>> {
    return fanosClient.get('/api/SS_WebApi/SOHbyIWACC', { params })
  },

  getSOHbyIWAct(params?: {
    ModeCode?: string
    ProductSN?: string
    OrderBy?: string
    ProgramCode?: string
  }): Promise<AxiosResponse<ListResult<Record<string, unknown>>>> {
    return fanosClient.get('/api/SS_WebApi/SOHbyIWAct', { params })
  },

  getNationalMOS(params?: {
    ModeCode?: string
    ProductSN?: string
  }): Promise<AxiosResponse<ListResult<Record<string, unknown>>>> {
    return fanosClient.get('/api/SS_WebApi/NationalMOS', { params })
  },

  getStockutilizationByEnvironment(params?: {
    ModeCode?: string
    EnvironmentGroupCode?: string
    ProductSN?: string
    OrderBy?: string
  }): Promise<AxiosResponse<ListResult<Record<string, unknown>>>> {
    return fanosClient.get('/api/SS_WebApi/stockutilizationByEnvironment', { params })
  },

  getSohNearyExpiryBreakdownByEnvironment(params?: {
    ModeCode?: string
    EnvironmentGroupCode?: string
    ProductSN?: string
  }): Promise<AxiosResponse<ListResult<Record<string, unknown>>>> {
    return fanosClient.get('/api/SS_WebApi/SohNearyExpiryBreakdownByEnvironment', { params })
  },

  getDaysOutOfStockBySite(params?: {
    ModeCode?: string
    EnvironmentGroupCode?: string
    ProductSN?: string
    From?: string
    To?: string
  }): Promise<AxiosResponse<ListResult<Record<string, unknown>>>> {
    return fanosClient.get('/api/SS_WebApi/DaysOutOfStockBySite', { params })
  },

  getSOHByRegion(params?: {
    ModeCode?: string
    ProductSN?: string
  }): Promise<AxiosResponse<ListResult<Record<string, unknown>>>> {
    return fanosClient.get('/api/SS_WebApi/SOHByRegion', { params })
  },
}

// ─── OIH_WebApi ─────────────────────────────────────────────────────────────

export interface DistributionByFacilityTypePerItemModel {
  ProductCN: string
  HealthCenter: number
  Hospital: number
  Others: number
  Woreda: number
}

export type DistributionByFacilityTypePerItemResult = ListResult<DistributionByFacilityTypePerItemModel>

export const OIH_WebApi = {
  getDistributionByFacilityTypePerItem(params?: {
    FiscalYear?: string
    ModeCode?: string
    ProgramCode?: string
    OrderBy?: string
  }): Promise<AxiosResponse<DistributionByFacilityTypePerItemResult>> {
    return fanosClient.get('/api/OIH_WebApi/DistributionByFacilityTypePerItem', { params })
  },

  getDistributionByFacilityType(params?: {
    FiscalYear?: string
    ModeCode?: string
    ProgramCode?: string
    ProductSN?: string
  }): Promise<AxiosResponse<ListResult<Record<string, unknown>>>> {
    return fanosClient.get('/api/OIH_WebApi/DistributionByFacilityType', { params })
  },

  getDistributionByOwnershipType(params?: {
    ModeCode?: string
    ProgramCode?: string
    FiscalYear?: string
    ProductSN?: string
  }): Promise<AxiosResponse<ListResult<Record<string, unknown>>>> {
    return fanosClient.get('/api/OIH_WebApi/DistributionByOwnershipType', { params })
  },

  getItemDistributionHub2Facility(params?: {
    ModeCode?: string
    PageSize?: number
    Page?: number
    ProgramCode?: string
    From?: string
    To?: string
    ProductSN?: string
  }): Promise<AxiosResponse<ListResult<Record<string, unknown>>>> {
    return fanosClient.get('/api/OIH_WebApi/ItemDistributionHub2Facility', { params })
  },

  getItemDistributionHubToFacilityByProgram(params?: {
    ModeCode?: string
    ProgramCode?: string
    From?: string
    To?: string
    EnvironmentCode?: string
  }): Promise<AxiosResponse<ListResult<Record<string, unknown>>>> {
    return fanosClient.get('/api/OIH_WebApi/ItemDistributionHubToFacilityByProgram', { params })
  },

  getItemDistributionCenterToHubByProgram(params?: {
    ModeCode?: string
    ProgramCode?: string
    From?: string
    To?: string
    EnvironmentCode?: string
  }): Promise<AxiosResponse<ListResult<Record<string, unknown>>>> {
    return fanosClient.get('/api/OIH_WebApi/ItemDistributionCenterToHubByProgram', { params })
  },

  getDPlanVsIssued(params?: {
    ModeCode?: string
    Year?: string
    ProgramCode?: string
    FiscalYear?: string
  }): Promise<AxiosResponse<ListResult<Record<string, unknown>>>> {
    return fanosClient.get('/api/OIH_WebApi/DPlanVsIssued', { params })
  },
}

// ─── POD_WebApi ──────────────────────────────────────────────────────────────

export interface ItemProcurerPerItemModel {
  ProductCN: string
  [procurer: string]: string | number
}

export type ItemProcurerPerItemResult = ListResult<ItemProcurerPerItemModel>

export interface ItemProcurerModel {
  Procurer?: string
  Count?: number
  FiscalYear?: string
  [key: string]: unknown
}

export type ItemProcurerResult = ListResult<ItemProcurerModel>

export const POD_WebApi = {
  getItemProcurerPerItem(params?: {
    FiscalYear?: string
    ModeCode?: string
    ProgramCode?: string
    OrderBy?: string
  }): Promise<AxiosResponse<ItemProcurerPerItemResult>> {
    return fanosClient.get('/api/POD_WebApi/ItemProcurerPerItem', { params })
  },

  getItemProcurer(params?: {
    ModeCode?: string
    ProgramCode?: string
    FiscalYear?: string
    ProductSN?: string
  }): Promise<AxiosResponse<ItemProcurerResult>> {
    return fanosClient.get('/api/POD_WebApi/ItemProcurer', { params })
  },

  getItemFundingSourceAndProcurer(params?: {
    ModeCode?: string
    ProgramCode?: string
    FiscalYear?: string
    ProductSN?: string
  }): Promise<AxiosResponse<ItemProcurerResult>> {
    return fanosClient.get('/api/POD_WebApi/ItemFundingSourceAndProcurer', { params })
  },

  getEnvironmentList(params?: {
    EnvironmentGroupCode?: string
  }): Promise<AxiosResponse<ListResult<Record<string, unknown>>>> {
    return fanosClient.get('/api/POD_WebApi/EnvironmentList', { params })
  },
}

// ─── POHRIHRCH_WebApi ───────────────────────────────────────────────────────

export interface CenterPipeline3Model {
  ProductCN: string
  PurchaseOrdered: number
  BelowMax: number
  AboveMax: number
  ProjectedDaysOutOfStock: number
  InvoicedM: number
  [key: string]: unknown
}

export type CenterPipeline3Result = ListResult<CenterPipeline3Model>

export const POHRIHRCH_WebApi = {
  getCenterPipeline3(params?: {
    ModeCode?: string
    ProgramCode?: string
    OrderBy?: string
  }): Promise<AxiosResponse<CenterPipeline3Result>> {
    return fanosClient.get('/api/POHRIHRCH_WebApi/CenterPipeline3', { params })
  },

  getHubPipelineByEnvironment(params?: {
    ModeCode?: string
    EnvironmentGroupCode?: string
    ProductSN?: string
    OrderBy?: string
  }): Promise<AxiosResponse<ListResult<Record<string, unknown>>>> {
    return fanosClient.get('/api/POHRIHRCH_WebApi/HubPipelineByEnvironment', { params })
  },
}

// ─── BinCard_WebApi ────────────────────────────────────────────────────────────

export const BinCard_WebApi = {
  getManufacturerSOH(params?: {
    ModeCode?: string
    ProgramCode?: string
    ProductSN?: string
    OrderBy?: string
  }): Promise<AxiosResponse<ListResult<Record<string, unknown>>>> {
    return fanosClient.get('/api/BinCard_WebApi/ManufacturerSOH', { params })
  },
}

// ─── RCD_WebApi ────────────────────────────────────────────────────────────────

export const RCD_WebApi = {
  getProgramManufacturer(params?: {
    ModeCode?: string
    FiscalYear?: string
    OrderBy?: string
    ProgramCode?: string
  }): Promise<AxiosResponse<ListResult<Record<string, unknown>>>> {
    return fanosClient.get('/api/RCD_WebApi/ProgramManufacturer', { params })
  },
  getItemByManufacturer(params?: {
    ModeCode?: string
    FiscalYear?: string
    OrderBy?: string
    ProgramCode?: string
    ProductSN?: string
  }): Promise<AxiosResponse<ListResult<Record<string, unknown>>>> {
    return fanosClient.get('/api/RCD_WebApi/ItemByManufacturer', { params })
  },
  getItemBySupplier(params?: {
    ModeCode?: string
    FiscalYear?: string
    ProgramCode?: string
    ProductSN?: string
  }): Promise<AxiosResponse<ListResult<Record<string, unknown>>>> {
    return fanosClient.get('/api/RCD_WebApi/ItemBySupplier', { params })
  },
  getItemCountry(params?: {
    ModeCode?: string
    FiscalYear?: string
    ProgramCode?: string
    OrderBy?: string
    ProductSN?: string
  }): Promise<AxiosResponse<ListResult<Record<string, unknown>>>> {
    return fanosClient.get('/api/RCD_WebApi/ItemCountry', { params })
  },
  getProgramPipeline(params?: {
    ModeCode?: string
    ProgramCode?: string
  }): Promise<AxiosResponse<ListResult<Record<string, unknown>>>> {
    return fanosClient.get('/api/RCD_WebApi/ProgramPipeline', { params })
  },
  getSAPProgramPipeline(params?: {
    ModeCode?: string
    ProgramCode?: string
  }): Promise<AxiosResponse<ListResult<Record<string, unknown>>>> {
    return fanosClient.get('/api/RCD_WebApi/SAPProgramPipeline', { params })
  },
}

// ─── FR_WebApi ────────────────────────────────────────────────────────────────

export const FR_WebApi = {
  getOrderFillRate(params?: {
    ModeCode?: string
    ProgramCode?: string
  }): Promise<AxiosResponse<ListResult<Record<string, unknown>>>> {
    return fanosClient.get('/api/FR_WebApi/OrderFillRate', { params })
  },
}

// ─── IUBVIUI_WebApi ─────────────────────────────────────────────────────────────

export const IUBVIUI_WebApi = {
  getProgramProducts(params?: {
    ModeCode?: string
    EnvironmentTypeCode?: string
    OrderBy?: string
    ProgramCode?: string
  }): Promise<AxiosResponse<ListResult<Record<string, unknown>>>> {
    return fanosClient.get('/api/IUBVIUI_WebApi/ProgramProducts', { params })
  },
}

// ─── OIDRCD_WebApi ──────────────────────────────────────────────────────────

export const OIDRCD_WebApi = {
  getByDateIU_MostRecentIssueReceive(params?: {
    ModeCode?: string
    ProductSN?: string
    From?: string
    To?: string
  }): Promise<AxiosResponse<ListResult<Record<string, unknown>>>> {
    return fanosClient.get('/api/OIDRCD_WebApi/ByDateIU_MostRecentIssueReceive', { params })
  },
}

// ─── Backward-compatible re-exports for existing code (auth.ts) ────────────

export async function getEnvironments(): Promise<En_ByEnvironmentCodeModel[]> {
  const { data } = await EN_WebApi.getByEnvironmentCode()
  const envs = data?.Data || []
  envs.push({
    RowNumber: 0,
    Environment: 'Others',
    EnvironmentCode: '',
    EnvironmentGroup: '',
    EnvironmentGroupCode: '',
    CommonName: 'Others',
    EnvironmentID: 0,
  })
  return envs
}

export async function platformAuth(
  username: string,
  password: string,
  environmentCode: string,
): Promise<AxiosResponse<PlatformAuthResponse>> {
  return AccountManager.platformAuth(username, password, environmentCode)
}

export default fanosClient
