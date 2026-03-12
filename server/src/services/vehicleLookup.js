const API_URL = 'https://data.gov.il/api/3/action/datastore_search';

const RESOURCES = {
  main:      '053cea08-09bc-40ec-8f7a-156f0677aff3', // נתוני רכב בסיסיים
  ownership: 'bb2355dc-9ec7-4f06-9c3f-3344672171da', // היסטוריית בעלות
  technical: '56063a99-8a3e-4ff4-912e-5966c0279bad', // ק"מ בטסט + שינויים
  wltp:      '142afde2-6228-49f9-8a29-9b6c3a0cbe40', // WLTP + זיהום
  recalls:   '36bf1404-0be4-49d2-82dc-2f1ead4a8b93', // ריקולים
};

async function query(resourceId, filters = {}, useUpperCase = false) {
  try {
    const filterKey = useUpperCase ? 'MISPAR_RECHEV' : 'mispar_rechev';
    const body = {
      resource_id: resourceId,
      filters: { [filterKey]: filters.plate },
      limit: 20,
    };
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.result?.records || [];
  } catch {
    return [];
  }
}

export async function lookupVehicle(licensePlate) {
  const cleanPlate = licensePlate.replace(/[-\s]/g, '');
  const plateNum = Number(cleanPlate);

  // Run all queries in parallel
  const [mainRecords, ownershipRecords, technicalRecords, wltpRecords, recallRecords] =
    await Promise.all([
      query(RESOURCES.main,      { plate: plateNum }),
      query(RESOURCES.ownership, { plate: plateNum }),
      query(RESOURCES.technical, { plate: plateNum }),
      query(RESOURCES.wltp,      { plate: plateNum }),
      query(RESOURCES.recalls,   { plate: plateNum }, true), // uppercase key
    ]);

  if (!mainRecords.length) return null;

  const r = mainRecords[0];

  // --- Ownership history ---
  // Sort by date ascending so we can show the timeline
  const ownershipHistory = ownershipRecords
    .sort((a, b) => a.baalut_dt - b.baalut_dt)
    .map(o => ({
      date: String(o.baalut_dt), // YYYYMM format
      type: o.baalut,
    }));

  // --- Technical / test history ---
  const tech = technicalRecords[0] || null;
  const testKm         = tech?.kilometer_test_aharon || null;
  const engineNumber   = tech?.mispar_manoa || null;
  const structureChange = tech?.shinui_mivne_ind === 1;
  const colorChange    = tech?.shnui_zeva_ind === 1;
  const tireChange     = tech?.shinui_zmig_ind === 1;
  const hasGrapam      = tech?.gapam_ind === 1;
  const origin         = tech?.mkoriut_nm || null;

  // --- WLTP ---
  const wltp = wltpRecords[0] || null;

  // --- Recalls ---
  const recalls = recallRecords.map(rc => ({
    id:          rc.RECALL_ID,
    type:        rc.SUG_RECALL,
    system:      rc.SUG_TAKALA,
    description: rc.TEUR_TAKALA,
    openedDate:  rc.TAARICH_PTICHA,
  }));

  return {
    // Basic info
    licensePlate:    String(r.mispar_rechev),
    manufacturer:    r.tozeret_nm || '',
    model:           r.kinuy_mishari || r.degem_nm || '',
    year:            r.shnat_yitzur || 0,
    color:           r.tzeva_rechev || null,
    fuelType:        r.sug_delek_nm || null,
    engineModel:     r.degem_manoa || null,
    trim:            r.ramat_gimur || null,
    vin:             r.misgeret || null,
    frontTire:       r.zmig_kidmi || null,
    rearTire:        r.zmig_ahori || null,
    testExpiry:      r.tokef_dt || null,
    lastTest:        r.mivchan_acharon_dt || null,
    firstRegistered: r.moed_aliya_lakvish || null,
    ownership:       r.baalut || null,
    pollutionLevel:  r.kvutzat_zihum || null,

    // Ownership history
    ownershipHistory,

    // Technical
    engineNumber,
    testKm,          // ק"מ שנרשמו בטסט האחרון
    structureChange, // שינוי מבנה
    colorChange,     // שינוי גוון
    tireChange,      // שינוי צמיגים
    hasGrapam,       // גרפ"מ
    origin,          // מקוריות

    // WLTP
    wltp: wltp ? {
      engineCode:    wltp.degem_manoa,
      co2:           wltp.co2_wltp,
      fuelConsumption: wltp.zricat_delek_wltp,
      engineCC:      wltp.nefach_manoa,
      horsePower:    wltp.koah_sus,
    } : null,

    // Recalls
    recalls,
    hasActiveRecall: recalls.length > 0,

    _raw: r,
  };
}
