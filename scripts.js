/**
 * @file scripts.js
 * @author  Gemini (via Google) and User
 * @license MIT
 * @description A JavaScript file for calculating series and parallel RLC circuits.
 * The core code was developed collaboratively with Gemini, a large language model from Google.
 */

// Funktion til at parse en værdi med enhed (k, M, m, u, n, p, l for XL, c for XC, z for Z)
function parseValue(input) {
    if (input === null || input === undefined || input.trim() === '') {
        return { value: 0, isLReactance: false, isCReactance: false, isImpedance: false, isPower: false };
    }
    
    const rawValue = String(input).trim().toLowerCase();
    
    const isLReactance = rawValue.endsWith('l');
    const isCReactance = rawValue.endsWith('c');
    const isPower = rawValue.endsWith('w') || rawValue.endsWith('s') || rawValue.endsWith('q');
    
    const isImpedance = rawValue.endsWith('z') || (document.getElementById('impedance').value.trim() === input.trim());

    const valueString = isLReactance || isCReactance || isImpedance || isPower ? rawValue.slice(0, -1) : rawValue;
    const value = parseFloat(valueString || rawValue);

    if (isNaN(value)) {
        return { value: 0, isLReactance, isCReactance, isImpedance, isPower };
    }

    let parsedValue = value;
    
    let unit = rawValue.replace(String(value), '').trim();
    if (unit.length > 0) {
        unit = unit.charAt(0);
    }
    
    switch (unit) {
        case 'k': // Kilo
            parsedValue *= 1e3;
            break;
        case 'm': // Milli
            parsedValue *= 1e-3;
            break;
        case 'u': // Mikro (u)
        case 'μ': // Mikro (μ)
            parsedValue *= 1e-6;
            break;
        case 'n': // Nano
            parsedValue *= 1e-9;
            break;
        case 'p': // Pico
            parsedValue *= 1e-12;
            break;
        default:
            break;
    }
    
    return { value: parsedValue, isLReactance, isCReactance, isImpedance, isPower };
}

// Funktion til at formatere et tal med enheder (H, F, Ohm, osv.)
function formatValue(value, unitType) {
    if (value === null || isNaN(value)) {
        return 'N/A';
    }

    let unit = '';
    let suffix = '';

    switch(unitType) {
        case 'V': unit = 'V'; break;
        case 'A': unit = 'A'; break;
        case 'Hz': unit = 'Hz'; break;
        case 'Ohm': unit = 'Ω'; break;
        case 'H': unit = 'H'; break;
        case 'F': unit = 'F'; break;
        case 'W': unit = 'W'; break;
        case 'VA': unit = 'VA'; break;
        case 'var': unit = 'var'; break;
        default: unit = ''; break;
    }

    if (Math.abs(value) >= 1e9) {
        suffix = 'G';
        value /= 1e9;
    } else if (Math.abs(value) >= 1e6) {
        suffix = 'M';
        value /= 1e6;
    } else if (Math.abs(value) >= 1e3) {
        suffix = 'k';
        value /= 1e3;
    } else if (Math.abs(value) >= 1) {
        // ingen præfiks
    } else if (Math.abs(value) >= 1e-3) {
        suffix = 'm';
        value /= 1e-3;
    } else if (Math.abs(value) >= 1e-6) {
        suffix = 'μ';
        value /= 1e-6;
    } else if (Math.abs(value) >= 1e-9) {
        suffix = 'n';
        value /= 1e-9;
    } else if (Math.abs(value) >= 1e-12) {
        suffix = 'p';
        value /= 1e-12;
    }
    
    return `${value.toFixed(3)} ${suffix}${unit}`;
}

// Funktion til at læse værdier fra inputfelterne
function getValues() {
    return {
        voltage: parseValue(document.getElementById('voltage').value).value,
        current: parseValue(document.getElementById('current').value).value,
        frequency: parseValue(document.getElementById('frequency').value).value,
        resistance: parseValue(document.getElementById('resistance').value).value,
        capacitance: parseValue(document.getElementById('capacitance').value).value,
        inductance: parseValue(document.getElementById('inductance').value).value,
        impedance: parseValue(document.getElementById('impedance').value).value,
        power: parseValue(document.getElementById('power').value).value,
        isLReactance: parseValue(document.getElementById('inductance').value).isLReactance,
        isCReactance: parseValue(document.getElementById('capacitance').value).isCReactance,
        isImpedance: parseValue(document.getElementById('impedance').value).isImpedance,
        isPower: parseValue(document.getElementById('power').value).isPower,
    };
}

// Hovedfunktion, der opdaterer lommeregneren baseret på kredsløbstype
function updateCalculator() {
    const { voltage, current, frequency, resistance, capacitance, inductance, impedance, power } = getValues();
    const resultBox = document.getElementById('result');
    
    // Fejlhåndtering for grundlæggende input
    const knownValuesCount = [resistance, capacitance, inductance, impedance, power].filter(v => v > 0).length;
    if (frequency <= 0 || knownValuesCount < 1) {
        resultBox.textContent = "Indtast venligst frekvens, og mindst én anden værdi.";
        return;
    }
    
    // Tjek at enten spænding eller strøm er indtastet, men ikke begge
    if ((voltage > 0 && current > 0) || (voltage === 0 && current === 0)) {
        resultBox.textContent = "Indtast venligst enten spænding (U) eller strøm (I), men ikke begge.";
        return;
    }

    const selectedCircuitType = document.getElementById('circuit-select').value;
    
    if (selectedCircuitType === 'series') {
        calculateSeriesRLC();
    } else if (selectedCircuitType === 'parallel') {
        calculateParallelRLC();
    }
}

// Nulstiller alle inputfelter og resultatvisningen
function resetCalculator() {
    document.getElementById('voltage').value = '';
    document.getElementById('current').value = ''; // Nulstil det nye felt
    document.getElementById('frequency').value = '';
    document.getElementById('resistance').value = '';
    document.getElementById('capacitance').value = '';
    document.getElementById('inductance').value = '';
    document.getElementById('impedance').value = '';
    document.getElementById('power').value = '';
    document.getElementById('result').textContent = 'Dine resultater vil vises her...';
}

// Generel beregning for seriekredsløb
function calculateSeriesRLC() {
    const { voltage, current, resistance, capacitance, inductance, frequency, isLReactance, isCReactance, impedance, isImpedance } = getValues();
    let resultOutput = '';
    let totalImpedance, calculatedVoltage, calculatedCurrent, xL = 0, xC = 0;
    let givenVoltage = voltage > 0 ? true : false;

    // Første trin: Beregn reaktans baseret på L og C
    xL = isLReactance ? inductance : (inductance > 0 ? 2 * Math.PI * frequency * inductance : 0);
    xC = isCReactance ? capacitance : (capacitance > 0 ? 1 / (2 * Math.PI * frequency * capacitance) : 0);
    
    // Andet trin: Beregn total impedans
    if (isImpedance && impedance > 0) {
        totalImpedance = impedance;
    } else {
        totalImpedance = Math.sqrt(Math.pow(resistance, 2) + Math.pow(xL - xC, 2));
    }
    
    // Tredje trin: Beregn manglende værdi (U eller I)
    if (givenVoltage) {
        calculatedVoltage = voltage;
        calculatedCurrent = totalImpedance > 0 ? voltage / totalImpedance : 0;
    } else {
        calculatedCurrent = current;
        calculatedVoltage = calculatedCurrent * totalImpedance;
    }

    // Fjerde trin: Beregn effekter og vinkler
    const realPower = calculatedCurrent * calculatedCurrent * resistance;
    const apparentPower = calculatedVoltage * calculatedCurrent;
    const reactivePower = Math.abs(calculatedCurrent * calculatedCurrent * (xL - xC));
    const powerFactor = apparentPower > 0 ? realPower / apparentPower : 0;
    const phaseAngleDeg = (powerFactor !== 0) ? Math.acos(powerFactor) * (180 / Math.PI) : 0;

    // Femte trin: Beregn spændingsfald
    const uR = calculatedCurrent * resistance;
    const uL = calculatedCurrent * xL;
    const uC = calculatedCurrent * xC;

    // Sjette trin: Byg resultatstrengen
    resultOutput += `--- Serie Kredsløb ---\n\n`;
    resultOutput += `**Formler anvendt:**\n`;
    resultOutput += `•  Induktiv reaktans (Xl): Xl = 2 * pi * f * L\n`;
    resultOutput += `•  Kapacitiv reaktans (Xc): Xc = 1 / (2 * pi * f * C)\n`;
    resultOutput += `•  Total impedans (Z): Z = sqrt(R^2 + (Xl - Xc)^2)\n`;
    if (givenVoltage) {
        resultOutput += `•  Total strøm (I): I = U / Z\n`;
    } else {
        resultOutput += `•  Total spænding (U): U = I * Z\n`;
    Output += `•  Spændingsfald over R (Ur): Ur = I * R\n`;
    resultOutput += `•  Spændingsfald over L (Ul): Ul = I * Xl\n`;
    resultOutput += `•  Spændingsfald over C (Uc): Uc = I * Xc\n`;
    resultOutput += `•  Nytteeffekt (P): P = I^2 * R\n`;
    resultOutput += `•  Tilsyneladende effekt (S): S = U * I\n`;
    resultOutput += `•  Reaktiv effekt (Q): Q = I^2 * abs(Xl - Xc)\n`;
    resultOutput += `•  Effektfaktor (cos φ): cos(φ) = P / S\n`;
    resultOutput += `•  Faseforskydningsvinkel (φ): φ = arccos(cos(φ))\n\n`;
    
    resultOutput += `**Indtastede værdier:**\n`;
    resultOutput += `Spænding (U): ${givenVoltage ? formatValue(calculatedVoltage, 'V') : 'Beregnet'}\n`;
    resultOutput += `Strøm (I): ${givenVoltage ? 'Beregnet' : formatValue(calculatedCurrent, 'A')}\n`;
    resultOutput += `Modstand (R): ${formatValue(resistance, 'Ohm')}\n`;
    resultOutput += `Kapacitans (C): ${isCReactance ? `${formatValue(capacitance, 'Ohm')} (Xc)` : formatValue(capacitance, 'F')}\n`;
    resultOutput += `Induktans (L): ${isLReactance ? `${formatValue(inductance, 'Ohm')} (Xl)` : formatValue(inductance, 'H')}\n`;
    resultOutput += `Impedans (Z): ${isImpedance ? `${formatValue(impedance, 'Ohm')} (Givet)` : 'Beregnet'}\n`;
    resultOutput += `Frekvens (f): ${formatValue(frequency, 'Hz')}\n\n`;
    
    resultOutput += `**Beregnet reaktans og spændingsfald:**\n`;
    resultOutput += `•  Kapacitiv reaktans (Xc): ${formatValue(xC, 'Ohm')}\n`;
    resultOutput += `•  Induktiv reaktans (Xl): ${formatValue(xL, 'Ohm')}\n`;
    resultOutput += `•  Spændingsfald over R (Ur): ${formatValue(uR, 'V')}\n`;
    resultOutput += `•  Spændingsfald over L (Ul): ${formatValue(uL, 'V')}\n`;
    resultOutput += `•  Spændingsfald over C (Uc): ${formatValue(uC, 'V')}\n\n`;
    
    resultOutput += `**Endelige resultater:**\n`;
    resultOutput += `•  Total impedans (Z): ${formatValue(totalImpedance, 'Ohm')}\n`;
    resultOutput += `•  Total strøm (I): ${formatValue(calculatedCurrent, 'A')}\n`;
    resultOutput += `•  Total spænding (U): ${formatValue(calculatedVoltage, 'V')}\n`;
    resultOutput += `•  Faseforskydningsvinkel (φ): ${phaseAngleDeg.toFixed(3)} °\n`;
    resultOutput += `•  Effektfaktor (cos φ): ${powerFactor.toFixed(3)}\n`;
    resultOutput += `•  Nytteeffekt (P): ${formatValue(realPower, 'W')}\n`;
    resultOutput += `•  Tilsyneladende effekt (S): ${formatValue(apparentPower, 'VA')}\n`;
    resultOutput += `•  Reaktiv effekt (Q): ${formatValue(reactivePower, 'var')}\n`;
    
    document.getElementById('result').textContent = resultOutput;
}

// Forbedret beregning for parallelkredsløb
function calculateParallelRLC() {
    const { voltage, current, resistance, capacitance, inductance, frequency, isLReactance, isCReactance, impedance, isImpedance } = getValues();
    let resultOutput = '';
    
    let totalImpedance, calculatedVoltage, calculatedCurrent, iR = 0, iL = 0, iC = 0, xL = 0, xC = 0;
    let givenVoltage = voltage > 0 ? true : false;
    
    // Første trin: Beregn reaktanser
    if (inductance > 0) {
        xL = isLReactance ? inductance : (2 * Math.PI * frequency * inductance);
    }
    if (capacitance > 0) {
        xC = isCReactance ? capacitance : (1 / (2 * Math.PI * frequency * capacitance));
    }

    // Andet trin: Beregn manglende værdi (U eller I) og delstrømme
    if (givenVoltage) {
        calculatedVoltage = voltage;
        if (resistance > 0) iR = calculatedVoltage / resistance;
        if (xL > 0) iL = calculatedVoltage / xL;
        if (xC > 0) iC = calculatedVoltage / xC;
        calculatedCurrent = Math.sqrt(Math.pow(iR, 2) + Math.pow(iL - iC, 2));
    } else {
        calculatedCurrent = current;
        // Da U er ukendt, beregner vi U fra den samlede strøm og impedans
        if (isImpedance && impedance > 0) {
            totalImpedance = impedance;
        } else {
            const conductance = resistance > 0 ? 1 / resistance : 0;
            const inductiveSusceptance = xL > 0 ? 1 / xL : 0;
            const capacitiveSusceptance = xC > 0 ? 1 / xC : 0;
            const totalSusceptance = inductiveSusceptance - capacitiveSusceptance;
            const totalAdmittance = Math.sqrt(Math.pow(conductance, 2) + Math.pow(totalSusceptance, 2));
            totalImpedance = totalAdmittance > 0 ? 1 / totalAdmittance : 0;
        }
        calculatedVoltage = calculatedCurrent * totalImpedance;
        // Nu kan vi beregne de individuelle strømme med den beregnede spænding
        if (resistance > 0) iR = calculatedVoltage / resistance;
        if (xL > 0) iL = calculatedVoltage / xL;
        if (xC > 0) iC = calculatedVoltage / xC;
    }

    if (totalImpedance === undefined) {
         if (givenVoltage) {
             totalImpedance = calculatedCurrent > 0 ? calculatedVoltage / calculatedCurrent : 0;
         } else {
             const conductance = resistance > 0 ? 1 / resistance : 0;
             const inductiveSusceptance = xL > 0 ? 1 / xL : 0;
             const capacitiveSusceptance = xC > 0 ? 1 / xC : 0;
             const totalSusceptance = inductiveSusceptance - capacitiveSusceptance;
             const totalAdmittance = Math.sqrt(Math.pow(conductance, 2) + Math.pow(totalSusceptance, 2));
             totalImpedance = totalAdmittance > 0 ? 1 / totalAdmittance : 0;
         }
    }

    // Tredje trin: Beregn effekter og vinkler
    const realPower = calculatedVoltage * iR;
    const apparentPower = calculatedVoltage * calculatedCurrent;
    const reactivePower = Math.abs(calculatedVoltage * (iL - iC));
    const powerFactor = apparentPower > 0 ? realPower / apparentPower : 0;
    
    let phaseAngleDeg = 0;
    if (iR !== 0) {
        phaseAngleDeg = Math.atan((iL - iC) / iR) * (180 / Math.PI);
    } else if (iL > iC) {
        phaseAngleDeg = 90;
    } else if (iC > iL) {
        phaseAngleDeg = -90;
    }

    // Fjerde trin: Byg resultatstrengen
    resultOutput += `--- Parallel Kredsløb ---\n\n`;
    resultOutput += `**Formler anvendt:**\n`;
    resultOutput += `•  Induktiv reaktans (Xl): Xl = 2 * pi * f * L\n`;
    resultOutput += `•  Kapacitiv reaktans (Xc): Xc = 1 / (2 * pi * f * C)\n`;
    resultOutput += `•  Strøm gennem R (Ir): Ir = U / R\n`;
    resultOutput += `•  Strøm gennem L (Il): Il = U / Xl\n`;
    resultOutput += `•  Strøm gennem C (Ic): Ic = U / Xc\n`;
    resultOutput += `•  Total strøm (I): I = sqrt(Ir^2 + (Il - Ic)^2)\n`;
    resultOutput += `•  Total impedans (Z): Z = U / I\n`;
    resultOutput += `•  Nytteeffekt (P): P = U * Ir\n`;
    resultOutput += `•  Tilsyneladende effekt (S): S = U * I\n`;
    resultOutput += `•  Reaktiv effekt (Q): Q = U * abs(Il - Ic)\n`;
    resultOutput += `•  Effektfaktor (cos φ): cos(φ) = P / S\n`;
    resultOutput += `•  Faseforskydningsvinkel (φ): φ = arctan((Il-Ic) / Ir)\n\n`;

    resultOutput += `**Indtastede værdier:**\n`;
    resultOutput += `Spænding (U): ${givenVoltage ? formatValue(calculatedVoltage, 'V') : 'Beregnet'}\n`;
    resultOutput += `Strøm (I): ${givenVoltage ? 'Beregnet' : formatValue(calculatedCurrent, 'A')}\n`;
    resultOutput += `Modstand (R): ${formatValue(resistance, 'Ohm')}\n`;
    resultOutput += `Kapacitans (C): ${isCReactance ? `${formatValue(capacitance, 'Ohm')} (Xc)` : formatValue(capacitance, 'F')}\n`;
    resultOutput += `Induktans (L): ${isLReactance ? `${formatValue(inductance, 'Ohm')} (Xl)` : formatValue(inductance, 'H')}\n`;
    resultOutput += `Impedans (Z): ${isImpedance ? `${formatValue(impedance, 'Ohm')} (Givet)` : 'Beregnet'}\n`;
    resultOutput += `Frekvens (f): ${formatValue(frequency, 'Hz')}\n\n`;

    resultOutput += `**Beregnet reaktans og delstrømme:**\n`;
    resultOutput += `•  Kapacitiv reaktans (Xc): ${formatValue(xC, 'Ohm')}\n`;
    resultOutput += `•  Induktiv reaktans (Xl): ${formatValue(xL, 'Ohm')}\n`;
    resultOutput += `•  Strøm gennem R (Ir): ${formatValue(iR, 'A')}\n`;
    resultOutput += `•  Strøm gennem L (Il): ${formatValue(iL, 'A')}\n`;
    resultOutput += `•  Strøm gennem C (Ic): ${formatValue(iC, 'A')}\n\n`;
    
    resultOutput += `**Endelige resultater:**\n`;
    resultOutput += `•  Total impedans (Z): ${formatValue(totalImpedance, 'Ohm')}\n`;
    resultOutput += `•  Total strøm (I): ${formatValue(calculatedCurrent, 'A')}\n`;
    resultOutput += `•  Total spænding (U): ${formatValue(calculatedVoltage, 'V')}\n`;
    resultOutput += `•  Faseforskydningsvinkel (φ): ${phaseAngleDeg.toFixed(3)} °\n`;
    resultOutput += `•  Effektfaktor (cos φ): ${powerFactor.toFixed(3)}\n`;
    resultOutput += `•  Nytteeffekt (P): ${formatValue(realPower, 'W')}\n`;
    resultOutput += `•  Tilsyneladende effekt (S): ${formatValue(apparentPower, 'VA')}\n`;
sultOutput += `•  Reaktiv effekt (Q): ${formatValue(reactivePower, 'var')}\n`;
    
    document.getElementById('result').textContent = resultOutput;
}

// Vent, indtil DOM'en er fuldt indlæst, før du tilføjer event listeners
document.addEventListener('DOMContentLoaded', () => {
    const calculateButton = document.getElementById('calculate-button');
    const resetButton = document.getElementById('reset-button');
    
    if (calculateButton) {
        calculateButton.addEventListener('click', updateCalculator);
    }
    
    if (resetButton) {
        resetButton.addEventListener('click', resetCalculator);
    }
});
