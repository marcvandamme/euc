/**
 * @file scripts.js
 * @author  Gemini (via Google) and User
 * @license MIT
 * @description A JavaScript file for calculating series and parallel RLC circuits.
 */

// Funktion til at parse en værdi med enhed (k, M, m, u, n, p, l for XL, c for XC, z for Z)
function parseValue(input) {
    if (input === null || input === undefined || String(input).trim() === '') {
        return { value: 0, isLReactance: false, isCReactance: false, isImpedance: false, isPower: false };
    }
    
    const rawValue = String(input).trim().toLowerCase();
    
    const isLReactance = rawValue.endsWith('l');
    const isCReactance = rawValue.endsWith('c');
    const isPower = rawValue.endsWith('w') || rawValue.endsWith('s') || rawValue.endsWith('q');
    const isImpedance = rawValue.endsWith('z') || (document.getElementById('impedance').value.trim() === input.trim());

    const valueString = rawValue.replace(/[^0-9.]/g, ''); // Fjerner alt undtagen tal og punktum
    const value = parseFloat(valueString);

    if (isNaN(value)) {
        return { value: 0, isLReactance, isCReactance, isImpedance, isPower };
    }

    let parsedValue = value;
    let unit = rawValue.replace(valueString, '').trim();

    switch (unit) {
        case 'k': case 'kω': case 'kohm': // Kilo
            parsedValue *= 1e3;
            break;
        case 'm': case 'mh': // Milli
            parsedValue *= 1e-3;
            break;
        case 'u': case 'μ': case 'uf': case 'μf': // Mikro
            parsedValue *= 1e-6;
            break;
        case 'n': case 'nf': // Nano
            parsedValue *= 1e-9;
            break;
        case 'p': case 'pf': // Pico
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
    } else if (Math.abs(value) < 1e-12) {
        // Viser 0 for meget små tal for bedre læsbarhed
        return `0.000 ${unit}`;
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
        isLReactance: parseValue(document.getElementById('inductance').value).isLReactance,
        isCReactance: parseValue(document.getElementById('capacitance').value).isCReactance,
        isImpedance: parseValue(document.getElementById('impedance').value).isImpedance,
    };
}

// Funktion til at vise resultater og køre MathJax
function displayResults(htmlContent) {
    const resultBox = document.getElementById('result');
    resultBox.innerHTML = htmlContent;
    
    // Kør MathJax efter, at DOM'en er opdateret
    MathJax.typesetPromise().then(() => {
        console.log("MathJax typeset completed.");
    }).catch((err) => console.error("MathJax typesetting failed: ", err));
}

// Hovedfunktion, der opdaterer lommeregneren baseret på kredsløbstype
function updateCalculator() {
    const { voltage, current, frequency, resistance, capacitance, inductance, impedance } = getValues();
    
    // Fejlhåndtering for grundlæggende input
    const knownValuesCount = [voltage, current, resistance, capacitance, inductance, impedance].filter(v => v > 0).length;
    if (frequency <= 0 || knownValuesCount < 2) {
        displayResults(`<p><strong>Fejl:</strong> Indtast venligst frekvens, og mindst to andre værdier.</p>`);
        return;
    }
    
    // Tjek at enten spænding eller strøm er indtastet, men ikke begge (medmindre der også er impedans)
    if ((voltage > 0 && current > 0) && impedance === 0) {
        displayResults(`<p><strong>Fejl:</strong> Indtast venligst enten spænding (U) eller strøm (I), men ikke begge, medmindre du også indtaster impedans (Z).</p>`);
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
    const inputs = ['voltage', 'current', 'frequency', 'resistance', 'capacitance', 'inductance', 'impedance'];
    inputs.forEach(id => {
        document.getElementById(id).value = '';
    });
    displayResults('<p>Dine resultater vil vises her...</p>');
}

// Generel beregning for seriekredsløb
function calculateSeriesRLC() {
    const { voltage, current, resistance, capacitance, inductance, frequency, isLReactance, isCReactance, impedance, isImpedance } = getValues();
    let totalImpedance, calculatedVoltage, calculatedCurrent, xL = 0, xC = 0;
    const givenVoltage = voltage > 0;

    xL = isLReactance ? inductance : (inductance > 0 ? 2 * Math.PI * frequency * inductance : 0);
    xC = isCReactance ? capacitance : (capacitance > 0 ? 1 / (2 * Math.PI * frequency * capacitance) : 0);
    
    if (isImpedance && impedance > 0) {
        totalImpedance = impedance;
    } else {
        totalImpedance = Math.sqrt(Math.pow(resistance, 2) + Math.pow(xL - xC, 2));
    }
    
    if (givenVoltage) {
        calculatedVoltage = voltage;
        calculatedCurrent = totalImpedance > 0 ? voltage / totalImpedance : 0;
    } else {
        calculatedCurrent = current;
        calculatedVoltage = calculatedCurrent * totalImpedance;
    }

    const realPower = calculatedCurrent * calculatedCurrent * resistance;
    const apparentPower = calculatedVoltage * calculatedCurrent;
    const reactivePower = Math.abs(calculatedCurrent * calculatedCurrent * (xL - xC));
    const powerFactor = apparentPower > 0 ? realPower / apparentPower : 0;
    const phaseAngleDeg = (powerFactor !== 0) ? Math.acos(powerFactor) * (180 / Math.PI) : 0;

    const uR = calculatedCurrent * resistance;
    const uL = calculatedCurrent * xL;
    const uC = calculatedCurrent * xC;

    let resultOutput = `
        <div class="result-box">
            <h3>Serie Kredsløb</h3>
            
            <h4>Beregnet reaktans og spændingsfald:</h4>
            <ul class="result-list">
                <li><strong>Kapacitiv reaktans:</strong> $X_C = \\frac{1}{2\\pi f C} = ${formatValue(xC, 'Ohm')}$</li>
                <li><strong>Induktiv reaktans:</strong> $X_L = 2\\pi f L = ${formatValue(xL, 'Ohm')}$</li>
                <li><strong>Spænding over R:</strong> $U_R = I \\cdot R = ${formatValue(uR, 'V')}$</li>
                <li><strong>Spænding over L:</strong> $U_L = I \\cdot X_L = ${formatValue(uL, 'V')}$</li>
                <li><strong>Spænding over C:</strong> $U_C = I \\cdot X_C = ${formatValue(uC, 'V')}$</li>
            </ul>

            <h4>Endelige resultater:</h4>
            <ul class="result-list">
                <li><strong>Total impedans:</strong> $Z = \\sqrt{R^2 + (X_L - X_C)^2} = ${formatValue(totalImpedance, 'Ohm')}$</li>
                <li><strong>Total strøm:</strong> $I = \\frac{U}{Z} = ${formatValue(calculatedCurrent, 'A')}$</li>
                <li><strong>Total spænding:</strong> $U = I \\cdot Z = ${formatValue(calculatedVoltage, 'V')}$</li>
                <li><strong>Faseforskydningsvinkel:</strong> $\\phi = \\arccos(\\frac{R}{Z}) = ${phaseAngleDeg.toFixed(3)} °$</li>
                <li><strong>Effektfaktor:</strong> $\\cos(\\phi) = \\frac{R}{Z} = ${powerFactor.toFixed(3)}$</li>
                <li><strong>Nytteeffekt:</strong> $P = U \\cdot I \\cdot \\cos(\\phi) = ${formatValue(realPower, 'W')}$</li>
                <li><strong>Tilsyneladende effekt:</strong> $S = U \\cdot I = ${formatValue(apparentPower, 'VA')}$</li>
                <li><strong>Reaktiv effekt:</strong> $Q = U \\cdot I \\cdot \\sin(\\phi) = ${formatValue(reactivePower, 'var')}$</li>
            </ul>
        </div>
    `;
    displayResults(resultOutput);
}

// Generel beregning for parallelkredsløb
function calculateParallelRLC() {
    const { voltage, current, resistance, capacitance, inductance, frequency, isLReactance, isCReactance, impedance, isImpedance } = getValues();
    
    let totalImpedance, calculatedVoltage, calculatedCurrent, iR = 0, iL = 0, iC = 0, xL = 0, xC = 0;
    const givenVoltage = voltage > 0;
    
    if (inductance > 0) {
        xL = isLReactance ? inductance : (2 * Math.PI * frequency * inductance);
    }
    if (capacitance > 0) {
        xC = isCReactance ? capacitance : (1 / (2 * Math.PI * frequency * capacitance));
    }
    
    if (givenVoltage) {
        calculatedVoltage = voltage;
        if (resistance > 0) iR = calculatedVoltage / resistance;
        if (xL > 0) iL = calculatedVoltage / xL;
        if (xC > 0) iC = calculatedVoltage / xC;
        calculatedCurrent = Math.sqrt(Math.pow(iR, 2) + Math.pow(iL - iC, 2));
    } else {
        calculatedCurrent = current;
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

    let resultOutput = `
        <div class="result-box">
            <h3>Parallel Kredsløb</h3>
            
            <h4>Beregnet reaktans og delstrømme:</h4>
            <ul class="result-list">
                <li><strong>Kapacitiv reaktans:</strong> $X_C = \\frac{1}{2\\pi f C} = ${formatValue(xC, 'Ohm')}$</li>
                <li><strong>Induktiv reaktans:</strong> $X_L = 2\\pi f L = ${formatValue(xL, 'Ohm')}$</li>
                <li><strong>Strøm gennem R:</strong> $I_R = \\frac{U}{R} = ${formatValue(iR, 'A')}$</li>
                <li><strong>Strøm gennem L:</strong> $I_L = \\frac{U}{X_L} = ${formatValue(iL, 'A')}$</li>
                <li><strong>Strøm gennem C:</strong> $I_C = \\frac{U}{X_C} = ${formatValue(iC, 'A')}$</li>
            </ul>

            <h4>Endelige resultater:</h4>
            <ul class="result-list">
                <li><strong>Total impedans:</strong> $Z = \\frac{1}{\\sqrt{(\\frac{1}{R})^2 + (\\frac{1}{X_C} - \\frac{1}{X_L})^2}} = ${formatValue(totalImpedance, 'Ohm')}$</li>
                <li><strong>Total strøm:</strong> $I = \\sqrt{I_R^2 + (I_C - I_L)^2} = ${formatValue(calculatedCurrent, 'A')}$</li>
                <li><strong>Total spænding:</strong> $U = I \\cdot Z = ${formatValue(calculatedVoltage, 'V')}$</li>
                <li><strong>Faseforskydningsvinkel:</strong> $\\phi = \\arctan(\\frac{I_C - I_L}{I_R}) = ${phaseAngleDeg.toFixed(3)} °$</li>
                <li><strong>Effektfaktor:</strong> $\\cos(\\phi) = \\frac{I_R}{I} = ${powerFactor.toFixed(3)}$</li>
                <li><strong>Nytteeffekt:</strong> $P = U \\cdot I_R = ${formatValue(realPower, 'W')}$</li>
                <li><strong>Tilsyneladende effekt:</strong> $S = U \\cdot I = ${formatValue(apparentPower, 'VA')}$</li>
                <li><strong>Reaktiv effekt:</strong> $Q = U \\cdot (I_C - I_L) = ${formatValue(reactivePower, 'var')}$</li>
            </ul>
        </div>
    `;
    displayResults(resultOutput);
}

// Vent, indtil DOM'en er fuldt indlæst, før du tilføjer event listeners
document.addEventListener('DOMContentLoaded', () => {
    const calculateButton = document.getElementById('calculate-button');
    const resetButton = document.getElementById('reset-button');
    const feedbackButton = document.getElementById('feedback-button');
    
    if (calculateButton) {
        calculateButton.addEventListener('click', updateCalculator);
    }
    
    if (resetButton) {
        resetButton.addEventListener('click', resetCalculator);
    }

    if (feedbackButton) {
        feedbackButton.addEventListener('click', () => {
            const confirmed = confirm("Er du sikker på, at du vil sende feedback via e-mail? Din e-mailklient vil blive åbnet.");

            if (confirmed) {
                const user = 'din_bruger'; 
                const domain = 'din_domæne'; 
                const emailAddress = `${user}@${domain}`;
                window.location.href = `mailto:${emailAddress}?subject=Feedback på RLC Lommeregner`;
            }
        });
    }
});
