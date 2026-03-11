const RESOURCE_ID = '053cea08-09bc-40ec-8f7a-156f0677aff3';
const API_URL = 'https://data.gov.il/api/3/action/datastore_search';

/**
 * Lookup vehicle details by Israeli license plate number from data.gov.il
 * Free API, no key required
 */
export async function lookupVehicle(licensePlate) {
  const cleanPlate = licensePlate.replace(/[-\s]/g, '');

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resource_id: RESOURCE_ID,
      filters: { mispar_rechev: cleanPlate },
      limit: 1,
    }),
  });

  if (!response.ok) {
    throw new Error(`data.gov.il API returned ${response.status}`);
  }

  const data = await response.json();

  if (!data.success || !data.result.records.length) {
    return null;
  }

  const record = data.result.records[0];

  return {
    licensePlate: String(record.mispar_rechev),
    manufacturer: record.tozeret_nm || '',
    model: record.kinuy_mishari || record.degem_nm || '',
    year: record.shnat_yitzur || 0,
    color: record.tzeva_rechev || null,
    fuelType: record.sug_delek_nm || null,
    engineModel: record.degem_manoa || null,
    trim: record.ramat_gimur || null,
    vin: record.misgeret || null,
    frontTire: record.zmig_kidmi || null,
    rearTire: record.zmig_ahori || null,
    testExpiry: record.tokef_dt || null,
    lastTest: record.mivchan_acharon_dt || null,
    firstRegistered: record.moed_aliya_lakvish || null,
    ownership: record.baalut || null,
    // Raw data for reference
    _raw: record,
  };
}
