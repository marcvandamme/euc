/**
 * @file scripts.js
 * @author  Gemini (via Google) and User
 * @license MIT
 * @description A JavaScript file for calculating series and parallel RLC circuits.
 * The core code was developed collaboratively with Gemini, a large language model from Google.
 */

// Funktion til at parse en værdi med enhed (k, M, m, u, n, p)
function parseValue(input) {
    if (!input) return 0;
    
    const value = parseFloat(input);
    const unit = input.slice(value.toString().length).toLowerCase().trim();

    if (isNaN(value)) {
        return 0;
    }

    switch (unit) {
        case 'k': // Kilo
            return value * 1e3;
        case 'm': // Milli
            return value * 1e-3;
        case 'u': // Mikro (μ)
            return value * 1e-6;
        case 'n': // Nano
            return value * 1e-9;
        case 'p': // Pico
            return value * 1e-12;
        default:
            return value;
    }
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
    const voltage = parseValue(document.getElementById('voltage').value);
    const resistance = parseValue(document.getElementById('resistance').value);
    const capacitance = parseValue(document.getElementById('capacitance').value);
    const inductance = parseValue(document.getElementById('inductance').value);
    const frequency = parseValue(document.getElementById('frequency').value);
    
    return { voltage, resistance, capacitance, inductance, frequency };
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
    const { voltage, resistance, capacitance, inductance, frequency } = getValues();
    let resultOutput = '';

    const xC = capacitance > 0 && frequency > 0 ? 1 / (2 * Math.PI * frequency * capacitance) : 0;
    const xL = inductance > 0 && frequency > 0 ? 2 * Math.PI * frequency * inductance : 0;
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
    resultOutput += `Kapacitans (C): ${formatValue(capacitance, 'F')}\n`;
    resultOutput += `Induktans (L): ${formatValue(inductance, 'H')}\n`;
    resultOutput += `Frekvens (f): ${formatValue(frequency, 'Hz')}\n\n`;
    
    resultOutput += `Formler brugt:\n`;
    resultOutput += `•  **Kapacitiv reaktans:** Xc = 1 / (2π * f * C)\n`;
    resultOutput += `•  **Induktiv reaktans:** Xl = 2π * f * L\n`;
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

// Beregning for parallelkredsløb (R, L, C, RL, RC, LC, RLC)
function calculateParallelRLC() {
    const { voltage, resistance, capacitance, inductance, frequency } = getValues();
    let resultOutput = '';

    const xC = capacitance > 0 && frequency > 0 ? 1 / (2 * Math.PI * frequency * capacitance) : 0;
    const xL = inductance > 0 && frequency > 0 ? 2 * Math.PI * frequency * inductance : 0;
    
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
    resultOutput += `Kapacitans (C): ${formatValue(capacitance, 'F')}\n`;
    resultOutput += `Induktans (L): ${formatValue(inductance, 'H')}\n`;
    resultOutput += `Frekvens (f): ${formatValue(frequency, 'Hz')}\n\n`;

    resultOutput += `Formler brugt (Strøm-metoden):\n`;
    resultOutput += `•  **Kapacitiv reaktans:** Xc = 1 / (2π * f * C)\n`;
    resultOutput += `•  **Induktiv reaktans:** Xl = 2π * f * L\n`;
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
