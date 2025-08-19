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
        return { value: 0, isLReactance: false, isCReactance: false, isImpedance: false };
    }
    
    const rawValue = String(input).trim().toLowerCase();
    
    const isLReactance = rawValue.endsWith('l');
    const isCReactance = rawValue.endsWith('c');
    
    // Forhindrer parseren i at behandle et tal som impedans medmindre det kommer fra impedansfeltet
    const isImpedance = rawValue.endsWith('z') || (document.getElementById('impedance').value.trim() === input.trim());

    // Fjern enhedsbogstavet, hvis det er en reaktans-enhed
    const valueString = isLReactance || isCReactance || isImpedance ? rawValue.slice(0, -1) : rawValue;
    const value = parseFloat(valueString || rawValue);

    if (isNaN(value)) {
        return { value: 0, isLReactance: false, isCReactance: false, isImpedance: false };
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
    
    return { value: parsedValue, isLReactance, isCReactance, isImpedance };
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
    const resistance = parseValue(document.getElementById('resistance').value).value;
    const capacitanceResult = parseValue(document.getElementById('capacitance').value);
    const inductanceResult = parseValue(document.getElementById('inductance').value);
    const impedanceResult = parseValue(document.getElementById('impedance').value);
    const frequency = parseValue(document.getElementById('frequency').value).value;
    
    return {
        voltage,
        resistance,
        capacitance: capacitanceResult.value,
        inductance: inductanceResult.value,
        impedance: impedanceResult.value,
        frequency,
        isLReactance: inductanceResult.isLReactance,
        isCReactance: capacitanceResult.isCReactance,
        isImpedance: impedanceResult.isImpedance || (document.getElementById('impedance').value.trim() !== '' && impedanceResult.value > 0)
    };
}

// Opdaterer lommeregneren baseret på de indtastede værdier
function updateCalculator() {
    const { voltage, frequency, resistance, capacitance, inductance, impedance } = getValues();
    const resultBox = document.getElementById('result');
    
    const hasValues = voltage > 0 && frequency > 0 && (resistance > 0 || capacitance > 0 || inductance > 0 || impedance > 0);
    if (!hasValues) {
        resultBox.textContent = "Indtast venligst spænding, frekvens, og mindst én af R, L, C, eller Z.";
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
    document.getElementById('result').textContent = 'Dine resultater vil vises her...';
}

// Tilføj event listeners til knapperne
document.getElementById('calculate-button').addEventListener('click', updateCalculator);
document.getElementById('reset-button').addEventListener('click', resetCalculator);


// Generel beregning for seriekredsløb (R, L, C, RL, RC, LC, RLC)
function calculateSeriesRLC() {
    const { voltage, resistance, capacitance, inductance, frequency, isLReactance, isCReactance, impedance, isImpedance } = getValues();
    let resultOutput = '';

    const xL = isLReactance ? inductance : (inductance > 0 && frequency > 0 ? 2 * Math.PI * frequency * inductance : 0);
    const xC = isCReactance ? capacitance : (capacitance > 0 && frequency > 0 ? 1 / (2 * Math.PI * frequency * capacitance) : 0);
    const totalImpedance = isImpedance ? impedance : Math.sqrt(resistance * resistance + Math.pow(xL - xC, 2));
    
    const L = isLReactance ? xL / (2 * Math.PI * frequency) : inductance;
    const C = isCReactance ? 1 / (2 * Math.PI * frequency * xC) : capacitance;
    
    const current = voltage > 0 && totalImpedance > 0 ? voltage / totalImpedance : 0;

    let powerFactor = (totalImpedance > 0) ? resistance / totalImpedance : 0;
    let phaseAngleDeg = 0;
    if (resistance !== 0) {
        phaseAngleDeg = Math.atan((xL - xC) / resistance) * (180 / Math.PI);
    } else {
        if (xL > xC) { phaseAngleDeg = 90; } 
        else if (xC > xL) { phaseAngleDeg = -90; } 
        else { phaseAngleDeg = 0; }
    }

    const realPower = current * current * resistance;
    const apparentPower = voltage * current;
    const reactivePower = Math.abs(current * current * (xL - xC));

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
        resultOutput += `•  **Beregnet Kapacitans (C):** ${formatValue(C, 'F')}\n`;
    }
    if (isLReactance && inductance > 0) {
        resultOutput += `•  **Beregnet Induktans (L):** ${formatValue(L, 'H')}\n`;
    }

    document.getElementById('result').textContent = resultOutput;
}

// Generel beregning for parallelkredsløb (R, L, C, RL, RC, LC, RLC)
function calculateParallelRLC() {
    const { voltage, resistance, capacitance, inductance, frequency, isLReactance, isCReactance, impedance, isImpedance } = getValues();
    let resultOutput = '';
    
    let xL = 0, L = 0;
    let xC = 0, C = 0;
    let totalImpedance = 0;
    let totalCurrent = 0;

    // Første trin: Håndter input
    xC = isCReactance ? capacitance : (capacitance > 0 ? 1 / (2 * Math.PI * frequency * capacitance) : 0);
    xL = isLReactance ? inductance : (inductance > 0 ? 2 * Math.PI * frequency * inductance : 0);
    
    const iR = (voltage > 0 && resistance > 0) ? voltage / resistance : 0;
    const iC = (voltage > 0 && xC > 0) ? voltage / xC : 0;
    let iL = (voltage > 0 && xL > 0) ? voltage / xL : 0;

    // Andet trin: Beregn ud fra impedans, hvis den er givet
    if (isImpedance && impedance > 0) {
        totalImpedance = impedance;
        totalCurrent = voltage / totalImpedance;
        
        // Find den reaktive strøm (som er I_L i dette tilfælde)
        const iReactiveSquared = Math.pow(totalCurrent, 2) - Math.pow(iR, 2);
        const iReactive = Math.sqrt(Math.max(0, iReactiveSquared));
        
        iL = iReactive; 
        if (iL > 0) {
            xL = voltage / iL;
            L = xL / (2 * Math.PI * frequency);
        }
    } else {
        totalCurrent = Math.sqrt(Math.pow(iR, 2) + Math.pow(iL - iC, 2));
        totalImpedance = (totalCurrent > 0) ? voltage / totalCurrent : 0;
    }

    // Tredje trin: Fortsæt med resten af beregningerne
    let powerFactor = (totalCurrent > 0) ? iR / totalCurrent : 0;
    let phaseAngleDeg = 0;
    if (iR !== 0) {
        phaseAngleDeg = Math.atan((iC - iL) / iR) * (180 / Math.PI);
    } else {
        if (iC > iL) { phaseAngleDeg = 90; }
        else if (iL > iC) { phaseAngleDeg = -90; }
        else { phaseAngleDeg = 0; }
    }
    
    const realPower = voltage * iR;
    const apparentPower = voltage * totalCurrent;
    const reactivePower = Math.abs(voltage * (iC - iL));

    resultOutput += `--- Parallel Kredsløb ---\n\n`;
    resultOutput += `Indtastede værdier:\n`;
    resultOutput += `Spænding (U): ${formatValue(voltage, 'V')}\n`;
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
    resultOutput += `•  Total strøm (I): ${formatValue(totalCurrent, 'A')}\n`;
    resultOutput += `•  Faseforskydningsvinkel (φ): ${phaseAngleDeg.toFixed(3)} °\n`;
    resultOutput += `•  Effektfaktor (cos φ): ${powerFactor.toFixed(3)}\n`;
    resultOutput += `•  Nytteeffekt (P): ${formatValue(realPower, 'W')}\n`;
    resultOutput += `•  Tilsyneladende effekt (S): ${formatValue(apparentPower, 'VA')}\n`;
    resultOutput += `•  Reaktiv effekt (Q): ${formatValue(reactivePower, 'var')}\n`;
    
    // Yderligere beregninger, hvis reaktansen eller impedansen er givet
    if (isCReactance && capacitance > 0) {
        resultOutput += `•  **Beregnet Kapacitans (C):** ${formatValue(C, 'F')}\n`;
    }
    if (isLReactance && inductance > 0) {
        resultOutput += `•  **Beregnet Induktans (L):** ${formatValue(L, 'H')}\n`;
    }
    if (isImpedance && impedance > 0 && L > 0) {
        resultOutput += `•  **Beregnet Induktans (L):** ${formatValue(L, 'H')}\n`;
    }
    
    document.getElementById('result').textContent = resultOutput;
}
