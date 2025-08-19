/**
 * @file scripts.js
 * @author  Gemini (via Google) and User
 * @license MIT
 * @description A JavaScript file for calculating series and parallel RLC circuits.
 * The core code was developed collaboratively with Gemini, a large language model from Google.
 */

// Funktion til at parse en værdi med enhed (k, M, m, u, n, p, l for XL, c for XC, z for Z)
function parseValue(input) {
    if (!input) return { value: 0, isLReactance: false, isCReactance: false, isImpedance: false };
    
    const rawValue = input.trim().toLowerCase();
    
    const isLReactance = rawValue.endsWith('l');
    const isCReactance = rawValue.endsWith('c');
    const isImpedance = rawValue.endsWith('z');

    // Fjern enhedsbogstavet, hvis det er en reaktans-enhed
    const valueString = isLReactance || isCReactance || isImpedance ? rawValue.slice(0, -1) : rawValue;
    const value = parseFloat(valueString);
    const unit = rawValue.slice(value.toString().length).trim();

    if (isNaN(value)) {
        return { value: 0, isLReactance: false, isCReactance: false, isImpedance: false };
    }

    let parsedValue = value;
    
    // Håndter SI-præfikser
    switch (unit.replace('l', '').replace('c', '').replace('z', '')) {
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
        isImpedance: impedanceResult.isImpedance
    };
}

// Opdaterer lommeregneren baseret på de indtastede værdier
function updateCalculator() {
    const { voltage, frequency, resistance, capacitance, inductance, impedance } = getValues();
    const resultBox = document.getElementById('result');
    
    // Check for gyldige input
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
    
    let xL, L;
    let xC, C;
    let totalImpedance;
    let totalCurrent;

    // Første trin: Håndter input
    xC = isCReactance ? capacitance : (capacitance > 0 ? 1 / (2 * Math.PI * frequency * capacitance) : 0);
    xL = isLReactance ? inductance : (inductance > 0 ? 2 * Math.PI * frequency * inductance : 0);
    
    // Beregn strømme, hvis reaktanser er givet
    const iR = voltage > 0 && resistance > 0 ? voltage / resistance : 0;
    const iC = voltage > 0 && xC > 0 ? voltage / xC : 0;
    const iL = voltage > 0 && xL > 0 ? voltage / xL : 0;

    // Andet trin: Beregn ud fra impedans, hvis den er givet
    if (isImpedance && impedance > 0) {
        totalImpedance = impedance;
        totalCurrent = voltage / totalImpedance;
        
        // Find den induktive strøm ved hjælp af total strøm og strømmen gennem R
        const iReactiveSquared = totalCurrent**2 - iR**2;
        const iReactive = Math.sqrt(Math.abs(iReactiveSquared)); // Brug Math.abs for at undgå fejl ved små unøjagtigheder
        iL = iReactive; // I et RL-kredsløb er den reaktive strøm = IL
        xL = iL > 0 ? voltage / iL : 0;
        L = xL > 0 ? xL / (2 * Math.PI * frequency) : 0;

    } else {
        totalCurrent = Math.sqrt(iR**2 + (iC - iL)**2);
        totalImpedance = totalCurrent > 0 ? voltage / totalCurrent : 0;
        L = inductance;
        C = capacitance;
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

    resultOutput += `**Formler brugt i rækkefølge:**\n\n`;
    resultOutput += `1. **Beregning af strømme:** Først finder vi strømmen gennem modstanden, da den er i fase med spændingen.\n`;
    resultOutput += `   •  Strøm gennem R: Ir = U / R\n\n`;
    if (isImpedance) {
        resultOutput += `2. **Beregning af total strøm og reaktans:** Da den totale impedans (Z) er givet, finder vi den totale strøm. Derefter bruger vi den totale strøm og strømmen gennem R til at finde den reaktive strøm (som er lig med strømmen gennem L, da vi antager en ideel spole).\n`;
        resultOutput += `   •  Total strøm: I(total) = U / Z\n`;
        resultOutput += `   •  Reaktiv strøm: I(reaktiv) = √(I(total)² - Ir²)\n`;
        resultOutput += `   •  Induktiv reaktans: Xl = U / I(reaktiv)\n\n`;
    } else {
        resultOutput += `2. **Beregning af total strøm og impedans:** Når de enkelte grenstrømme er kendte, kan vi finde den totale strøm ved at bruge Pythagoras' læresætning på strømmene. Derefter bruges Ohms lov til at finde den totale impedans.\n`;
        resultOutput += `   •  Total strøm: I(total) = √(Ir² + (Ic - Il)²)\n`;
        resultOutput += `   •  Total impedans: Z = U / I(total)\n\n`;
    }
    resultOutput += `3. **Beregning af fasevinkel:** Faseforskydningen mellem total strøm og spænding viser, om kredsløbet er induktivt eller kapacitivt.\n`;
    resultOutput += `   •  φ = arctan((Ic - Il) / Ir)\n\n`;

    resultOutput += `Beregnet reaktans og delstrømme:\n`;
    resultOutput += `•  Kapacitiv reaktans (Xc): ${formatValue(xC, 'Ohm')}\n`;
    resultOutput += `•  Induktiv reaktans (Xl): ${formatValue(xL, 'Ohm')}\n`;
    resultOutput += `•  Strøm gennem R (Ir): ${formatValue(iR, 'A')}\n`;
    resultOutput += `•  Strøm gennem L (Il): ${formatValue(iL, 'A')}\n`;
    resultOutput += `•  Strøm gennem C (Ic): ${formatValue(iC, 'A')}\n\n`;
    
    resultOutput += `Endelige resultater:\n`;
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
    if (isImpedance && impedance > 0 && xL > 0) {
        resultOutput += `•  **Beregnet Induktans (L):** ${formatValue(L, 'H')}\n`;
    }

    document.getElementById('result').textContent = resultOutput;
}
