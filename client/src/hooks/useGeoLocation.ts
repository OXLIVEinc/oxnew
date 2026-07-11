// Hardcoded to NGN — no dynamic currency detection to prevent VPN exploits
interface GeoInfo {
  country: string;
  countryCode: string;
  currency: string;
  currencySymbol: string;
}

const GEO: GeoInfo = {
  country: 'Nigeria',
  countryCode: 'NG',
  currency: 'NGN',
  currencySymbol: '₦',
};

export const useGeoLocation = () => GEO;
