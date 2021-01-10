/*
npmrds_production=# select * from _admin_pm3_calculator_new_calculations_view ;
-[ RECORD 1 ]-+--------------------------------------------------------------------------------------------------------------------------
year          | 2020
measure_class | AUX
pm3calc_ids   | {478,479,480,482,484,485,487,488}
measures      | {EMISSIONS,FREEFLOW,PERCENT_BINS_REPORTING,PHED_FREEFLOW,PHED_TRUCK,PTI,SPEED_PERCENTILES,TED,TED_FREEFLOW,TED_TRUCK,TTI}
states        | {nj,ny,on,qc}
-[ RECORD 2 ]-+--------------------------------------------------------------------------------------------------------------------------
year          | 2020
measure_class | FHWA
pm3calc_ids   | {476,481,483,486}
measures      | {LOTTR,PHED,TTTR}
states        | {nj,ny,on,qc}
-[ RECORD 3 ]-+--------------------------------------------------------------------------------------------------------------------------
year          | 2020
measure_class | RIS
pm3calc_ids   | {477}
measures      | {EMISSIONS_RIS,PHED_FREEFLOW_RIS,PHED_RIS,PHED_TRUCK_RIS,TED_FREEFLOW_RIS,TED_RIS,TED_TRUCK_RIS}
states        | {ny}

npmrds_production=# select * from pm3_calculation_versions where year = 2020 and is_authoritative;
 id  | year | measure_class | major_version | minor_version | fix_version | prerelease_label |                    pm3calc_ids                    | changelog | is_authoritative 
-----+------+---------------+---------------+---------------+-------------+------------------+---------------------------------------------------+-----------+------------------
 240 | 2020 | AUX           |             1 |             2 |           0 | partial_year_10  | {415,417,427,428,438,439,449,450,459,465,470,475} |           | t
 241 | 2020 | FHWA          |             1 |             2 |           0 | partial_year_08  | {414,426,437,448}                                 |           | t
 246 | 2020 | RIS           |             1 |             2 |           0 | partial_year_09  | {416,460}                                         |           | t
(3 rows)

*/

BEGIN;

UPDATE pm3.pm3_calculation_versions SET is_authoritative = false WHERE id = 240;

INSERT INTO pm3.pm3_calculation_versions (
  year,
  measure_class,
  major_version,
  minor_version,
  fix_version,
  pm3calc_ids,
  is_authoritative
) VALUES (
  2020,
  'AUX',
  1,
  2,
  1,
  ARRAY[478,479,480,482,484,485,487,488],
  true
);

UPDATE pm3.pm3_calculation_versions SET is_authoritative = false WHERE id = 241;

INSERT INTO pm3.pm3_calculation_versions (
  year,
  measure_class,
  major_version,
  minor_version,
  fix_version,
  pm3calc_ids,
  is_authoritative
) VALUES (
  2020,
  'RIS',
  1,
  2,
  1,
  ARRAY[476,481,483,486],
  true
);

UPDATE pm3.pm3_calculation_versions SET is_authoritative = false WHERE id = 246;

INSERT INTO pm3.pm3_calculation_versions (
  year,
  measure_class,
  major_version,
  minor_version,
  fix_version,
  pm3calc_ids,
  is_authoritative
) VALUES (
  2020,
  'FHWA',
  1,
  2,
  1,
  ARRAY[477],
  true
);

COMMIT;
