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
        const roundedValue = (value / 1e-3).toFixed(3);
        const altUnit = unit === 'A' ? 'A' : 'V';
        return `${roundedValue} m${unit} (${(value).toFixed(2)} ${altUnit})`;
    } else if (Math.abs(value) >= 1e-6) {
        const roundedValue = (value / 1e-6).toFixed(3);
        const altUnit = unit === 'A' ? 'A' : 'V';
        return `${roundedValue} μ${unit} (${(value / 1e-3).toFixed(2)} m${altUnit})`;
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
    const current = parseValue(document.getElementById('current').value);
    const resistance = parseValue(document.getElementById('resistance').value);
    const capacitance = parseValue(document.getElementById('capacitance').value);
    const inductance = parseValue(document.getElementById('inductance').value);
    const frequency = parseValue(document.getElementById('frequency').value);
    
    return { voltage, current, resistance, capacitance, inductance, frequency };
}

// Opdaterer lommeregneren baseret på de indtastede værdier
function updateCalculator() {
    const { voltage, current, resistance, capacitance, inductance, frequency } = getValues();
    let resultOutput = '';
    const resultBox = document.getElementById('result');

    // Tjekker for parallel RLC fra effekt
    if (voltage > 0 && resistance === 0 && capacitance > 0 && inductance > 0 && frequency > 0) {
        const powerInput = document.getElementById('power').value;
        const power = parseValue(powerInput);
        if (power > 0) {
            calculateParallelRLC_FromPower(power);
            return;
        }
    }

    // Tjekker for parallel RLC
    if (voltage > 0 && resistance > 0 && capacitance > 0 && inductance > 0 && frequency > 0) {
        calculateParallelRLC();
        return;
    }

    // Tjekker for parallel RL-kredsløb
    if (voltage > 0 && resistance > 0 && inductance > 0 && frequency > 0 && capacitance === 0) {
        calculateParallelRL();
        return;
    }
    
    // Tjekker for parallel RC-kredsløb
    if (voltage > 0 && resistance > 0 && capacitance > 0 && frequency > 0 && inductance === 0) {
        calculateParallelRC();
        return;
    }

    // Tjekker for seriekredsløb
    if (voltage > 0 && resistance > 0 && (inductance > 0 || capacitance > 0) && frequency > 0) {
        calculateSeriesRLC();
        return;
    }
    
    // Tjekker for at finde Kapacitans
    if (voltage > 0 && current > 0 && resistance > 0 && frequency > 0 && inductance === 0) {
        calculateCapacitance();
        return;
    }

    // Tjekker for at finde Induktans
    if (voltage > 0 && current > 0 && resistance > 0 && frequency > 0 && capacitance === 0) {
        calculateInductance();
        return;
    }

    // Tjekker for at finde Frekvens
    if (voltage > 0 && current > 0 && resistance > 0 && (capacitance > 0 || inductance > 0)) {
        calculateFrequency();
        return;
    }

    // Hvis ingen gyldige kombinationer er fundet
    resultOutput = "Fejl: Ikke nok information til at beregne et kredsløb. Indtast venligst tilstrækkelige værdier.";
    resultBox.textContent = resultOutput;
}

// Nulstiller alle inputfelter og resultatvisningen
function resetCalculator() {
    document.getElementById('voltage').value = '';
    document.getElementById('current').value = '';
    document.getElementById('resistance').value = '';
    document.getElementById('capacitance').value = '';
    document.getElementById('inductance').value = '';
    document.getElementById('frequency').value = '';
    document.getElementById('result').textContent = 'Dine resultater vil vises her...';
}

// Tilføj event listeners til alle inputfelter for at kalde updateCalculator automatisk
document.querySelectorAll('.input-group input').forEach(input => {
    input.addEventListener('input', updateCalculator);
});

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

    // Beregning af spændingsfald i seriekredsløb
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
    resultOutput += `•  **Spændingsfald:**\n`;
    resultOutput += `    - Spændingsfaldet over hver komponent findes ved at gange kredsløbets samlede strøm med den enkelte komponents modstand/reaktans.\n`;
    resultOutput += `    - Ur = I * R\n`;
    resultOutput += `    - Ul = I * Xl\n`;
    resultOutput += `    - Uc = I * Xc\n`;
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
    
    const realPower = voltage * totalCurrent * powerFactor;


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

    document.getElementById('result').textContent = resultOutput;
}

// Beregner kapacitans ud fra R, I, U og f
function calculateCapacitance() {
    const { voltage, current, resistance, frequency, inductance } = getValues();
    let resultOutput = '';

    if (voltage === 0 || current === 0 || frequency === 0) {
        resultOutput = "Fejl: Spænding, strøm og frekvens skal indtastes for at beregne kapacitans.";
        document.getElementById('result').textContent = resultOutput;
        return;
    }

    const U = voltage;
    const I = current;
    const R = resistance;
    const f = frequency;
    const L = inductance;

    const Z = U / I;

    if (Z < R) {
        resultOutput = "Fejl: Impedans (Z) er mindre end modstand (R). Kontroller dine værdier.";
        document.getElementById('result').textContent = resultOutput;
        return;
    }
    const X_total = Math.sqrt(Z * Z - R * R);

    let Xc_beregnet = X_total;
    if (L > 0) {
        const Xl_beregnet = 2 * Math.PI * f * L;
        resultOutput += "Bemærk: Kredsløbet indeholder en spole (L). Denne beregning er en forenkling og kan være unøjagtig.\n\n";
        Xc_beregnet = Math.abs(Xl_beregnet - X_total); 
    }
    
    let C_beregnet = 0;
    if (f > 0 && Xc_beregnet > 0) {
        C_beregnet = 1 / (2 * Math.PI * f * Xc_beregnet);
    }
    
    let powerFactor = (Z > 0) ? R / Z : 0;
    let phaseAngleDeg = 0;
    if (powerFactor > 1) { 
        powerFactor = 1;
    }
    phaseAngleDeg = Math.acos(powerFactor) * (180 / Math.PI);
    
    const realPower = U * I * powerFactor;

    resultOutput += `--- Beregn Kapacitans (C) - ud fra U, I, R og f ---\n\n`;
    resultOutput += `Indtastede værdier:\n`;
    resultOutput += `Spænding (U): ${formatValue(U, 'V')}\n`;
    resultOutput += `Strøm (I): ${formatValue(I, 'A')}\n`;
    resultOutput += `Modstand (R): ${formatValue(R, 'Ω')}\n`;
    resultOutput += `Frekvens (f): ${formatValue(f, 'Hz')}\n\n`;

    resultOutput += `Formler brugt:\n`;
    resultOutput += `•  **Total impedans:** Z = U / I\n`;
    resultOutput += `•  **Total reaktans:** X = √(Z² - R²)\n`;
    resultOutput += `•  **Kapacitans:** C = 1 / (2π * f * X)\n`;
    resultOutput += `   *Bemærk: Hvis L er indtastet, bruges X = |Xl - Xc| og Xc isoleres derudfra.*\n\n`;


    resultOutput += `Beregnet mellemresultat:\n`;
    resultOutput += `•  Total impedans (Z): ${formatValue(Z, 'Ω')}\n`;
    resultOutput += `•  Total reaktans (X_total): ${formatValue(X_total, 'Ω')}\n\n`;

    resultOutput += `Endelige resultater:\n`;
    resultOutput += `•  Kapacitiv reaktans (Xc): ${formatValue(Xc_beregnet, 'Ω')}\n`;
    resultOutput += `•  Kapacitans (C): ${formatValue(C_beregnet, 'F')}\n`;
    resultOutput += `•  Kapacitans i mikrofarad (µF): ${(C_beregnet * 1e6).toFixed(3)} µF\n`;
    resultOutput += `•  Faseforskydningsvinkel (φ): ${phaseAngleDeg.toFixed(3)} °\n`;
    resultOutput += `•  Effektfaktor (cos φ): ${powerFactor.toFixed(3)}\n`;
    resultOutput += `•  Nytteeffekt (P): ${formatValue(realPower, 'W')}\n`;

    document.getElementById('result').textContent = resultOutput;
}

// Beregner induktans ud fra R, I, U og f
function calculateInductance() {
    const { voltage, current, resistance, frequency, capacitance } = getValues();
    let resultOutput = '';

    if (voltage === 0 || current === 0 || frequency === 0) {
        resultOutput = "Fejl: Spænding, strøm og frekvens skal indtastes for at beregne induktans.";
        document.getElementById('result').textContent = resultOutput;
        return;
    }

    const U = voltage;
    const I = current;
    const R = resistance;
    const f = frequency;
    const C = capacitance;
    
    const Z = U / I;

    if (Z < R) {
        resultOutput = "Fejl: Impedans (Z) er mindre end modstand (R). Kontroller dine værdier.";
        document.getElementById('result').textContent = resultOutput;
        return;
    }
    const X_total = Math.sqrt(Z * Z - R * R);

    let Xl_beregnet = X_total;
    if (C > 0) {
        const Xc_beregnet = 1 / (2 * Math.PI * f * C);
        resultOutput += "Bemærk: Kredsløbet indeholder en kondensator (C). Denne beregning er en forenkling og kan være unøjagtig.\n\n";
        Xl_beregnet = Math.abs(Xl_beregnet - Xc_beregnet);
    }

    let L_beregnet = 0;
    if (f > 0 && Xl_beregnet > 0) {
        L_beregnet = Xl_beregnet / (2 * Math.PI * f);
    }
    
    let powerFactor = (Z > 0) ? R / Z : 0;
    let phaseAngleDeg = 0;
    if (powerFactor > 1) {
        powerFactor = 1;
    }
    phaseAngleDeg = Math.acos(powerFactor) * (180 / Math.PI);

    resultOutput += `--- Beregn Induktans (L) - ud fra U, I, R og f ---\n\n`;
    resultOutput += `Indtastede værdier:\n`;
    resultOutput += `Spænding (U): ${formatValue(U, 'V')}\n`;
    resultOutput += `Strøm (I): ${formatValue(I, 'A')}\n`;
    resultOutput += `Modstand (R): ${formatValue(R, 'Ω')}\n`;
    resultOutput += `Frekvens (f): ${formatValue(f, 'Hz')}\n\n`;

    resultOutput += `Formler brugt:\n`;
    resultOutput += `•  **Total impedans:** Z = U / I\n`;
    resultOutput += `•  **Total reaktans:** X = √(Z² - R²)\n`;
    resultOutput += `•  **Induktans:** L = X / (2π * f)\n`;
    resultOutput += `   *Bemærk: Hvis C er indtastet, bruges X = |Xl - Xc| og Xl isoleres derudfra.*\n\n`;

    resultOutput += `Beregnet mellemresultat:\n`;
    resultOutput += `•  Total impedans (Z): ${formatValue(Z, 'Ω')}\n`;
    resultOutput += `•  Total reaktans (X_total): ${formatValue(X_total, 'Ω')}\n\n`;

    resultOutput += `Endelige resultater:\n`;
    resultOutput += `•  Induktiv reaktans (Xl): ${formatValue(Xl_beregnet, 'Ω')}\n`;
    resultOutput += `•  Induktans (L): ${formatValue(L_beregnet, 'H')}\n`;
    resultOutput += `•  Induktans i millihenry (mH): ${(L_beregnet * 1e3).toFixed(3)} mH\n`;
    resultOutput += `•  Faseforskydningsvinkel (φ): ${phaseAngleDeg.toFixed(3)} °\n`;
    resultOutput += `•  Effektfaktor (cos φ): ${powerFactor.toFixed(3)}\n`;

    document.getElementById('result').textContent = resultOutput;
}

// Beregner frekvens ud fra R, I, U, L, C
function calculateFrequency() {
    const { voltage, current, resistance, capacitance, inductance } = getValues();
    let resultOutput = '';

    if (voltage === 0 || current === 0 || resistance === 0 || (capacitance === 0 && inductance === 0)) {
        resultOutput = "Fejl: Spænding, strøm, modstand, og enten kapacitans eller induktans skal indtastes for at beregne frekvens.";
        document.getElementById('result').textContent = resultOutput;
        return;
    }
    
    const U = voltage;
    const I = current;
    const R = resistance;
    const C = capacitance;
    const L = inductance;

    const Z = U / I;
    if (Z < R) {
        resultOutput = "Fejl: Impedans (Z) er mindre end modstand (R). Kontroller dine værdier.";
        document.getElementById('result').textContent = resultOutput;
        return;
    }
    const X_total = Math.sqrt(Z * Z - R * R);

    let frequency_calculated = 0;
    let componentType = 'ukendt';
    
    if (C > 0 && L === 0) {
        // Ren RC kredsløb
        componentType = 'RC';
        if (X_total > 0 && C > 0) {
            frequency_calculated = 1 / (2 * Math.PI * X_total * C);
        }
    } else if (L > 0 && C === 0) {
        // Ren RL kredsløb
        componentType = 'RL';
        if (X_total > 0 && L > 0) {
            frequency_calculated = X_total / (2 * Math.PI * L);
        }
    } else {
        resultOutput = "Bemærk: Frekvensberegning er kun understøttet for simple serie RC- eller RL-kredsløb. Du skal indtaste enten en kondensator (C) eller en spole (L), men ikke begge.";
        document.getElementById('result').textContent = resultOutput;
        return;
    }
    
    let powerFactor = (Z > 0) ? R / Z : 0;
    if (powerFactor > 1) {
        powerFactor = 1;
    }
    const phaseAngleDeg = Math.acos(powerFactor) * (180 / Math.PI);
    
    resultOutput += `--- Beregn Frekvens (f) for ${componentType} Kredsløb ---\n\n`;
    resultOutput += `Indtastede værdier:\n`;
    resultOutput += `Spænding (U): ${formatValue(U, 'V')}\n`;
    resultOutput += `Strøm (I): ${formatValue(I, 'A')}\n`;
    resultOutput += `Modstand (R): ${formatValue(R, 'Ω')}\n`;
    if (C > 0) resultOutput += `Kapacitans (C): ${formatValue(C, 'F')}\n`;
    if (L > 0) resultOutput += `Induktans (L): ${formatValue(L, 'H')}\n\n`;

    resultOutput += `Formler brugt:\n`;
    resultOutput += `•  **Total impedans:** Z = U / I\n`;
    resultOutput += `•  **Total reaktans:** X = √(Z² - R²)\n`;
    if (C > 0) resultOutput += `•  **Frekvens:** f = 1 / (2π * X * C)\n\n`;
    if (L > 0) resultOutput += `•  **Frekvens:** f = X / (2π * L)\n\n`;

    resultOutput += `Beregnet mellemresultat:\n`;
    resultOutput += `•  Total impedans (Z): ${formatValue(Z, 'Ω')}\n`;
    resultOutput += `•  Total reaktans (X_total): ${formatValue(X_total, 'Ω')}\n\n`;

    resultOutput += `Endelige resultater:\n`;
    resultOutput += `•  Frekvens (f): ${formatValue(frequency_calculated, 'Hz')}\n`;
    resultOutput += `•  Faseforskydningsvinkel (φ): ${phaseAngleDeg.toFixed(3)} °\n`;
    resultOutput += `•  Effektfaktor (cos φ): ${powerFactor.toFixed(3)}\n`;

    document.getElementById('result').textContent = resultOutput;
}

// Ny funktion for parallel RL kredsløb
function calculateParallelRL() {
    const { voltage, resistance, inductance, frequency } = getValues();
    let resultOutput = '';

    if (voltage <= 0 || resistance <= 0 || inductance <= 0 || frequency <= 0) {
        resultOutput = "Fejl: Indtast venligst positive værdier for Spænding, Modstand, Induktans og Frekvens for at beregne parallel RL-kredsløb.";
        document.getElementById('result').textContent = resultOutput;
        return;
    }

    // Beregning af reaktans
    const xL = 2 * Math.PI * frequency * inductance;

    // Beregning af strømme
    const iR = voltage / resistance;
    const iL = voltage / xL;
    const iTotal = Math.sqrt(Math.pow(iR, 2) + Math.pow(iL, 2));

    // Beregning af total impedans
    const zTotal = voltage / iTotal;

    // Beregning af fasevinkel og effektfaktor
    const powerFactor = iR / iTotal;
    const phaseAngleDeg = Math.atan(iL / iR) * (180 / Math.PI);
    const realPower = voltage * iTotal * powerFactor;

    resultOutput += `--- Parallel RL Kredsløb ---\n\n`;
    resultOutput += `Indtastede værdier:\n`;
    resultOutput += `Spænding (U): ${formatValue(voltage, 'V')}\n`;
    resultOutput += `Modstand (R): ${formatValue(resistance, 'Ω')}\n`;
    resultOutput += `Induktans (L): ${formatValue(inductance, 'H')}\n`;
    resultOutput += `Frekvens (f): ${formatValue(frequency, 'Hz')}\n\n`;

    resultOutput += `Formler brugt (Strøm-metoden):\n`;
    resultOutput += `•  **Induktiv reaktans:** Xl = 2π * f * L\n`;
    resultOutput += `•  **Strøm gennem R:** Ir = U / R\n`;
    resultOutput += `•  **Strøm gennem L:** Il = U / Xl\n`;
    resultOutput += `•  **Total strøm:** I(total) = √(Ir² + Il²)\n`;
    resultOutput += `•  **Total impedans:** Z = U / I(total)\n`;
    resultOutput += `•  **Fasevinkel:** φ = arctan(Il / Ir)\n\n`;


    resultOutput += `Beregnet reaktans og strømme:\n`;
    resultOutput += `•  Induktiv reaktans (Xl): ${formatValue(xL, 'Ω')}\n`;
    resultOutput += `•  Strøm gennem R (Ir): ${formatValue(iR, 'A')}\n`;
    resultOutput += `•  Strøm gennem L (Il): ${formatValue(iL, 'A')}\n\n`;

    resultOutput += `Endelige resultater:\n`;
    resultOutput += `•  Total impedans (Z): ${formatValue(zTotal, 'Ω')}\n`;
    resultOutput += `•  Total strøm (I): ${formatValue(iTotal, 'A')}\n`;
    resultOutput += `•  Faseforskydningsvinkel (φ): ${phaseAngleDeg.toFixed(3)} °\n`;
    resultOutput += `•  Effektfaktor (cos φ): ${powerFactor.toFixed(3)}\n`;
    resultOutput += `•  Nytteeffekt (P): ${formatValue(realPower, 'W')}\n`;

    document.getElementById('result').textContent = resultOutput;
}

// Ny funktion for parallel RC kredsløb
function calculateParallelRC() {
    const { voltage, resistance, capacitance, frequency } = getValues();
    let resultOutput = '';

    if (voltage <= 0 || resistance <= 0 || capacitance <= 0 || frequency <= 0) {
        resultOutput = "Fejl: Indtast venligst positive værdier for Spænding, Modstand, Kapacitans og Frekvens for at beregne parallel RC-kredsløb.";
        document.getElementById('result').textContent = resultOutput;
        return;
    }

    // Beregning af reaktans
    const xC = 1 / (2 * Math.PI * frequency * capacitance);

    // Beregning af strømme
    const iR = voltage / resistance;
    const iC = voltage / xC;
    const iTotal = Math.sqrt(Math.pow(iR, 2) + Math.pow(iC, 2));

    // Beregning af total impedans
    const zTotal = voltage / iTotal;

    // Beregning af fasevinkel og effektfaktor
    const powerFactor = iR / iTotal;
    // Fasevinklen er negativ for et kapacitivt kredsløb
    const phaseAngleDeg = -Math.atan(iC / iR) * (180 / Math.PI);
    const realPower = voltage * iTotal * powerFactor;

    resultOutput += `--- Parallel RC Kredsløb ---\n\n`;
    resultOutput += `Indtastede værdier:\n`;
    resultOutput += `Spænding (U): ${formatValue(voltage, 'V')}\n`;
    resultOutput += `Modstand (R): ${formatValue(resistance, 'Ω')}\n`;
    resultOutput += `Kapacitans (C): ${formatValue(capacitance, 'F')}\n`;
    resultOutput += `Frekvens (f): ${formatValue(frequency, 'Hz')}\n\n`;

    resultOutput += `Formler brugt (Strøm-metoden):\n`;
    resultOutput += `•  **Kapacitiv reaktans:** Xc = 1 / (2π * f * C)\n`;
    resultOutput += `•  **Strøm gennem R:** Ir = U / R\n`;
    resultOutput += `•  **Strøm gennem C:** Ic = U / Xc\n`;
    resultOutput += `•  **Total strøm:** I(total) = √(Ir² + Ic²)\n`;
    resultOutput += `•  **Total impedans:** Z = U / I(total)\n`;
    resultOutput += `•  **Fasevinkel:** φ = -arctan(Ic / Ir)\n\n`;


    resultOutput += `Beregnet reaktans og strømme:\n`;
    resultOutput += `•  Kapacitiv reaktans (Xc): ${formatValue(xC, 'Ω')}\n`;
    resultOutput += `•  Strøm gennem R (Ir): ${formatValue(iR, 'A')}\n`;
    resultOutput += `•  Strøm gennem C (Ic): ${formatValue(iC, 'A')}\n\n`;

    resultOutput += `Endelige resultater:\n`;
    resultOutput += `•  Total impedans (Z): ${formatValue(zTotal, 'Ω')}\n`;
    resultOutput += `•  Total strøm (I): ${formatValue(iTotal, 'A')}\n`;
    resultOutput += `•  Faseforskydningsvinkel (φ): ${phaseAngleDeg.toFixed(3)} °\n`;
    resultOutput += `•  Effektfaktor (cos φ): ${powerFactor.toFixed(3)}\n`;
    resultOutput += `•  Nytteeffekt (P): ${formatValue(realPower, 'W')}\n`;

    document.getElementById('result').textContent = resultOutput;
}


// Ny funktion, der beregner et parallel RLC kredsløb fra nytteeffekt
function calculateParallelRLC_FromPower(power) {
    const { voltage, capacitance, inductance, frequency } = getValues();
    let resultOutput = '';

    if (voltage <= 0 || capacitance <= 0 || inductance <= 0 || frequency <= 0 || power <= 0) {
        resultOutput = "Fejl: Indtast positive værdier for Spænding, Kapacitans, Induktans, Frekvens og Nytteeffekt.";
        document.getElementById('result').textContent = resultOutput;
        return;
    }

    // Beregning af modstand R fra nytteeffekt P
    const resistance = (voltage * voltage) / power;

    // Beregning af reaktanser
    const xC = 1 / (2 * Math.PI * frequency * capacitance);
    const xL = 2 * Math.PI * frequency * inductance;

    // Beregning af strømme i hver gren
    const iR = voltage / resistance;
    const iL = voltage / xL;
    const iC = voltage / xC;

    // Beregning af total strøm
    const i_total_real = iR;
    const i_total_imaginary = iC - iL;
    const totalCurrent = Math.sqrt(i_total_real**2 + i_total_imaginary**2);

    // Beregning af total impedans
    const totalImpedance = voltage / totalCurrent;

    // Beregning af fasevinkel og effektfaktor
    const powerFactor = i_total_real / totalCurrent;
    const phaseAngleRad = Math.atan(i_total_imaginary / i_total_real);
    const phaseAngleDeg = phaseAngleRad * (180 / Math.PI);
    const realPower = voltage * totalCurrent * powerFactor;

    resultOutput += `--- Parallel RLC Kredsløb fra Nytteeffekt ---\n\n`;
    resultOutput += `Indtastede værdier:\n`;
    resultOutput += `Spænding (U): ${formatValue(voltage, 'V')}\n`;
    resultOutput += `Nytteeffekt (P): ${formatValue(power, 'W')}\n`;
    resultOutput += `Kapacitans (C): ${formatValue(capacitance, 'F')}\n`;
    resultOutput += `Induktans (L): ${formatValue(inductance, 'H')}\n`;
    resultOutput += `Frekvens (f): ${formatValue(frequency, 'Hz')}\n\n`;

    resultOutput += `Formler brugt:\n`;
    resultOutput += `•  **Modstand:** R = U² / P\n`;
    resultOutput += `•  **Reaktans:** Xl = 2π * f * L, Xc = 1 / (2π * f * C)\n`;
    resultOutput += `•  **Delstrømme:** Ir = U / R, Il = U / Xl, Ic = U / Xc\n`;
    resultOutput += `•  **Total strøm:** I(total) = √(Ir² + (Ic - Il)²)\n`;
    resultOutput += `•  **Total impedans:** Z = U / I(total)\n`;
Output += `•  **Fasevinkel:** φ = arctan((Ic - Il) / Ir)\n\n`;

    resultOutput += `Beregnet modstand, reaktanser og delstrømme:\n`;
    resultOutput += `•  Beregnet modstand (R): ${formatValue(resistance, 'Ω')}\n`;
    resultOutput += `•  Kapacitiv reaktans (Xc): ${formatValue(xC, 'Ω')}\n`;
    resultOutput += `•  Induktiv reaktans (Xl): ${formatValue(xL, 'Ω')}\n`;
    resultOutput += `•  Strøm gennem R (Ir): ${formatValue(iR, 'A')}\n`;
    resultOutput += `•  Strøm gennem L (Il): ${formatValue(iL, 'A')}\n`;
    resultOutput += `•  Strøm gennem C (Ic): ${formatValue(iC, 'A')}\n\n`;

    resultOutput += `Endelige resultater:\n`;
    resultOutput += `•  Total impedans (Z): ${formatValue(totalImpedance, 'Ω')}\n`;
    resultOutput += `•  Total strøm (I): ${formatValue(totalCurrent, 'A')}\n`;
    resultOutput += `•  Faseforskydningsvinkel (φ): ${phaseAngleDeg.toFixed(3)} °\n`;
    resultOutput += `•  Effektfaktor (cos φ): ${powerFactor.toFixed(3)}\n`;
    resultOutput += `•  Nytteeffekt (P): ${formatValue(realPower, 'W')}\n`;

    document.getElementById('result').textContent = resultOutput;
}