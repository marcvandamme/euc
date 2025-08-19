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
        return { value: 0, isLReactance: false, isCReactance: false, isImpedance: false, isPower: false };
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

// Funktion til at læse værdier fra inputfelterne
function getValues() {
    return {
        voltage: parseValue(document.getElementById('voltage').value).value,
        frequency: parseValue(document.getElementById('frequency').value).value,
        resistance: parseValue(document.getElementById('resistance').value).value,
        capacitance: parseValue(document.getElementById('capacitance').value).value,
        inductance: parseValue(document.getElementById('inductance').value).value,
        impedance: parseValue(document.getElementById('impedance').value).value,
        power: parseValue(document.getElementById('power').value).value,
        isLReactance: parseValue(document.getElementById('inductance').value).isLReactance,
        isCReactance: parseValue(document.getElementById('capacitance').value).isCReactance,
        isImpedance: parseValue(document.getElementById('impedance').value).isImpedance,
    };
}

// Opdaterer lommeregneren baseret på de indtastede værdier
function updateCalculator() {
    const { voltage, frequency } = getValues();
    const resultBox = document.getElementById('result');
    
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
    document.getElementById('power').value = '';
    document.getElementById('result').textContent = 'Dine resultater vil vises her...';
}

// Generel beregning for seriekredsløb
function calculateSeriesRLC() {
    const { voltage, resistance, capacitance, inductance, frequency, isLReactance, isCReactance, impedance, isImpedance, power } = getValues();
    let resultOutput = '';
    let totalImpedance, current, xL = 0, xC = 0;

    // Første trin: Beregn reaktans
    xL = isLReactance ? inductance : (inductance > 0 ? 2 * Math.PI * frequency * inductance : 0);
    xC = isCReactance ? capacitance : (capacitance > 0 ? 1 / (2 * Math.PI * frequency * capacitance) : 0);
    
    // Andet trin: Find impedans og strøm baseret på kendte værdier
    if (impedance > 0) {
        totalImpedance = impedance;
        current = voltage / totalImpedance;
        // Check for uoverensstemmelse i input
        if (Math.abs(totalImpedance - Math.sqrt(resistance * resistance + Math.pow(xL - xC, 2))) > 0.1) {
             resultOutput += `Advarsel: De indtastede værdier er muligvis ikke i overensstemmelse med hinanden.\n`;
        }
    } else {
        totalImpedance = Math.sqrt(resistance * resistance + Math.pow(xL - xC, 2));
        current = voltage / totalImpedance;
    }
    
    // Tredje trin: Løs for ukendte værdier
    if (totalImpedance === 0) {
        document.getElementById('result').textContent = "Fejl: Total impedans kan ikke være nul.";
        return;
    }
    
    if (inductance === 0 && xL === 0 && capacitance > 0) {
        // Find L baseret på Z
        const XL_minus_XC_squared = Math.pow(totalImpedance, 2) - Math.pow(resistance, 2);
        if (XL_minus_XC_squared >= 0) {
            xL = Math.sqrt(XL_minus_XC_squared) + xC;
            inductance = xL / (2 * Math.PI * frequency);
        }
    }
    if (capacitance === 0 && xC === 0 && inductance > 0) {
         // Find C baseret på Z
         const XC_minus_XL_squared = Math.pow(totalImpedance, 2) - Math.pow(resistance, 2);
         if (XC_minus_XL_squared >= 0) {
             xC = Math.sqrt(XC_minus_XL_squared) + xL;
             capacitance = 1 / (2 * Math.PI * frequency * xC);
         }
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
    
    if (inductance > 0 && !isLReactance) {
        resultOutput += `•  **Beregnet Induktans (L):** ${formatValue(inductance, 'H')}\n`;
    }
    if (capacitance > 0 && !isCReactance) {
        resultOutput += `•  **Beregnet Kapacitans (C):** ${formatValue(capacitance, 'F')}\n`;
    }
    
    document.getElementById('result').textContent = resultOutput;
}

// Forbedret beregning for parallelkredsløb
function calculateParallelRLC() {
    const { voltage, resistance, capacitance, inductance, frequency, isLReactance, isCReactance, impedance, isImpedance, power } = getValues();
    let resultOutput = '';
    
    let totalImpedance, totalCurrent, iR = 0, iL = 0, iC = 0, xL = 0, xC = 0;

    // Første trin: Beregn ud fra de kendte værdier
    if (resistance > 0) {
        iR = voltage / resistance;
    }
    if (inductance > 0) {
        xL = isLReactance ? inductance : (2 * Math.PI * frequency * inductance);
        if (xL > 0) iL = voltage / xL;
    }
    if (capacitance > 0) {
        xC = isCReactance ? capacitance : (1 / (2 * Math.PI * frequency * capacitance));
        if (xC > 0) iC = voltage / xC;
    }

    // Andet trin: Løs for ukendte værdier baseret på input
    if (power > 0 && resistance === 0) {
        iR = power / voltage;
        if (iR > 0) resistance = voltage / iR;
    } else if (power > 0) {
        iR = power / voltage; // Brug R og P til at finde Ir, derefter den samlede strøm
    }

    if (isImpedance && impedance > 0) {
        totalImpedance = impedance;
        totalCurrent = voltage / totalImpedance;

        // Brug Pythagoras' sætning til at finde den reaktive strøm (som er (iL - iC))
        const iReactiveSquared = Math.pow(totalCurrent, 2) - Math.pow(iR, 2);

        if (iReactiveSquared > 0) {
            const iReactive = Math.sqrt(iReactiveSquared);
            // Her antager vi en RL-kreds, da kun R og Z er givet
            if (iL === 0 && iC === 0) {
                iL = iReactive;
                xL = voltage / iL;
                inductance = xL / (2 * Math.PI * frequency);
            }
        }
    } else {
        totalCurrent = Math.sqrt(Math.pow(iR, 2) + Math.pow(iL - iC, 2));
        if (totalCurrent > 0) totalImpedance = voltage / totalCurrent;
    }
    
    if (isNaN(totalCurrent) || isNaN(totalImpedance)) {
        document.getElementById('result').textContent = "Fejl: Ikke nok information til at beregne.";
        return;
    }

    // Tredje trin: Beregn alle andre resultater
    const realPower = voltage * iR;
    const apparentPower = voltage * totalCurrent;
    const reactivePower = Math.abs(voltage * (iL - iC));
    const powerFactor = apparentPower > 0 ? realPower / apparentPower : 0;
    let phaseAngleDeg = 0;
    
    if (iR !== 0) {
        phaseAngleDeg = Math.atan((iL - iC) / iR) * (180 / Math.PI);
    } else {
        if (iL > iC) { phaseAngleDeg = 90; }
        else if (iC > iL) { phaseAngleDeg = -90; }
        else { phaseAngleDeg = 0; }
    }

    // Byg resultatteksten
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
    const calculateButton = document.getElementById('calculate-button');
    const resetButton = document.getElementById('reset-button');
    
    if (calculateButton) {
        calculateButton.addEventListener('click', updateCalculator);
    }
    
    if (resetButton) {
        resetButton.addEventListener('click', resetCalculator);
    }
});
