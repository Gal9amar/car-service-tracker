const API_URL = 'https://data.gov.il/api/3/action/datastore_search';

async function govQuery(resourceId, filters = {}, limit = 20) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resource_id: resourceId, filters, limit }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.result?.records || [];
  } catch {
    return [];
  }
}

export async function lookupVehicle(licensePlate) {
  const plateNum = Number(String(licensePlate).replace(/[-\s]/g, ''));
  if (isNaN(plateNum)) return null;

  // 1. Main record
  const [mainRecs] = await Promise.all([
    govQuery('053cea08-09bc-40ec-8f7a-156f0677aff3', { mispar_rechev: plateNum }, 1),
  ]);
  if (!mainRecs.length) return null;
  const m = mainRecs[0];

  // 2. Run remaining queries in parallel (WLTP by model codes, others by plate)
  const [ownershipRecs, technicalRecs, wltpRecs, recallRecs] = await Promise.all([
    govQuery('bb2355dc-9ec7-4f06-9c3f-3344672171da', { mispar_rechev: plateNum }, 50),
    govQuery('56063a99-8a3e-4ff4-912e-5966c0279bad', { mispar_rechev: plateNum }, 1),
    govQuery('142afde2-6228-49f9-8a29-9b6c3a0cbe40', { tozeret_cd: m.tozeret_cd, degem_cd: m.degem_cd, shnat_yitzur: m.shnat_yitzur }, 1),
    govQuery('36bf1404-0be4-49d2-82dc-2f1ead4a8b93', { MISPAR_RECHEV: plateNum }, 50),
  ]);

  const tech = technicalRecs[0] || null;
  const wltp = wltpRecs[0] || null;

  // Ownership history sorted ascending
  const ownershipHistory = ownershipRecs
    .sort((a, b) => (a.baalut_dt || 0) - (b.baalut_dt || 0))
    .map(o => ({ date: String(o.baalut_dt), type: o.baalut }));

  const recalls = recallRecs.map(rc => ({
    id:          rc.RECALL_ID,
    type:        rc.SUG_RECALL,
    system:      rc.SUG_TAKALA,
    description: rc.TEUR_TAKALA,
    openedDate:  rc.TAARICH_PTICHA,
  }));

  return {
    // ── Main (053cea08) ──────────────────────────────────────
    licensePlate:       String(m.mispar_rechev),
    manufacturer:       m.tozeret_nm        || null,  // יצרן
    manufacturerCode:   m.tozeret_cd        || null,
    model:              m.kinuy_mishari     || m.degem_nm || null,  // כינוי מסחרי
    modelCode:          m.degem_nm          || null,
    modelId:            m.degem_cd          || null,
    vehicleType:        m.sug_degem         || null,  // P=פרטי M=מסחרי
    year:               m.shnat_yitzur      || 0,
    color:              m.tzeva_rechev      || null,
    colorCode:          m.tzeva_cd          || null,
    fuelType:           m.sug_delek_nm      || null,
    engineModel:        m.degem_manoa       || null,
    trim:               m.ramat_gimur       || null,
    safetyRating:       m.ramat_eivzur_betihuty || null,
    pollutionLevel:     m.kvutzat_zihum     || null,
    vin:                m.misgeret          || null,
    frontTire:          m.zmig_kidmi        || null,
    rearTire:           m.zmig_ahori        || null,
    lastTest:           m.mivchan_acharon_dt || null,
    testExpiry:         m.tokef_dt          || null,
    ownership:          m.baalut            || null,
    registrationNote:   m.horaat_rishum != null ? String(m.horaat_rishum) : null,
    firstRegistered:    m.moed_aliya_lakvish || null,

    // ── Technical (56063a99) ─────────────────────────────────
    engineNumber:    tech?.mispar_manoa           || null,
    testKm:          tech?.kilometer_test_aharon  || null,
    structureChange: tech?.shinui_mivne_ind === 1,
    hasGrapam:       tech?.gapam_ind === 1,
    colorChange:     tech?.shnui_zeva_ind === 1,
    tireChange:      tech?.shinui_zmig_ind === 1,
    firstRegisteredDate: tech?.rishum_rishon_dt   || null,
    origin:          tech?.mkoriut_nm             || null,

    // ── WLTP (142afde2) ──────────────────────────────────────
    horsePower:      wltp?.koah_sus         || null,
    engineCC:        wltp?.nefah_manoa      || null,
    weight:          wltp?.mishkal_kolel    || null,
    doors:           wltp?.mispar_dlatot    || null,
    seats:           wltp?.mispar_moshavim  || null,
    bodyType:        wltp?.merkav           || null,  // סדאן, קרוסאובר...
    driveType:       wltp?.hanaa_nm         || null,  // 4X2, 4X4
    transmission:    wltp?.automatic_ind === 1 ? 'אוטומטי' : wltp?.automatic_ind === 0 ? 'ידני' : null,
    standardType:    wltp?.sug_tkina_nm     || null,  // אירופאית...
    drivenWheels:    wltp?.hanaa_nm         || null,
    towingWithBrakes:    wltp?.kosher_grira_im_blamim  || null,
    towingWithoutBrakes: wltp?.kosher_grira_bli_blamim || null,
    airbags:         wltp?.mispar_kariot_avir || null,
    electricWindows: wltp?.mispar_halonot_hashmal || null,
    hasAC:           wltp?.mazgan_ind === 1,
    hasABS:          wltp?.abs_ind === 1,
    hasPowerSteering: wltp?.hege_koah_ind === 1,
    hasStabControl:  wltp?.bakarat_yatzivut_ind === 1,
    hasSunroof:      wltp?.halon_bagg_ind === 1,
    hasAlloyWheels:  wltp?.galgaley_sagsoget_kala_ind === 1,
    hasTrunkRack:    wltp?.argaz_ind === 1,
    // Emissions
    co2:             wltp?.kamut_CO2        || wltp?.CO2_WLTP || null,
    co2City:         wltp?.kamut_CO2_city   || null,
    co2Highway:      wltp?.kamut_CO2_hway   || null,
    nox:             wltp?.kamut_NOX        || null,
    co:              wltp?.kamut_CO         || null,
    greenScore:      wltp?.madad_yarok      || null,
    // Safety tech
    hasLaneDeparture:    wltp?.bakarat_stiya_menativ_ind === 1,
    hasForwardWarning:   wltp?.nitur_merhak_milfanim_ind === 1,
    hasBlindSpot:        wltp?.zihuy_beshetah_nistar_ind === 1,
    hasAdaptiveCruise:   wltp?.bakarat_shyut_adaptivit_ind === 1,
    hasPedestrianDetect: wltp?.zihuy_holchey_regel_ind === 1,
    hasAutoEmergencyBrake: wltp?.maarechet_ezer_labalam_ind === 1,
    hasRearCamera:       wltp?.matzlemat_reverse_ind === 1,
    hasTirePressure:     wltp?.hayshaney_lahatz_avir_batzmigim_ind === 1,
    hasFatigueAlert:     wltp?.hayshaney_hagorot_ind === 1,
    safetyScore:         wltp?.nikud_betihut || null,
    hasAutoHighBeam:     wltp?.shlita_automatit_beorot_gvohim_ind === 1,
    hasSpeedLimiter:     wltp?.bakarat_mehirut_isa === 1,
    hasAlcoLock:         wltp?.alco_lock === 1,

    // ── Ownership history (bb2355dc) ─────────────────────────
    ownershipHistory,

    // ── Recalls (36bf1404) ───────────────────────────────────
    recalls,
    hasActiveRecall: recalls.length > 0,
  };
}
