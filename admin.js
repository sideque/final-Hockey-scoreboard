// admin.js - manage timers, scores, storage, export/import
(() => {
    const qs = id => document.getElementById(id);
    const fmt = s => { const m = Math.floor(s / 60), sec = s % 60; return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0'); };
    const mainTimerDisplay = qs('mainTimerDisplay');
    const startBtn = qs('startBtn'), pauseBtn = qs('pauseBtn'), resetBtn = qs('resetBtn');
    const mainLength = qs('mainLength'), quarterSelect = qs('quarterSelect'), breakSelect = qs('breakSelect'), warmupSelect = qs('warmupSelect');
    const openDisplay = qs('openDisplay'), exportBtn = qs('exportBtn'), importFile = qs('importFile'), clearBtn = qs('clearBtn');
    const scoreA = qs('scoreA'), scoreB = qs('scoreB'), incA = qs('incA'), decA = qs('decA'), incB = qs('incB'), decB = qs('decB');
    const refA = qs('refA'), refB = qs('refB'), teamASelect = qs('teamASelect'), teamBSelect = qs('teamBSelect');

    let mainSeconds = parseInt(localStorage.getItem('main_timer_seconds') || mainLength.value, 10);
    let mainInterval = null;

    function loadState() {
        scoreA.textContent = localStorage.getItem('scoreA') || '00';
        scoreB.textContent = localStorage.getItem('scoreB') || '00';
        teamASelect.value = localStorage.getItem('teamA_name') || teamASelect.value;
        teamBSelect.value = localStorage.getItem('teamB_name') || teamBSelect.value;
        quarterSelect.value = localStorage.getItem('quarter') || quarterSelect.value;
        mainSeconds = parseInt(localStorage.getItem('main_timer_seconds') || mainLength.value, 10);
        mainTimerDisplay.textContent = localStorage.getItem('main_timer_display') || fmt(mainSeconds);
        refA.className = localStorage.getItem('refA_status') === 'lost' ? 'px-3 py-2 bg-red-600 rounded' : 'px-3 py-2 bg-green-600 rounded';
        refB.className = localStorage.getItem('refB_status') === 'lost' ? 'px-3 py-2 bg-red-600 rounded' : 'px-3 py-2 bg-green-600 rounded';
    }
    function saveState() { localStorage.setItem('scoreA', scoreA.textContent); localStorage.setItem('scoreB', scoreB.textContent); localStorage.setItem('main_timer_seconds', String(mainSeconds)); localStorage.setItem('main_timer_display', mainTimerDisplay.textContent); localStorage.setItem('quarter', quarterSelect.value); localStorage.setItem('teamA_name', teamASelect.value); localStorage.setItem('teamB_name', teamBSelect.value); }

    // main controls
    startBtn.addEventListener('click', () => {
        if (mainInterval) return;
        const parts = mainTimerDisplay.textContent.split(':'); mainSeconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        mainInterval = setInterval(() => {
            if (mainSeconds > 0) { mainSeconds--; mainTimerDisplay.textContent = fmt(mainSeconds); } else { clearInterval(mainInterval); mainInterval = null; playHooter(); }
            saveState(); localStorage.setItem('main_timer_display', mainTimerDisplay.textContent);
        }, 1000);
    });
    pauseBtn.addEventListener('click', () => { clearInterval(mainInterval); mainInterval = null; saveState(); });
    resetBtn.addEventListener('click', () => { clearInterval(mainInterval); mainInterval = null; mainSeconds = parseInt(mainLength.value, 10); mainTimerDisplay.textContent = fmt(mainSeconds); saveState(); });

    quarterSelect.addEventListener('change', () => { mainSeconds = parseInt(mainLength.value, 10); mainTimerDisplay.textContent = fmt(mainSeconds); saveState(); });

    breakSelect.addEventListener('change', () => { const v = parseInt(breakSelect.value, 10) || 0; if (v > 0) { mainSeconds = v; mainTimerDisplay.textContent = fmt(mainSeconds); saveState(); } });
    warmupSelect.addEventListener('change', () => { const v = parseInt(warmupSelect.value, 10) || 0; if (v > 0) { mainSeconds = v; mainTimerDisplay.textContent = fmt(mainSeconds); saveState(); } });

    incA.addEventListener('click', () => { scoreA.textContent = String(Math.min(99, parseInt(scoreA.textContent || 0, 10) + 1)).padStart(2, '0'); saveState(); });
    decA.addEventListener('click', () => { scoreA.textContent = String(Math.max(0, parseInt(scoreA.textContent || 0, 10) - 1)).padStart(2, '0'); saveState(); });
    incB.addEventListener('click', () => { scoreB.textContent = String(Math.min(99, parseInt(scoreB.textContent || 0, 10) + 1)).padStart(2, '0'); saveState(); });
    decB.addEventListener('click', () => { scoreB.textContent = String(Math.max(0, parseInt(scoreB.textContent || 0, 10) - 1)).padStart(2, '0'); saveState(); });

    refA.addEventListener('click', () => { const lost = localStorage.getItem('refA_status') === 'lost'; localStorage.setItem('refA_status', lost ? 'available' : 'lost'); refA.className = lost ? 'px-3 py-2 bg-green-600 rounded' : 'px-3 py-2 bg-red-600 rounded'; });
    refB.addEventListener('click', () => { const lost = localStorage.getItem('refB_status') === 'lost'; localStorage.setItem('refB_status', lost ? 'available' : 'lost'); refB.className = lost ? 'px-3 py-2 bg-green-600 rounded' : 'px-3 py-2 bg-red-600 rounded'; });

    openDisplay.addEventListener('click', () => { window.open('display.html', 'scoreboard-display', 'width=1200,height=800'); });

    exportBtn.addEventListener('click', () => {
        const data = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); data[k] = localStorage.getItem(k); }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'scoreboard_export.json'; a.click(); URL.revokeObjectURL(url);
    });
    importFile.addEventListener('change', (e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { const obj = JSON.parse(r.result); Object.keys(obj).forEach(k => localStorage.setItem(k, obj[k])); alert('Imported'); loadState(); } catch (err) { alert('Invalid JSON'); } }; r.readAsText(f); });

    clearBtn.addEventListener('click', () => { if (!confirm('Clear saved data?')) return; localStorage.clear(); location.reload(); });

    function playHooter() { try { const ctx = new (window.AudioContext || window.webkitAudioContext)(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.type = 'sine'; o.frequency.value = 880; o.connect(g); g.connect(ctx.destination); o.start(); g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 0.01); setTimeout(() => { g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3); o.stop(ctx.currentTime + 0.35); }, 500); } catch (e) { console.warn('Audio err', e); } }

    // (Goal & penalty timers are implemented in the admin page UI controls above via simple start/stop/reset)
    loadState();
    setInterval(saveState, 1000);
    setInterval(() => { localStorage.setItem('main_timer_display', mainTimerDisplay.textContent); localStorage.setItem('scoreA', scoreA.textContent); localStorage.setItem('scoreB', scoreB.textContent); localStorage.setItem('quarter', quarterSelect.value); localStorage.setItem('teamA_name', teamASelect.value); localStorage.setItem('teamB_name', teamBSelect.value); }, 500);

})();
