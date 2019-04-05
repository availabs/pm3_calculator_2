## Measure Calculator Factories

  You shouldn't need to call the calculator constructors directly.

  Each measure calculator has a factory that builds an array of calculator instances.
    Each factory is responsible for building the complete set of calculator instances
    required to satisfy its measure's portion of the overall requested output.

  Factories should completely encapsulate the relationship between the 
    which global calculatorSettings and the respective calculator's rules.
    All other modules in this project should be ignorant of such calculator specific details
    and should only interact with calculator instances through their public interfaces.
  
  Factories should also validate the configurations for their respective
    measure calculator and potentially throw if an invalid combination
    of parameters is requested.

## Measure Rules

  These are put into separate files to avoid module dependency cycles.
    calculatorSettings depends on measure rules
    utils may depend on calculatorSettings
    Calculators may depend on utils
