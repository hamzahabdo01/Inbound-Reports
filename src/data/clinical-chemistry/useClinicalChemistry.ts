import { useEffect, useRef, useState } from 'react';
import { IUBVIUI_WebApi, RCD_WebApi, OIH_WebApi, POD_WebApi } from '../../api/fanos';

export interface CCData {
  stockRows: any[];
  manufacturers: any[];
  suppliers: any[];
  countries: any[];
}

const DEFAULT_YEAR = 2016;

function useAsyncData<T>(fetcher: () => Promise<T>, deps: any[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);
    setError(null);
    Promise.resolve(fetcher())
      .then((result) => { if (mounted.current) setData(result); })
      .catch((e: any) => { if (mounted.current) setError(e?.message || 'Error'); })
      .finally(() => { if (mounted.current) setLoading(false); });
    return () => { mounted.current = false; };
  }, deps);

  return { data, loading, error };
}

export function useClinicalChemistry(programType = 'HPR') {
  const params = { ModeCode: programType, ProgramCode: 'CC' };

  const stock = useAsyncData(
    () => IUBVIUI_WebApi.getProgramProducts({ ...params, EnvironmentTypeCode: 'PFSAH', OrderBy: 'ProductCN' })
      .then((r) => (r?.data?.Data || []).filter((x: any) => x.ProductCN || x.productCN)),
    [programType],
  );

  const fetchMiniTable = (api: any, apiParams: any) =>
    api(apiParams).then((res: any) => {
      const rows: any[] = res?.data?.Data || [];
      const total = rows.reduce((s: number, r: any) => s + (r.TotalReceivedValueETB || r.totalReceivedValueEtb || 0), 0);
      return rows
        .map((r: any) => {
          const val = r.TotalReceivedValueETB || r.totalReceivedValueEtb || 0;
          return {
            label: r.Manufacturer || r.manufacturer || r.Supplier || r.supplier || r.Country || r.country || '',
            value: val,
            share: total > 0 ? `${((val / total) * 100).toFixed(1)}%` : '0%',
          };
        })
        .filter((r) => r.label);
    });

  const manufacturers = useAsyncData<any[]>(
    () => fetchMiniTable(RCD_WebApi.getItemByManufacturer.bind(RCD_WebApi), { ...params, FiscalYear: String(DEFAULT_YEAR), OrderBy: 'Manufacturer' }),
    [programType],
  );
  const suppliers = useAsyncData<any[]>(
    () => fetchMiniTable(RCD_WebApi.getItemBySupplier.bind(RCD_WebApi), { ...params, FiscalYear: String(DEFAULT_YEAR) }),
    [programType],
  );
  const countries = useAsyncData<any[]>(
    () => fetchMiniTable(RCD_WebApi.getItemCountry.bind(RCD_WebApi), { ...params, FiscalYear: String(DEFAULT_YEAR) }),
    [programType],
  );

  const loading = stock.loading || manufacturers.loading || suppliers.loading || countries.loading;
  const error = stock.error || manufacturers.error || suppliers.error || countries.error;

  const data: CCData | null = stock.data
    ? {
        stockRows: stock.data,
        manufacturers: manufacturers.data ?? [],
        suppliers: suppliers.data ?? [],
        countries: countries.data ?? [],
      }
    : null;

  return { data, loading, error };
}

function detectLabelValue(rows: any[]) {
  if (!rows.length) return { labelKey: '', valueKey: '' };
  const ignore = new Set(['RowNumber', 'FiscalYear', 'ProductCN', 'ProductName', 'Total']);
  const labelKey =
    Object.keys(rows[0]).find((k) => /ownership|ownertype|donor|funding|source|funder|procurer|type|owner/i.test(k) && typeof rows[0][k] === 'string')
    || Object.keys(rows[0]).find((k) => typeof rows[0][k] === 'string' && !ignore.has(k))
    || '';
  const valueKey =
    Object.keys(rows[0]).find((k) => /birr|amount|count|value|total|qty|quantity/i.test(k) && typeof rows[0][k] === 'number')
    || Object.keys(rows[0]).find((k) => typeof rows[0][k] === 'number' && !ignore.has(k))
    || '';
  return { labelKey, valueKey };
}

export function useCCIssuedItems(programType: string, issuedFrom?: string, issuedTo?: string, distributionType: 'centerToHub' | 'hubToFacility' = 'centerToHub', environmentCode?: string) {
  const params = { ModeCode: programType, ProgramCode: 'CC' };
  return useAsyncData(
    async () => {
      const from = issuedFrom || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      const to = issuedTo || new Date().toISOString().slice(0, 10);
      const api = distributionType === 'hubToFacility'
        ? OIH_WebApi.getItemDistributionHubToFacilityByProgram
        : OIH_WebApi.getItemDistributionCenterToHubByProgram;
      const apiParams: any = { ...params, From: from, To: to };
      if (environmentCode) apiParams.EnvironmentCode = environmentCode;
      const res = await api(apiParams);
      return (res?.data?.Data || [])
        .filter((x: any) => x.ProductCN || x.productCN || x.ItemName || x.itemName || x.Item || x.item)
        .map((x: any, i: number) => ({
          id: x.Id ?? x.id ?? i,
          item: x.ProductCN || x.productCN || x.ItemName || x.itemName || x.Item || x.item || '',
          hub: x.Site || x.site || x.Hub || x.hub || x.Environment || x.environment || '',
          quantity: x.IssuedQuantity ?? x.issuedQuantity ?? x.Quantity ?? x.quantity ?? 0,
          invoice: x.InvoiceNo || x.invoiceNo || x.InvoiceNumber || x.invoiceNumber || '',
          date: x.IssuedDate || x.issuedDate || x.Date || x.date || '',
          region: x.Region || x.region || x.Woreda || x.woreda || '',
          amount: x.Amount ?? x.amount ?? 0,
        }));
    },
    [programType, issuedFrom, issuedTo, distributionType, environmentCode],
  );
}

export function useCCFacilityDistribution(programType: string, year: number) {
  return useAsyncData(
    async () => {
      const res = await OIH_WebApi.getDistributionByFacilityType({ ModeCode: programType, ProgramCode: 'CC', FiscalYear: String(year) });
      const rows = res?.data?.Data || [];
      if (!rows.length) return [];
      const { labelKey, valueKey } = detectLabelValue(rows);
      if (!labelKey || !valueKey) return [];
      return rows
        .map((r: any) => ({ label: String(r[labelKey] ?? ''), value: Number(r[valueKey]) || 0 }))
        .filter((r) => r.label && r.value > 0);
    },
    [programType, year],
  );
}

export function useCCOwnershipDistribution(programType: string, year: number) {
  return useAsyncData(
    async () => {
      const res = await OIH_WebApi.getDistributionByOwnershipType({ ModeCode: programType, ProgramCode: 'CC', FiscalYear: String(year) });
      const rows = res?.data?.Data || [];
      if (!rows.length) return [];
      const { labelKey, valueKey } = detectLabelValue(rows);
      if (!labelKey || !valueKey) return [];
      return rows
        .map((r: any) => ({ label: String(r[labelKey] ?? ''), value: Number(r[valueKey]) || 0 }))
        .filter((r) => r.label && r.value > 0);
    },
    [programType, year],
  );
}

export function useCCProcurementAgents(programType: string, year: number) {
  return useAsyncData(
    async () => {
      const res = await POD_WebApi.getItemProcurer({ ModeCode: programType, ProgramCode: 'CC', FiscalYear: String(year) });
      const rows = res?.data?.Data || [];
      if (!rows.length) return [];
      const { labelKey, valueKey } = detectLabelValue(rows);
      if (!labelKey || !valueKey) return [];
      return rows
        .map((r: any) => ({ label: String(r[labelKey] ?? ''), value: Number(r[valueKey]) || 0 }))
        .filter((r) => r.label && r.value > 0);
    },
    [programType, year],
  );
}

export function useCCFundingSource(programType: string, year: number) {
  return useAsyncData(
    async () => {
      const res = await POD_WebApi.getItemFundingSourceAndProcurer({ ModeCode: programType, ProgramCode: 'CC', FiscalYear: String(year) });
      const rows = res?.data?.Data || [];
      if (!rows.length) return [];
      const { labelKey, valueKey } = detectLabelValue(rows);
      if (!labelKey || !valueKey) return [];
      return rows
        .map((r: any) => ({ label: String(r[labelKey] ?? ''), value: Number(r[valueKey]) || 0 }))
        .filter((r) => r.label && r.value > 0);
    },
    [programType, year],
  );
}
