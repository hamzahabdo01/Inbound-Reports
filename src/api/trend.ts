import trendData from '../data/performance-and-leadtime/POTrend.json';

export const getTrendData = () => {
  return trendData.data.map(item => ({
    date: new Date(item.periodStartDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }),
    amount: item.totalAmount
  }));
};
