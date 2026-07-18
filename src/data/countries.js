const S3_FLAGS = 'https://tenantbilling-assets-382334305159.s3.eu-north-1.amazonaws.com/images/flags';

const COUNTRIES = [
  { code: 'KE', name: 'Kenya', nameEn: 'Kenya', nameFr: 'Kenya', flagImg: `${S3_FLAGS}/Kenya.png`, currency: 'KES', lang: 'en', mobileMoneyProviders: ['M-Pesa', 'Airtel Money'] },
  { code: 'TZ', name: 'Tanzania', nameEn: 'Tanzania', nameFr: 'Tanzanie', flagImg: `${S3_FLAGS}/Tanzania.png`, currency: 'TZS', lang: 'en', mobileMoneyProviders: ['M-Pesa', 'Tigo Pesa'] },
  { code: 'UG', name: 'Uganda', nameEn: 'Uganda', nameFr: 'Ouganda', flagImg: `${S3_FLAGS}/Uganda.png`, currency: 'UGX', lang: 'en', mobileMoneyProviders: ['MTN MoMo', 'Airtel Money'] },
  { code: 'RW', name: 'Rwanda', nameEn: 'Rwanda', nameFr: 'Rwanda', flagImg: `${S3_FLAGS}/Rwanda.png`, currency: 'RWF', lang: 'fr', mobileMoneyProviders: ['MTN MoMo', 'Airtel Money'] },
  { code: 'NG', name: 'Nigeria', nameEn: 'Nigeria', nameFr: 'Nigéria', flagImg: `${S3_FLAGS}/Nigeria.png`, currency: 'NGN', lang: 'en', mobileMoneyProviders: ['OPay', 'PalmPay'] },
  { code: 'GH', name: 'Ghana', nameEn: 'Ghana', nameFr: 'Ghana', flagImg: `${S3_FLAGS}/Ghana.png`, currency: 'GHS', lang: 'en', mobileMoneyProviders: ['MTN MoMo', 'Vodafone Cash'] },
  { code: 'ZA', name: 'South Africa', nameEn: 'South Africa', nameFr: 'Afrique du Sud', flagImg: `${S3_FLAGS}/South-Africa.png`, currency: 'ZAR', lang: 'en', mobileMoneyProviders: ['SnapScan'] },
  { code: 'ET', name: 'Ethiopia', nameEn: 'Ethiopia', nameFr: 'Éthiopie', flagImg: `${S3_FLAGS}/Ethiopia.png`, currency: 'ETB', lang: 'en', mobileMoneyProviders: ['Telebirr'] },
  { code: 'CD', name: 'DR Congo', nameEn: 'DR Congo', nameFr: 'RD Congo', flagImg: `${S3_FLAGS}/Democratic-republic-of-congo.png`, currency: 'CDF', lang: 'fr', mobileMoneyProviders: ['M-Pesa', 'Airtel Money'] },
  { code: 'CI', name: "Côte d'Ivoire", nameEn: "Côte d'Ivoire", nameFr: "Côte d'Ivoire", flagImg: `${S3_FLAGS}/Ivory-coast.png`, currency: 'XOF', lang: 'fr', mobileMoneyProviders: ['Orange Money', 'MTN MoMo'] },
  { code: 'SN', name: 'Senegal', nameEn: 'Senegal', nameFr: 'Sénégal', flagImg: `${S3_FLAGS}/Senegal.png`, currency: 'XOF', lang: 'fr', mobileMoneyProviders: ['Orange Money', 'Wave'] },
  { code: 'CM', name: 'Cameroon', nameEn: 'Cameroon', nameFr: 'Cameroun', flagImg: `${S3_FLAGS}/Cameroon.png`, currency: 'XAF', lang: 'fr', mobileMoneyProviders: ['MTN MoMo', 'Orange Money'] },
];

export default COUNTRIES;
