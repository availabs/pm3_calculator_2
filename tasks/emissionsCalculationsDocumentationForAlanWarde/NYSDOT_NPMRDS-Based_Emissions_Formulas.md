# NYSDOT NPMRDS-Based Emissions Formulas

DATE: 2021-12-06

The _X_ variable in the formulas below represents vehicle speed
in miles per hour.

The units for the value returned from each equation are pollutant grams per
vehicle mile.

The coefficients in the formulas below were copied directly
from the CMAQTracCalculations.xlsx file provided by NYSDOT.

## Diesel CO per Vehicle Miles Traveled

![Diesel CO Charts](./emissions_charts/diesel-CO.png)

### Speed 0-5mph

> X<sup>3</sup> \* 0.000266667 +\
> X<sup>2</sup> \* -0.0032 +\
> X&nbsp; \* -1.886466667 +\
> 15.773

### Speed 5-10mph

> X \* -0.527 +\
> 8.93;

### Speed 10-15mph

> X \* -0.1652 +\
> 5.3118;

### Speed Greater Than 15mph

> X<sup>8</sup> \* 6.6539e-13 +\
> X<sup>7</sup> \* -2.68016e-10 +\
> X<sup>6</sup> \* 4.58642e-8 +\
> X<sup>5</sup> \* -4.34255e-6 +\
> X<sup>4</sup> \* 0.000248381 +\
> X<sup>3</sup> \* -0.008793529 +\
> X<sup>2</sup> \* 0.189498333 +\
> X&nbsp; \* -2.337921606 +\
> 15.2459601

## Diesel CO<sup>2</sup> per Vehicle Miles Traveled

![Diesel CO<sup>2</sup> Charts](./emissions_charts/diesel-CO2.png)

### Speed 0-5mph

> X<sup>3</sup> \* 0.000266667 +\
> X<sup>2</sup> \* -0.0032 +\
> X&nbsp; \* -1338.172467 +\
> 10482.592

### Speed 6-10mph

> X \* -292.5435 +\
> 5254.4008;

### Speed 10-15mph

> X \* -75.1704 +\
> 3080.6692;

### Speed Greater Than 15mph

> X<sup>8</sup> \* 2.67074e-9 +\
> X<sup>7</sup> \* -1.01958e-6 +\
> X<sup>6</sup> \* 0.000165527 +\
> X<sup>5</sup> \* -0.014884945 +\
> X<sup>4</sup> \* 0.808577495 +\
> X<sup>3</sup> \* -27.09115942 +\
> X<sup>2</sup> \* 545.5749265 +\
> X&nbsp; \* -6055.844792 +\
> 30224.61619

## Diesel NOx per Vehicle Miles Traveled

![Diesel NOx Charts](./emissions_charts/diesel-NOx.png)

### Speed = 0

> 35

### Speed 0-5mph

> X<sup>3</sup> \* -3.472466667 +\
> X<sup>2</sup> \* 39.9331 +\
> X&nbsp; \* -153.5734333 +\
> 218.999

### Speed 5-10mph

> X \* -1.2665 +\
> 21.7338

### Speed 10-15mph

> X \* -0.342 +\
> 12.489

### Speed Greater Than 15mph

> X<sup>8</sup> \* 7.37581e-12 +\
> X<sup>7</sup> \* -2.82611e-9 +\
> X<sup>6</sup> \* 4.60362e-7 +\
> X<sup>5</sup> \* -4.15348e-5 +\
> X<sup>4</sup> \* 0.002264465 +\
> X<sup>3</sup> \* -0.076220463 +\
> X<sup>2</sup> \* 1.545474386 +\
> X&nbsp; \* -17.36793248 +\
> 89.83646382

## Diesel PM<sub>2.5</sub> per VMT

![Diesel PM2.5 Charts](./emissions_charts/diesel-PM2_5.png)

### Speed 0-5mph

> X<sup>3</sup> \* 2.66667e-5 +\
> X<sup>2</sup> \* -0.00032 +\
> X&nbsp; \* -0.085646667 +\
> 0.6756

### Speed 5-10mph

> X \* -0.02055 +\
> 0.34548

### Speed 10-15mph

> X \* -0.00543 +\
> 0.19433

### Speed Greater Than 15mph

> X<sup>8</sup> \* 1.51102e-13 +\
> X<sup>7</sup> \* -5.78923e-11 +\
> X<sup>6</sup> \* 9.42126e-9 +\
> X<sup>5</sup> \* -8.4799e-7 +\
> X<sup>4</sup> \* 4.60277e-5 +\
> X<sup>3</sup> \* -0.001538158 +\
> X<sup>2</sup> \* 0.030850479 +\
> X&nbsp; \* -0.341326255 +\
> 1.704300144

## Diesel PM<sub>10</sub> per Vehicle Miles Traveled

![Diesel PM10 Charts](./emissions_charts/diesel-PM10.png)

### Speed 0-5mph

> X<sup>3</sup> \* 2.66667e-5 +\
> X<sup>2</sup> \* -0.00032 +\
> X&nbsp; \* -0.090246667 +\
> 0.7118

### Speed 5-10mph

> X<sup>3</sup> \* 0.001941667 +\
> X<sup>2</sup> \* -0.045771429 +\
> X&nbsp; \* 0.33010119 +\
> -0.518708571

### Speed 10-15mph

> X \* -0.0057 +\
> 0.2045

### Speed Greater Than 15mph

> X<sup>8</sup> \* 1.59025e-13 +\
> X<sup>7</sup> \* -6.08852e-11 +\
> X<sup>6</sup> \* 9.90172e-9 +\
> X<sup>5</sup> \* -8.9069e-7 +\
> X<sup>4</sup> \* 4.83196e-5 +\
> X<sup>3</sup> \* -0.001614034 +\
> X<sup>2</sup> \* 0.032361579 +\
> X&nbsp; \* -0.357979789 +\
> 1.787962468

## Diesel VOC per Vehicle Miles Traveled

![Diesel VOC Charts](./emissions_charts/diesel-VOC.png)

### Speed 0-5mph

> X<sup>3</sup> \* -0.000266667 +\
> X<sup>2</sup> \* 0.0032 +\
> X&nbsp; \* -0.669533333 +\
> 5.263

### Speed 5-10mph

> X \* -0.1812 +\
> 2.8684;

### Speed 10-15mph

> X \* -0.0605 +\
> 1.6613

### Speed Greater Than 15mph

> X<sup>8</sup> \* -1.71287e-13 +\
> X<sup>7</sup> \* 5.80467e-11 +\
> X<sup>6</sup> \* -8.16737e-9 +\
> X<sup>5</sup> \* 6.13154e-7 +\
> X<sup>4</sup> \* -2.6007e-5 +\
> X<sup>3</sup> \* 0.000585236 +\
> X<sup>2</sup> \* -0.004367529 +\
> X&nbsp; \* -0.078028096 +\
> 1.878006101

## Gasoline CO per Vehicle Miles Traveled

![Gasoline CO Charts](./emissions_charts/gasoline-CO.png)

### Speed 0-5mph

> X<sup>3</sup> \* -0.008338028 +\
> X<sup>2</sup> \* 0.120901408 +\
> X&nbsp; \* -0.642028169 +\
> 11.64929577

### Speed 5-10mph

> X \* -0.371457143 +\
> 7.357428571

### Speed 10-15mph

> X \* -0.120628571 +\
> 4.849190476

### Speed Greater Than 15mph

> X<sup>4</sup> \* 0.00000159649120061955 +\
> X<sup>3</sup> \* -0.000284041235436914 +\
> X<sup>2</sup> \* 0.0185137829206778 +\
> X&nbsp; \* -0.529304763588869 +\
> 7.81691944721381

## Gasoline CO<sup>2</sup> per Vehicle Miles Traveled

![Gasoline CO² Charts](./emissions_charts/gasoline-CO2.png)

### Speed 0-5mph

> X<sup>3</sup> \* -1.786130141 +\
> X<sup>2</sup> \* 25.89908704 +\
> X&nbsp; \* -137.5339208 +\
> 2313.723479

### Speed 5-10mph

> X \* -79.1132 +\
> 1391.9958;

### Speed 10-15mph

> X \* -25.4105 +\
> 854.9693;

### Speed Greater Than 15mph

> X<sup>5</sup> \* -7.07889e-7 +\
> X<sup>4</sup> \* 0.000255182 +\
> X<sup>3</sup> \* -0.032716074 +\
> X<sup>2</sup> \* 1.984300836 +\
> X&nbsp; \* -59.56931737 +\
> 1025.122694

## Gasoline NOx per Vehicle Miles Traveled

![Gasoline NOx Charts](./emissions_charts/gasoline-NOx.png)

### Speed 0-5mph

> X<sup>3</sup> \* -0.000326761 +\
> X<sup>2</sup> \* 0.004738028 +\
> X&nbsp; \* -0.025160563 +\
> 0.576985915

### Speed 5-10mph

> X \* -0.0154 +\
> 0.4132

### Speed 10-15mph

> X \* -0.0067 +\
> 0.3265

### Speed Greater Than 15mph

> X<sup>4</sup> \* 6.895040054454e-8 +\
> X<sup>3</sup> \* -0.0000122163183601124 +\
> X<sup>2</sup> \* 0.000801929122505491 +\
> X&nbsp; \* -0.022556608875589 +\
> 0.425329165353686

## Gasoline PM<sub>2.5</sub> per Vehicle Miles Traveled

![Gasoline PM₂.₅ Charts](./emissions_charts/gasoline-PM2_5.png)

### Speed 0-5mph

> X<sup>3</sup> \* 0.000005314554 +\
> X<sup>2</sup> \* -0.000030394366 +\
> X&nbsp; \* -0.000100779343 +\
> 0.007397183099

### Speed 5-10mph

> X<sup>4</sup> \* 0.0000166667 +\
> X<sup>3</sup> \* 0.0005333333 +\
> X<sup>2</sup> \* 0.0063333333 +\
> X&nbsp; \* 0.0333166667 +\
> 0.0697

### Speed 10-15mph

> X<sup>4</sup> \* -0.0000125 +\
> X<sup>3</sup> \* 0.0006583333 +\
> X<sup>2</sup> \* -0.0129375 +\
> X&nbsp; \* 0.1122916667 +\
> -0.3599

### Speed Greater Than 15mph

> X<sup>8</sup> \* -0.00000000000000594974 +\
> X<sup>7</sup> \* 0.00000000000222380912 +\
> X<sup>6</sup> \* -0.00000000035695915395 +\
> X<sup>5</sup> \* 0.00000003205637142505 +\
> X<sup>4</sup> \* -0.00000175216544229806 +\
> X<sup>3</sup> \* 0.0000591574587486047 +\
> X<sup>2</sup> \* -0.00118960955018472 +\
> X&nbsp; \* 0.0128505160077922 +\
> -0.0542360222640602

## Gasoline PM<sub>10</sub> per Vehicle Miles Traveled

![Gasoline PM₁₀ Charts](./emissions_charts/gasoline-PM10.png)

### Speed 0-5mph

> X<sup>3</sup> \* -5.6338e-6 +\
> X<sup>2</sup> \* 8.16901e-5 +\
> X&nbsp; \* -0.000433803 +\
> 0.00915493

### Speed 5-10mph

> X<sup>4</sup> \* -1.66667e-5 +\
> X<sup>3</sup> \* 0.000533333 +\
> X<sup>2</sup> \* -0.006333333 +\
> X&nbsp; \* 0.032816667 +\
> -0.0578

### Speed 10-15mph

> X<sup>4</sup> \* 1.66667e-5 +\
> X<sup>3</sup> \* -0.000866667 +\
> X<sup>2</sup> \* 0.016833333 +\
> X&nbsp; \* -0.144883333 +\
> 0.47

### Speed Greater Than 15mph

> X<sup>8</sup> \* -5.92599e-15 +\
> X<sup>7</sup> \* 2.31631e-12 +\
> X<sup>6</sup> \* -3.88249e-10 +\
> X<sup>5</sup> \* 3.63135e-8 +\
> X<sup>4</sup> \* -2.05988e-6 +\
> X<sup>3</sup> \* 7.18938e-5 +\
> X<sup>2</sup> \* -0.00148959 +\
> X&nbsp; \* 0.016547552 +\
> -0.072179798

## Gasoline VOC per Vehicle Miles Traveled

![Gasoline VOC Charts](./emissions_charts/gasoline-VOC.png)

### Speed 0-5mph

> X<sup>3</sup> \* -0.00051831 +\
> X<sup>2</sup> \* 0.007515493 +\
> X&nbsp; \* -0.039909859 +\
> 0.663253521

### Speed 5-10mph

> X \* -0.023 +\
> 0.396

### Speed 10-15mph

> X \* -0.0075 +\
> 0.2407

### Speed 15mph and above

> X<sup>4</sup> \* 0.000000033001309 +\
> X<sup>3</sup> \* -0.000006244064527 +\
> X<sup>2</sup> \* 0.000448572566697 +\
> X&nbsp; \* -0.014982528309102 +\
> 0.271878657023084
