/**
 * @file scripts.js
 * @author  Gemini (via Google) and User
 * @license MIT
 * @description A JavaScript file for calculating series and parallel RLC circuits.
 * The core code was developed collaboratively with Gemini, a large language model from Google.
 */

// Funktion til at parse en værdi med enhed (k, M, m, u, n, p, L for XL)
function parseValue(input) {
    if (!input) return { value: 0, isReactance: false };
    
    const rawValue = input.trim();
    const value = parseFloat(rawValue);
    const unit = rawValue.slice(value.toString().length).toLowerCase().trim();
    const isLReactance = unit === 'l'; // Korrigeret: Tjekker nu for eksakt 'l'

    if (isNaN(value)) {
        return { value: 0, isReactance: false };
    }

    let parsedValue = value;
    
    // Tjekker for standard SI-præfikser
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
            // Ingen enhed, værdi er som den er
            break;
    }
    
    return { value: parsedValue, isReactance: isLReactance };
}

// Funktion til at formatere et tal med enheder
function formatValue(value, unit) {
    if (Math.abs(value) >= 1e9) {
        return `${(value / 1e9).toFixed(3)} G${unit}`;
    } else if (Math.abs(value) >= 1e6) {
        return `${(value / 1e6).toFixed(3)} M${unit}`;
    } else if (Math.abs(value) >= 1e3) {
        return `${(value / 1e3).toFixed(3)} k${unit}`;
    } else if (Math.abs(value) >= 1) {
        return `${value.toFixed(3)} ${unit}`;
    } else if (Math.abs(value) >= 1e-3) {
        return `${(value / 1e-3).toFixed(3)} m${unit}`;
    } else if (Math.abs(value) >= 1e-6) {
        return `${(value / 1e-6).toFixed(3)} μ${unit}`;
    } else if (Math.abs(value) >= 1e-9) {
        return `${(value / 1e-9).toFixed(3)} n${unit}`;
    } else if (Math.abs(value) >= 1e-12) {
        return `${(value / 1e-12).toFixed(3)} p${unit}`;
    } else {
        return `${value.toFixed(3)} ${unit}`;
    }
}

// Funktion til at læse værdier fra inputfelterne og kalde parseValue
function getValues() {
    const voltage = parseValue(document.getElementById('voltage').value).value;
    const resistance = parseValue(document.getElementById('resistance').value).value;
    const capacitanceResult = parseValue(document.getElementById('capacitance').value);
    const inductanceResult = parseValue(document.getElementById('inductance').value);
    const frequency = parseValue(document.getElementById('frequency').value).value;
    
    return {
        voltage,
        resistance,
        capacitance: capacitanceResult.value,
        inductance: inductanceResult.value,
        frequency,
        isLReactance: inductanceResult.isReactance,
        isCReactance: capacitanceResult.isReactance
    };
}

// Opdaterer lommeregneren baseret på de indtastede værdier
function updateCalculator() {
    const { voltage, resistance, capacitance, inductance, frequency } = getValues();
    const resultBox = document.getElementById('result');
    
    if (voltage <= 0 || frequency <= 0 || (resistance <= 0 && capacitance <= 0 && inductance <= 0)) {
        resultBox.textContent = "Indtast venligst spænding, frekvens, og mindst én af R, L, eller C.";
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
    document.getElementById('result').textContent = 'Dine resultater vil vises her...';
}

// Tilføj event listeners til knapperne
document.getElementById('calculate-button').addEventListener('click', updateCalculator);
document.getElementById('reset-button').addEventListener('click', resetCalculator);


// Generel beregning for seriekredsløb (R, L, C, RL, RC, LC, RLC)
function calculateSeriesRLC() {
    const { voltage, resistance, capacitance, inductance, frequency, isLReactance, isCReactance } = getValues();
    let resultOutput = '';

    const xL = isLReactance ? inductance : (inductance > 0 && frequency > 0 ? 2 * Math.PI * frequency * inductance : 0);
    const xC = isCReactance ? capacitance : (capacitance > 0 && frequency > 0 ? 1 / (2 * Math.PI * frequency * capacitance) : 0);

    const impedance = Math.sqrt(resistance * resistance + Math.pow(xL - xC, 2));
    const current = voltage > 0 && impedance > 0 ? voltage / impedance : 0;

    let powerFactor = (impedance > 0) ? resistance / impedance : 0;
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
    resultOutput += `Modstand (R): ${formatValue(resistance, 'Ω')}\n`;
    resultOutput += `Kapacitans (C): ${isCReactance ? `${formatValue(capacitance, 'Ω')} (Xc)` : formatValue(capacitance, 'F')}\n`;
    resultOutput += `Induktans (L): ${isLReactance ? `${formatValue(inductance, 'Ω')} (Xl)` : formatValue(inductance, 'H')}\n`;
    resultOutput += `Frekvens (f): ${formatValue(frequency, 'Hz')}\n\n`;
    
    resultOutput += `Formler brugt:\n`;
    resultOutput += `•  **Kapacitiv reaktans:** Xc = ${isCReactance ? 'Givet' : '1 / (2π * f * C)'}\n`;
    resultOutput += `•  **Induktiv reaktans:** Xl = ${isLReactance ? 'Givet' : '2π * f * L'}\n`;
    resultOutput += `•  **Total impedans:** Z = √(R² + (Xl - Xc)²)\n`;
    resultOutput += `•  **Total strøm:** I = U / Z\n`;
    resultOutput += `•  **Spændingsfald:** Ur = I * R, Ul = I * Xl, Uc = I * Xc\n`;
    resultOutput += `•  **Fasevinkel:** φ = arctan((Xl - Xc) / R)\n\n`;

    resultOutput += `Beregnet reaktans og spændingsfald:\n`;
    resultOutput += `•  Kapacitiv reaktans (Xc): ${formatValue(xC, 'Ω')}\n`;
    resultOutput += `•  Induktiv reaktans (Xl): ${formatValue(xL, 'Ω')}\n`;
    resultOutput += `•  Spændingsfald over R (Ur): ${formatValue(uR, 'V')}\n`;
    resultOutput += `•  Spændingsfald over L (Ul): ${formatValue(uL, 'V')}\n`;
    resultOutput += `•  Spændingsfald over C (Uc): ${formatValue(uC, 'V')}\n\n`;
    
    resultOutput += `Endelige resultater:\n`;
    resultOutput += `•  Total impedans (Z): ${formatValue(impedance, 'Ω')}\n`;
    resultOutput += `•  Total strøm (I): ${formatValue(current, 'A')}\n`;
    resultOutput += `•  Faseforskydningsvinkel (φ): ${phaseAngleDeg.toFixed(3)} °\n`;
    resultOutput += `•  Effektfaktor (cos φ): ${powerFactor.toFixed(3)}\n`;
    resultOutput += `•  Nytteeffekt (P): ${formatValue(realPower, 'W')}\n`;
    resultOutput += `•  Tilsyneladende effekt (S): ${formatValue(apparentPower, 'VA')}\n`;
    resultOutput += `•  Reaktiv effekt (Q): ${formatValue(reactivePower, 'var')}\n`;

    document.getElementById('result').textContent = resultOutput;
}

// Generel beregning for parallelkredsløb (R, L, C, RL, RC, LC, RLC)
function calculateParallelRLC() {
    const { voltage, resistance, capacitance, inductance, frequency, isLReactance, isCReactance } = getValues();
    let resultOutput = '';
    
    const xL = isLReactance ? inductance : (inductance > 0 && frequency > 0 ? 2 * Math.PI * frequency * inductance : 0);
    const xC = isCReactance ? capacitance : (capacitance > 0 && frequency > 0 ? 1 / (2 * Math.PI * frequency * capacitance) : 0);
    
    const iR = voltage > 0 && resistance > 0 ? voltage / resistance : 0;
    const iC = voltage > 0 && xC > 0 ? voltage / xC : 0;
    const iL = voltage > 0 && xL > 0 ? voltage / xL : 0;

    const totalCurrent = Math.sqrt(iR**2 + (iC - iL)**2);
    
    let totalImpedance;
    let impedanceStr = 'N/A';
    
    if (totalCurrent > 0) {
        totalImpedance = voltage / totalCurrent;
        impedanceStr = formatValue(totalImpedance, 'Ω');
    }
    
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
    resultOutput += `Modstand (R): ${formatValue(resistance, 'Ω')}\n`;
    resultOutput += `Kapacitans (C): ${isCReactance ? `${formatValue(capacitance, 'Ω')} (Xc)` : formatValue(capacitance, 'F')}\n`;
    resultOutput += `Induktans (L): ${isLReactance ? `${formatValue(inductance, 'Ω')} (Xl)` : formatValue(inductance, 'H')}\n`;
    resultOutput += `Frekvens (f): ${formatValue(frequency, 'Hz')}\n\n`;

    resultOutput += `Formler brugt (Strøm-metoden):\n`;
    resultOutput += `•  **Kapacitiv reaktans:** Xc = ${isCReactance ? 'Givet' : '1 / (2π * f * C)'}\n`;
    resultOutput += `•  **Induktiv reaktans:** Xl = ${isLReactance ? 'Givet' : '2π * f * L'}\n`;
    resultOutput += `•  **Strømme:** Ir = U / R, Ic = U / Xc, Il = U / Xl\n`;
    resultOutput += `•  **Total strøm:** I(total) = √(Ir² + (Ic - Il)²)\n`;
    resultOutput += `•  **Total impedans:** Z = U / I(total)\n`;
    resultOutput += `•  **Fasevinkel:** φ = arctan((Ic - Il) / Ir)\n\n`;
    
    resultOutput += `Beregnet reaktans og delstrømme:\n`;
    resultOutput += `•  Kapacitiv reaktans (Xc): ${formatValue(xC, 'Ω')}\n`;
    resultOutput += `•  Induktiv reaktans (Xl): ${formatValue(xL, 'Ω')}\n`;
    resultOutput += `•  Strøm gennem R (Ir): ${formatValue(iR, 'A')}\n`;
    resultOutput += `•  Strøm gennem L (Il): ${formatValue(iL, 'A')}\n`;
    resultOutput += `•  Strøm gennem C (Ic): ${formatValue(iC, 'A')}\n\n`;
    
    resultOutput += `Endelige resultater:\n`;
    resultOutput += `•  Total impedans (Z): ${impedanceStr}\n`;
    resultOutput += `•  Total strøm (I): ${formatValue(totalCurrent, 'A')}\n`;
    resultOutput += `•  Faseforskydningsvinkel (φ): ${phaseAngleDeg.toFixed(3)} °\n`;
    resultOutput += `•  Effektfaktor (cos φ): ${powerFactor.toFixed(3)}\n`;
    resultOutput += `•  Nytteeffekt (P): ${formatValue(realPower, 'W')}\n`;
    resultOutput += `•  Tilsyneladende effekt (S): ${formatValue(apparentPower, 'VA')}\n`;
    resultOutput += `•  Reaktiv effekt (Q): ${formatValue(reactivePower, 'var')}\n`;

    document.getElementById('result').textContent = resultOutput;
}
