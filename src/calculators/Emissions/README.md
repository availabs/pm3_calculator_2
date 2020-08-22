# Emissions

## Pivotal Task

> Create new measures C02 output, C02 output cars, C02 output Trucks as well as
> Avg versions of these measures.
>
> This is calculated similarly to Hours of Delay except that for each time bin
> the speed and vmt (aadt disag * length ) (which needs to be seperated in to
> car and truck) needs to be used in the following curve.
>
> I have attached below a code snippet sent my DOT which may be easier to copy
> the curves from.
>
> Similar to Hours of delay these measures should be summative across the time
> bounds selected unless the avg version is selected.
>
> Car Curve Equations:
>
> when (speed>=0 and speed<2.5) then (vmtc((speed-335.3)+2756))
>
> when (speed>=2.5 and speed<5) then (vmtc((speed-335.3)+2756))
>
> when (speed>=5 and speed<10) then (vmtc((speed-83.73)+1498))
>
> when (speed>=10 and speed<15) then (vmtc((speed-28.08)+942))
>
> when (speed>=15 and speed<20) then (vmtc((speed-14.25)+734))
>
> when (speed>=20 and speed<25) then (vmtc((speed-9.466)+639))
>
> when (speed>=25 and speed<30) then (vmtc((speed-8.471)+614))
>
> when (speed>=30 and speed<35) then (vmtc((speed-3.775)+473))
>
> when (speed>=35 and speed<40) then (vmtc((speed-2.259)+420))
>
> when (speed>=40 and speed<45) then (vmtc((speed-1.685)+397))
>
> when (speed>=45 and speed<50) then (vmtc((speed-1.131)+372))
>
> when (speed>=50 and speed<55) then (vmtc((speed-0.473)+339))
>
> when (speed>=55 and speed<60) then (vmtc((speed0.0686)+309))
>
> when (speed>=60 and speed<65) then (vmtc((speed0.7814)+267))
>
> when (speed>=65 and speed<70) then (vmtc((speed2.3722)+163))
>
> when (speed>=70 and speed<72.5) then (vmtc((speed3.7348)+68))
>
> else (vmtc((speed3.7348)+68))
>
> Truck (Diesel) Curve Equations:
>
> when (speed>=0 and speed<2.5) then (vmtt((speed-1508.86)+11551.62))
>
> when (speed>=2.5 and speed<5) then (vmtt((speed-1508.86)+211551.62))
>
> when (speed>=5 and speed<10) then (vmtt((speed-312)+5567.34))
>
> when (speed>=10 and speed<15) then (vmtt((speed-78.35)+3230.75))
>
> when (speed>=15 and speed<20) then (vmtt((speed-56.38)+2901.32))
>
> when (speed>=20 and speed<25) then (vmtt((speed-34.75)+2468.71))
>
> when (speed>=25 and speed<30) then (vmtt((speed-12.02)+1900.28))
>
> when (speed>=30 and speed<35) then (vmtt((speed-48.01)+2980.11))
>
> when (speed>=35 and speed<40) then (vmtt((speed-13.48)+1771.60))
>
> when (speed>=40 and speed<45) then (vmtt((speed-10.71)+1660.88))
>
> when (speed>=45 and speed<50) then (vmtt((speed-13.84)+1801.47))
>
> when (speed>=50 and speed<55) then (vmtt((speed-12.68)+1743.63))
>
> when (speed>=55 and speed<60) then (vmtt((speed7.60)+1464.06))
>
> when (speed>=60 and speed<65) then (vmtt((speed011.17)+337.87))
>
> when (speed>=65 and speed<70) then (vmtt((speed10.35)+391.40))
>
> when (speed>=70 and speed<72.5) then (vmtt((speed15.37)+40.07))
>
> else (vmtt((speed15.37)+40.07))

## FWHA Guidance References

[Sample Methodologies for Regional Emissions Analysis in Small Urban and Rural Areas](https://www.fhwa.dot.gov/Environment/air_quality/conformity/research/sample_methodologies/emismeth03.cfm)
