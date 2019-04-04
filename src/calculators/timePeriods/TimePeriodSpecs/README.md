# Time Period Specifications 

## Constraints

1. All time period specifications are defined in this directory.

1.1 The calculators can specify subsets of the time periods defined
  in this directory as their default timePeriodSpec, but should not
  define time periods themselves.

2. Cli flags can directly request the specifications defined in this directory,
  however the measure-specific timePeriodSpec subsets can only be requested
  for their respective measure by the name `MEASURE_DEFAULT_TIME_PERIOD_SPEC`.
  
2.1 Because of constraint 1.1, the consequence of constraint 2 is simply 
  that all timePeriodSpecs are always requestable, but not necessarily excludeable. 

## Adding a timePeriodSpec

1. Create a spec file
2. Register the spec name in ./index.js
