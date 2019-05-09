const tmcMetadataColMappings = new Map([
  ['State_Code', 'stateCode'],
  ['F_System', 'fSystem'],
  ['Urban_Code', 'uaCode'],
  ['Facility_Type', 'faciltype'],
  ['NHS', 'nhs'],
  ['Segment_Length', 'miles'],
  ['Directionality', 'direction'],
  ['DIR_AADT', 'directionalAadt'],
  ['OCC_FAC', 'avgVehicleOccupancy']
]);

const lottrColMappings = new Map([
  ['LOTTR_AMP', 'amp'],
  ['TT_AMP50PCT', 'amp_50_pct'],
  ['TT_AMP80PCT', 'amp_80_pct'],
  ['LOTTR_MIDD', 'midd'],
  ['TT_MIDD50PCT', 'midd_50_pct'],
  ['TT_MIDD80PCT', 'midd_80_pct'],
  ['LOTTR_PMP', 'pmp'],
  ['TT_PMP50PCT', 'pmp_50_pct'],
  ['TT_PMP80PCT', 'pmp_80_pct'],
  ['LOTTR_WE', 'we'],
  ['TT_WE50PCT', 'we_50_pct'],
  ['TT_WE80PCT', 'we_80_pct']
]);

const tttrColMappings = new Map([
  ['TTTR_AMP', 'amp'],
  ['TTT_AMP50PCT', 'amp_50_pct'],
  ['TTT_AMP95PCT', 'amp_95_pct'],
  ['TTTR_MIDD', 'midd'],
  ['TTT_MIDD50PCT', 'midd_50_pct'],
  ['TTT_MIDD95PCT', 'midd_95_pct'],
  ['TTTR_PMP', 'pmp'],
  ['TTT_PMP50PCT', 'pmp_50_pct'],
  ['TTT_PMP95PCT', 'pmp_95_pct'],
  ['TTTR_WE', 'we'],
  ['TTT_WE50PCT', 'we_50_pct'],
  ['TTT_WE95PCT', 'we_95_pct'],
  ['TTTR_OVN', 'ovn'],
  ['TTT_OVN50PCT', 'ovn_50_pct'],
  ['TTT_OVN95PCT', 'ovn_95_pct']
]);

const phedColMappings = new Map([['PHED', 'all_xdelay_phrs']]);

module.exports = {
  tmcMetadataColMappings,
  lottrColMappings,
  tttrColMappings,
  phedColMappings
};
