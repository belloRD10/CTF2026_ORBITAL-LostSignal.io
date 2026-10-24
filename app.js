"use strict";

const encoded = [70, 34, 43, 119, 0, 71, 80, 41, 47, 119, 0, 119, 113, 29, 50, 118, 66, 89, 122, 56, 37, 34, 16, 86, 22, 41, 120, 124, 21, 107, 87, 104, 63, 33, 70, 88, 86, 4, 61, 122, 65, 107, 70, 107, 39, 97, 66, 88, 22, 38];
const xorKey = [37, 91, 73, 18, 114, 52];

function recoverSignal() {
    return encoded.map((n, i) =>
        String.fromCharCode(n ^ xorKey[i % xorKey.length])
    ).join("");
}

function openDiagnostic() {
    console.clear();
    console.log("%c[ORBITAL] DIAGNOSTIC CONSOLE ACTIVE",
        "color:#5de7ff;font-weight:bold;font-size:14px");
    console.log("%cRecovered signal:", "color:#7dffb2");
    console.log(recoverSignal());
    document.body.classList.add("is-decoded");
    setCrtState("DECRYPTED");
}

function connectMission(id) {
    const output = document.getElementById("output");

    if (!id) {
        output.textContent = "Mission identifier required.";
        return;
    }

    if (id.length > 200) {
        output.textContent = "Mission identifier rejected.";
        return;
    }

    output.innerHTML = "Signal received: " + id;

    if (window.debug && window.debug.value === "true") {
        openDiagnostic();
    } else {
        console.log("[ORBITAL] Diagnostic mode remains locked.");
    }
}

document.getElementById("missionForm").addEventListener("submit", function(e) {
    e.preventDefault();
    connectMission(document.getElementById("mission").value);
});

console.log("[ORBITAL] Interface initialized.");
console.log("[ORBITAL] Hint: investigate named DOM properties.");

const missionField = document.getElementById("mission");
const meterFill = document.getElementById("fill");
const crtState = document.getElementById("crtState");
const carrierCell = document.getElementById("carrier");
const gainCell = document.getElementById("gain");
const driftCell = document.getElementById("drift");
const trace = document.getElementById("trace");
const ctx = trace.getContext("2d");

let phase = 0;
let energy = 0;
let burst = 0;
let idleTicks = 0;

function setCrtState(label) {
    crtState.textContent = label;
}

function fitTrace() {
    const ratio = window.devicePixelRatio || 1;
    const box = trace.getBoundingClientRect();
    trace.width = Math.max(1, Math.floor(box.width * ratio));
    trace.height = Math.max(1, Math.floor(box.height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function drawTrace() {
    const box = trace.getBoundingClientRect();
    const w = box.width;
    const h = box.height;

    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = "rgba(110,255,192,0.78)";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "rgba(110,255,192,0.55)";
    ctx.beginPath();

    for (let x = 0; x <= w; x += 2) {
        const t = x / w;
        const carrier = Math.sin(t * 30 + phase) * 7;
        const noise = (Math.sin(t * 89 + phase * 1.7) + Math.sin(t * 151 - phase * 0.6)) * 2.6;
        const spike = burst * Math.sin(t * 18 + phase * 2) * 14;
        const drift = Math.sin(phase * 0.6) * 4;
        const y = h / 2 + carrier * (0.2 + energy) + noise + drift + spike;
        if (x === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }

    ctx.stroke();
    ctx.shadowBlur = 0;

    burst *= 0.93;
    energy *= 0.96;
    phase += 0.055;
    requestAnimationFrame(drawTrace);
}

function paintReadout() {
    const value = missionField.value;
    const len = value.length;
    const ratio = Math.min(len / 200, 1);
    const drift = (Math.sin(phase * 0.4) * 3.4 - ratio * 6.2).toFixed(1);

    meterFill.style.width = (ratio * 100).toFixed(1) + "%";
    gainCell.textContent = (0.4 + ratio * 7.6).toFixed(2);
    driftCell.textContent = (drift >= 0 ? "+" : "") + drift + " kHz";
    carrierCell.textContent = len ? "LOCKED @" + len : "NO CARRIER";

    idleTicks += 1;
    if (idleTicks % 24 === 0) {
        phase += 0.4;
    }
}

missionField.addEventListener("input", function() {
    energy = 0.85;
    burst = 0.6;
    setCrtState("RECEIVING");
});

document.getElementById("missionForm").addEventListener("submit", function() {
    burst = 1.4;
    energy = 1.6;
    setCrtState("SIGNAL LOG");
});

window.addEventListener("resize", fitTrace);

fitTrace();
paintReadout();
requestAnimationFrame(drawTrace);
setInterval(paintReadout, 60);
