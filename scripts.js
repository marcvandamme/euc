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
    
    // Forhindrer parseren i at behandle et tal som impedans medmindre det kommer fra impedansfeltet
    const isImpedance = rawValue.endsWith('z') || (document.getElementById('impedance').value.trim() === input.trim());

    const valueString = isLReactance || isCReactance || isImpedance || isPower ? rawValue.slice(0, -1) : rawValue;
    const value = parseFloat(valueString || rawValue);

    if (isNaN(value)) {
        return { value: 0, isLReactance: false, isCReactance: false, isImpedance: false, isPower: false };
    }

    let parsedValue = value;
    
    // Håndter SI-præfikser
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
        case 'u': // Mikro (μ)
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

// Opdateret funktion til at formatere et tal med enheder (H, F, Ω, osv.)
function formatValue(value, unitType) {
    if (value === null || isNaN(value)) {
        return 'N/A';
    }

    let unit = '';
    let suffix = '';

    // Bestem enhedstype
    switch(unitType) {
        case 'V':
            unit = 'V';
            break;
        case 'A':
            unit = 'A';
            break;
        case 'Hz':
            unit = 'Hz';
            break;
        case 'Ohm':
            unit = 'Ω';
            break;
        case 'H':
            unit = 'H';
            break;
        case 'F':
            unit = 'F';
            break;
        case 'W':
            unit = 'W';
            break;
        case 'VA':
            unit = 'VA';
            break;
        case 'var':
            unit = 'var';
            break;
        default:
            unit = '';
            break;
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

// Funktion til at læse værdier fra inputfelterne og kalde parseValue
function getValues() {
    const voltage = parseValue(document.getElementById('voltage').value).value;
    const frequency = parseValue(document.getElementById('frequency').value).value;
    const resistance = parseValue(document.getElementById('resistance').value).value;
    const capacitanceResult = parseValue(document.getElementById('capacitance').value);
    const inductanceResult = parseValue(document.getElementById('inductance').value);
    const impedanceResult = parseValue(document.getElementById('impedance').value);
    const power = parseValue(document.getElementById('power').value).value;
    
    return {
        voltage,
        frequency,
        resistance,
        capacitance: capacitanceResult.value,
        inductance: inductanceResult.value,
        impedance: impedanceResult.value,
        power,
        isLReactance: inductanceResult.isLReactance,
        isCReactance: capacitanceResult.isCReactance,
        isImpedance: impedanceResult.isImpedance || (document.getElementById('impedance').value.trim() !== '' && impedanceResult.value > 0)
    };
}

// Opdaterer lommeregneren baseret på de indtastede værdier
function updateCalculator() {
    const { voltage, frequency } = getValues();
    const resultBox = document.getElementById('result');
    
    // Tjek at mindst én af R, L, C, Z eller P er indtastet, ud over U og f
    const inputs = getValues();
    const knownValues = [inputs.resistance, inputs.capacitance, inputs.inductance, inputs.impedance, inputs.power].filter(v => v > 0);
    
    if (voltage <= 0 || frequency <= 0 || knownValues.length < 2) {
        resultBox.textContent = "Indtast venligst spænding, frekvens, og mindst to af de andre værdier (R, C, L, Z eller P).";
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
    document.getElementById('frequency').value = '';
    document.getElementById('resistance').value = '';
    document.getElementById('capacitance').value = '';
    document.getElementById('inductance').value = '';
    document.getElementById('impedance').value = '';
    document.getElementById('power').value = ''; // Nulstil nytteeffektfeltet
    document.getElementById('result').textContent = 'Dine resultater vil vises her...';
}

// Generel beregning for seriekredsløb (R, L, C, RL, RC, LC, RLC)
function calculateSeriesRLC() {
    const { voltage, resistance, capacitance, inductance, frequency, isLReactance, isCReactance, impedance, isImpedance, power } = getValues();
    let resultOutput = '';

    let totalImpedance, current, xL = 0, xC = 0;

    // Første trin: Løs for de ukendte værdier baseret på input
    if (power > 0) {
        current = power / resistance;
        totalImpedance = voltage / current;
    } else if (impedance > 0) {
        totalImpedance = impedance;
        current = voltage / totalImpedance;
    } else if (resistance > 0) {
        xL = isLReactance ? inductance : (inductance > 0 ? 2 * Math.PI * frequency * inductance : 0);
        xC = isCReactance ? capacitance : (capacitance > 0 ? 1 / (2 * Math.PI * frequency * capacitance) : 0);
        totalImpedance = Math.sqrt(resistance * resistance + Math.pow(xL - xC, 2));
        current = voltage / totalImpedance;
    } else {
        // Håndter andre kombinationer
        resultOutput = "Ikke nok information til at beregne seriekredsløb.";
        document.getElementById('result').textContent = resultOutput;
        return;
    }

    // Andet trin: Find alle manglende værdier
    if (!totalImpedance) {
      totalImpedance = voltage / current;
    }

    let XL_minus_XC = Math.sqrt(Math.pow(totalImpedance, 2) - Math.pow(resistance, 2));
    if (isNaN(XL_minus_XC)) XL_minus_XC = 0;

    if (inductance === 0 && capacitance === 0) {
        // Hvis reaktans ikke er givet, antag at det er en RL-kreds og beregn XL
        if (XL_minus_XC > 0) {
            xL = XL_minus_XC;
            inductance = xL / (2 * Math.PI * frequency);
        }
    } else if (inductance > 0 && capacitance === 0) {
      xL = isLReactance ? inductance : (2 * Math.PI * frequency * inductance);
    } else if (capacitance > 0 && inductance === 0) {
      xC = isCReactance ? capacitance : (1 / (2 * Math.PI * frequency * capacitance));
    }

    const realPower = current * current * resistance;
    const apparentPower = voltage * current;
    const reactivePower = Math.abs(current * current * (xL - xC));
    const powerFactor = apparentPower > 0 ? realPower / apparentPower : 0;
    const phaseAngleDeg = (powerFactor !== 0) ? Math.acos(powerFactor) * (180 / Math.PI) : 0;

    const uR = current * resistance;
    const uL = current * xL;
    const uC = current * xC;

    resultOutput += `--- Serie Kredsløb ---\n\n`;
    resultOutput += `Indtastede værdier:\n`;
    resultOutput += `Spænding (U): ${formatValue(voltage, 'V')}\n`;
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
    resultOutput += `•  Total strøm (I): ${formatValue(current, 'A')}\n`;
    resultOutput += `•  Faseforskydningsvinkel (φ): ${phaseAngleDeg.toFixed(3)} °\n`;
    resultOutput += `•  Effektfaktor (cos φ): ${powerFactor.toFixed(3)}\n`;
    resultOutput += `•  Nytteeffekt (P): ${formatValue(realPower, 'W')}\n`;
    resultOutput += `•  Tilsyneladende effekt (S): ${formatValue(apparentPower, 'VA')}\n`;
    resultOutput += `•  Reaktiv effekt (Q): ${formatValue(reactivePower, 'var')}\n`;
    
    // Yderligere beregninger, hvis reaktansen er givet
    if (isCReactance && capacitance > 0) {
        resultOutput += `•  **Beregnet Kapacitans (C):** ${formatValue(capacitance, 'F')}\n`;
    }
    if (isLReactance && inductance > 0) {
        resultOutput += `•  **Beregnet Induktans (L):** ${formatValue(inductance, 'H')}\n`;
    }

    document.getElementById('result').textContent = resultOutput;
}

// Generel beregning for parallelkredsløb (R, L, C, RL, RC, LC, RLC)
function calculateParallelRLC() {
    const { voltage, resistance, capacitance, inductance, frequency, isLReactance, isCReactance, impedance, isImpedance, power } = getValues();
    let resultOutput = '';
    
    let totalImpedance, totalCurrent, xL = 0, xC = 0, iR = 0, iL = 0, iC = 0;

    // Første trin: Løs for de ukendte værdier baseret på input
    if (power > 0) {
      iR = power / voltage;
      if (resistance === 0) resistance = voltage / iR;
      totalCurrent = Math.sqrt(Math.pow(power / voltage, 2) + Math.pow(iL - iC, 2));
      totalImpedance = voltage / totalCurrent;
    } else if (resistance > 0 && impedance > 0) {
      totalImpedance = impedance;
      totalCurrent = voltage / totalImpedance;
      iR = voltage / resistance;
      
      const iReactiveSquared = Math.pow(totalCurrent, 2) - Math.pow(iR, 2);
      if (iReactiveSquared > 0) {
        iL = Math.sqrt(iReactiveSquared);
        xL = voltage / iL;
        inductance = xL / (2 * Math.PI * frequency);
      }
    } else if (resistance > 0 && inductance > 0) {
      iR = voltage / resistance;
      xL = isLReactance ? inductance : (2 * Math.PI * frequency * inductance);
      iL = voltage / xL;
      totalCurrent = Math.sqrt(Math.pow(iR, 2) + Math.pow(iL, 2));
      totalImpedance = voltage / totalCurrent;
    } else {
        resultOutput = "Ikke nok information til at beregne parallelkredsløb.";
        document.getElementById('result').textContent = resultOutput;
        return;
    }
    
    if (totalImpedance === 0) totalImpedance = voltage / totalCurrent;

    // Andet trin: Find alle manglende værdier
    if (resistance > 0 && iR === 0) iR = voltage / resistance;
    if (xL > 0 && iL === 0) iL = voltage / xL;
    if (xC > 0 && iC === 0) iC = voltage / xC;

    let realPower = voltage * iR;
    let apparentPower = voltage * totalCurrent;
    let reactivePower = Math.abs(voltage * (iL - iC));
    let powerFactor = apparentPower > 0 ? realPower / apparentPower : 0;
    let phaseAngleDeg = 0;

    if (iR !== 0) {
        phaseAngleDeg = Math.atan((iC - iL) / iR) * (180 / Math.PI);
    } else {
        if (iC > iL) { phaseAngleDeg = 90; }
        else if (iL > iC) { phaseAngleDeg = -90; }
        else { phaseAngleDeg = 0; }
    }

    resultOutput += `--- Parallel Kredsløb ---\n\n`;
    resultOutput += `Indtastede værdier:\n`;
    resultOutput += `Spænding (U): ${formatValue(voltage, 'V')}\n`;
    resultOutput += `Modstand (R): ${formatValue(resistance, 'Ohm')}\n`;
    resultOutput += `Kapacitans (C): ${isCReactance ? `${formatValue(capacitance, 'Ohm')} (Xc)` : formatValue(capacitance, 'F')}\n`;
    resultOutput += `Induktans (L): ${isLReactance ? `${formatValue(inductance, 'Ohm')} (Xl)` : formatValue(inductance, 'H')}\n`;
    resultOutput += `Impedans (Z): ${isImpedance ? `${formatValue(impedance, 'Ohm')} (Givet)` : 'Beregnet'}\n`;
    resultOutput += `Nytteeffekt (P): ${formatValue(power, 'W')}\n`;
    resultOutput += `Frekvens (f): ${formatValue(frequency, 'Hz')}\n\n`;

    resultOutput += `**Beregnet reaktans og delstrømme:**\n`;
    resultOutput += `•  Kapacitiv reaktans (Xc): ${formatValue(xC, 'Ohm')}\n`;
    resultOutput += `•  Induktiv reaktans (Xl): ${formatValue(xL, 'Ohm')}\n`;
    resultOutput += `•  Strøm gennem R (Ir): ${formatValue(iR, 'A')}\n`;
    resultOutput += `•  Strøm gennem L (Il): ${formatValue(iL, 'A')}\n`;
    resultOutput += `•  Strøm gennem C (Ic): ${formatValue(iC, 'A')}\n\n`;
    
    resultOutput += `**Endelige resultater:**\n`;
    resultOutput += `•  Total impedans (Z): ${formatValue(totalImpedance, 'Ohm')}\n`;
    resultOutput += `•  Total strøm (I): ${formatValue(totalCurrent, 'A')}\n`;
    resultOutput += `•  Faseforskydningsvinkel (φ): ${phaseAngleDeg.toFixed(3)} °\n`;
    resultOutput += `•  Effektfaktor (cos φ): ${powerFactor.toFixed(3)}\n`;
    resultOutput += `•  Nytteeffekt (P): ${formatValue(realPower, 'W')}\n`;
    resultOutput += `•  Tilsyneladende effekt (S): ${formatValue(apparentPower, 'VA')}\n`;
    resultOutput += `•  Reaktiv effekt (Q): ${formatValue(reactivePower, 'var')}\n`;
    
    // Yderligere beregninger, hvis reaktansen eller impedansen er givet
    if (isCReactance && capacitance > 0) {
        resultOutput += `•  **Beregnet Kapacitans (C):** ${formatValue(capacitance, 'F')}\n`;
    }
    if (isLReactance && inductance > 0) {
        resultOutput += `•  **Beregnet Induktans (L):** ${formatValue(inductance, 'H')}\n`;
    }
    if (isImpedance && impedance > 0 && inductance > 0) {
        resultOutput += `•  **Beregnet Induktans (L):** ${formatValue(inductance, 'H')}\n`;
    }
    
    document.getElementById('result').textContent = resultOutput;
}

// Vent, indtil DOM'en er fuldt indlæst, før du tilføjer event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('calculate-button').addEventListener('click', updateCalculator);
    document.getElementById('reset-button').addEventListener('click', resetCalculator);
});
