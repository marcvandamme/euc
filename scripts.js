/**
 * @file scripts.js
 * @author  Gemini (via Google) and User
 * @license MIT
 * @description A JavaScript file for calculating series and parallel RLC circuits.
 * The core code was developed collaboratively with Gemini, a large language model from Google.
 */

// Funktion til at parse en værdi med enhed (k, M, m, u, n, p, l for XL, c for XC)
function parseValue(input) {
    if (!input) return { value: 0, isLReactance: false, isCReactance: false };
    
    const rawValue = input.trim().toLowerCase();
    
    const isLReactance = rawValue.endsWith('l');
    const isCReactance = rawValue.endsWith('c');
    
    // Fjern enhedsbogstavet, hvis det er en reaktans-enhed
    const valueString = isLReactance || isCReactance ? rawValue.slice(0, -1) : rawValue;
    const value = parseFloat(valueString);
    const unit = rawValue.slice(value.toString().length).trim();

    if (isNaN(value)) {
        return { value: 0, isLReactance: false, isCReactance: false };
    }

    let parsedValue = value;
    
    // Håndter SI-præfikser
    switch (unit.replace('l', '').replace('c', '')) {
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
    
    return { value: parsedValue, isLReactance: isLReactance, isCReactance: isCReactance };
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
    const frequency = parseValue(document.getElementById('frequency').value).value;
    
    return {
        voltage,
        resistance,
        capacitance: capacitanceResult.value,
        inductance: inductanceResult.value,
        frequency,
        isLReactance: inductanceResult.isLReactance,
        isCReactance: capacitanceResult.isCReactance
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

    const L = isLReactance ? xL / (2 * Math.PI * frequency) : inductance;
    const C = isCReactance ? 1 / (2 * Math.PI * frequency * xC) : capacitance;
    
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
    resultOutput += `Modstand (R): ${formatValue(resistance, 'Ohm')}\n`;
    resultOutput += `Kapacitans (C): ${isCReactance ? `${formatValue(capacitance, 'Ohm')} (Xc)` : formatValue(capacitance, 'F')}\n`;
    resultOutput += `Induktans (L): ${isLReactance ? `${formatValue(inductance, 'Ohm')} (Xl)` : formatValue(inductance, 'H')}\n`;
    resultOutput += `Frekvens (f): ${formatValue(frequency, 'Hz')}\n\n`;
    
    resultOutput += `**Formler brugt i rækkefølge:**\n\n`;
    resultOutput += `1. **Beregning af reaktans:** Før vi kan finde den totale modstand, skal vi kende reaktansen for spolen og kondensatoren. Deres modstand afhænger af frekvensen og komponentens værdi.\n`;
    resultOutput += `   •  Kapacitiv reaktans: Xc = ${isCReactance ? 'Givet' : '1 / (2π * f * C)'}\n`;
    resultOutput += `   •  Induktiv reaktans: Xl = ${isLReactance ? 'Givet' : '2π * f * L'}\n\n`;
    resultOutput += `2. **Beregning af total impedans:** I et seriekredsløb er den totale modstand (impedans) den vektorielle sum af den ohmske modstand og reaktansen. Dette er et afgørende skridt for at finde den totale strøm.\n`;
    resultOutput += `   •  Z = √(R² + (Xl - Xc)²)\n\n`;
    resultOutput += `3. **Beregning af total strøm:** Når den totale impedans er kendt, kan vi finde den totale strøm ved at bruge Ohms lov for hele kredsløbet.\n`;
    resultOutput += `   •  I = U / Z\n\n`;
    resultOutput += `4. **Beregning af spændingsfald:** Når den totale strøm er kendt, kan vi finde spændingsfaldet over hver komponent ved at bruge Ohms lov for hver komponent individuelt.\n`;
    resultOutput += `   •  Ur = I * R, Ul = I * Xl, Uc = I * Xc\n\n`;
    resultOutput += `5. **Beregning af fasevinkel:** Faseforskydningen mellem strøm og spænding viser kredsløbets type (induktiv eller kapacitiv).\n`;
    resultOutput += `   •  φ = arctan((Xl - Xc) / R)\n\n`;

    resultOutput += `Beregnet reaktans og spændingsfald:\n`;
    resultOutput += `•  Kapacitiv reaktans (Xc): ${formatValue(xC, 'Ohm')}\n`;
    resultOutput += `•  Induktiv reaktans (Xl): ${formatValue(xL, 'Ohm')}\n`;
    resultOutput += `•  Spændingsfald over R (Ur): ${formatValue(uR, 'V')}\n`;
    resultOutput += `•  Spændingsfald over L (Ul): ${formatValue(uL, 'V')}\n`;
    resultOutput += `•  Spændingsfald over C (Uc): ${formatValue(uC, 'V')}\n\n`;
    
    resultOutput += `Endelige resultater:\n`;
    resultOutput += `•  Total impedans (Z): ${formatValue(impedance, 'Ohm')}\n`;
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
    const { voltage, resistance, capacitance, inductance, frequency, isLReactance, isCReactance } = getValues();
    let resultOutput = '';
    
    const xL = isLReactance ? inductance : (inductance > 0 && frequency > 0 ? 2 * Math.PI * frequency * inductance : 0);
    const xC = isCReactance ? capacitance : (capacitance > 0 && frequency > 0 ? 1 / (2 * Math.PI * frequency * capacitance) : 0);

    const L = isLReactance ? xL / (2 * Math.PI * frequency) : inductance;
    const C = isCReactance ? 1 / (2 * Math.PI * frequency * xC) : capacitance;
    
    const iR = voltage > 0 && resistance > 0 ? voltage / resistance : 0;
    const iC = voltage > 0 && xC > 0 ? voltage / xC : 0;
    const iL = voltage > 0 && xL > 0 ? voltage / xL : 0;

    const totalCurrent = Math.sqrt(iR**2 + (iC - iL)**2);
    
    let totalImpedance;
    let impedanceStr = 'N/A';
    
    if (totalCurrent > 0) {
        totalImpedance = voltage / totalCurrent;
        impedanceStr = formatValue(totalImpedance, 'Ohm');
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
    resultOutput += `Modstand (R): ${formatValue(resistance, 'Ohm')}\n`;
    resultOutput += `Kapacitans (C): ${isCReactance ? `${formatValue(capacitance, 'Ohm')} (Xc)` : formatValue(capacitance, 'F')}\n`;
    resultOutput += `Induktans (L): ${isLReactance ? `${formatValue(inductance, 'Ohm')} (Xl)` : formatValue(inductance, 'H')}\n`;
    resultOutput += `Frekvens (f): ${formatValue(frequency, 'Hz')}\n\n`;

    resultOutput += `**Formler brugt i rækkefølge:**\n\n`;
    resultOutput += `1. **Beregning af reaktans:** Først skal vi kende reaktansen for spolen og kondensatoren. Deres modstand afhænger af frekvensen og komponentens værdi.\n`;
    resultOutput += `   •  Kapacitiv reaktans: Xc = ${isCReactance ? 'Givet' : '1 / (2π * f * C)'}\n`;
    resultOutput += `   •  Induktiv reaktans: Xl = ${isLReactance ? 'Givet' : '2π * f * L'}\n\n`;
    resultOutput += `2. **Beregning af strømme:** I et parallelkredsløb er spændingen den samme over alle komponenter. Derfor beregner vi strømmen i hver enkelt gren ved hjælp af Ohms lov.\n`;
    resultOutput += `   •  Strøm gennem R: Ir = U / R\n`;
    resultOutput += `   •  Strøm gennem C: Ic = U / Xc\n`;
    resultOutput += `   •  Strøm gennem L: Il = U / Xl\n\n`;
    resultOutput += `3. **Beregning af total strøm og impedans:** Den totale strøm er den vektorielle sum af strømmene i grenene. Strømmen gennem modstanden ($I_R$) er i fase, mens $I_L$ og $I_C$ er $90^\circ$ faseforskudte. Vi bruger den samlede strøm til at finde den totale impedans.\n`;
    resultOutput += `   •  Total strøm: I(total) = √(Ir² + (Ic - Il)²)\n`;
    resultOutput += `   •  Total impedans: Z = U / I(total)\n\n`;
    resultOutput += `4. **Beregning af fasevinkel:** Faseforskydningen mellem total strøm og spænding viser, om kredsløbet er induktivt eller kapacitivt.\n`;
    resultOutput += `   •  φ = arctan((Ic - Il) / Ir)\n\n`;
    
    resultOutput += `Beregnet reaktans og delstrømme:\n`;
    resultOutput += `•  Kapacitiv reaktans (Xc): ${formatValue(xC, 'Ohm')}\n`;
    resultOutput += `•  Induktiv reaktans (Xl): ${formatValue(xL, 'Ohm')}\n`;
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
    
    // Yderligere beregninger, hvis reaktansen er givet
    if (isCReactance && capacitance > 0) {
        resultOutput += `•  **Beregnet Kapacitans (C):** ${formatValue(C, 'F')}\n`;
    }
    if (isLReactance && inductance > 0) {
        resultOutput += `•  **Beregnet Induktans (L):** ${formatValue(L, 'H')}\n`;
    }

    document.getElementById('result').textContent = resultOutput;
}
