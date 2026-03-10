export const CE_API_BASE = (typeof window !== 'undefined' && (window as any)['__OMNI_CE_API_BASE__'])
  || 'http://localhost:8052/api/ce';
