// script.js
const LS_KEY = "habit-tracker-v2";
const DAY_NAMES = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const COLOR_PALETTE = ["#0b69ff","#16a34a","#f97316","#7c3aed","#fb7185","#06b6d4"];

document.addEventListener("DOMContentLoaded", () => {
  const listEl = document.getElementById("habit-list");
  const emptyMsg = document.getElementById("empty-msg");
  const weekHeader = document.getElementById("week-header");
  const statsBox = document.getElementById("weekly-stats");
  const btnResetWeek = document.getElementById("btn-reset-week");
  const btnClearAll = document.getElementById("btn-clear-all");

  let state = { habits: [] };

  // storage
  const save = () => localStorage.setItem(LS_KEY, JSON.stringify(state));
  const load = () => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) state = JSON.parse(raw);
    } catch (e) {
      console.error("Gagal memuat state:", e);
      state = { habits: [] };
    }
  };

  // week helpers
  function getWeekDates(ref = new Date()) {
    const d = new Date(ref);
    const day = (d.getDay() + 6) % 7; // Mon=0..Sun=6
    const monday = new Date(d);
    monday.setDate(d.getDate() - day);
    monday.setHours(0,0,0,0);
    const arr = [];
    for (let i=0;i<7;i++){
      const dt = new Date(monday);
      dt.setDate(monday.getDate() + i);
      arr.push(dt);
    }
    return arr;
  }
  function toISODate(dt){ const y=dt.getFullYear(); const m=`${dt.getMonth()+1}`.padStart(2,"0"); const d=`${dt.getDate()}`.padStart(2,"0"); return `${y}-${m}-${d}`; }
  function weekDatesISO(){ return getWeekDates().map(toISODate); }

  // render week header
  function renderWeekHeader(){
    const dates = getWeekDates();
    weekHeader.innerHTML = dates.map((d, idx)=>{
      const dayLabel = `${DAY_NAMES[idx]} ${d.getDate()}/${d.getMonth()+1}`;
      return `<div class="small">${dayLabel}</div>`;
    }).join("");
  }

  // render list
  function renderHabits(){
    listEl.innerHTML = "";
    if (!state.habits.length){
      emptyMsg.hidden = false;
      return;
    }
    emptyMsg.hidden = true;
    const dates = getWeekDates();
    const todayISO = toISODate(new Date());

    state.habits.forEach(h=>{
      const checks = h.checks || {};
      const totalChecked = dates.reduce((acc,d)=> acc + (checks[toISODate(d)] ? 1 : 0), 0);
      const progressPercent = Math.round((totalChecked / 7) * 100);

      const el = document.createElement("article");
      el.className = "habit";
      el.dataset.id = h.id;
      el.innerHTML = `
        <div class="habit-top">
          <div class="habit-left">
            <div class="color-dot" style="background:${h.color}"></div>
            <div>
              <div class="habit-name">${escapeHtml(h.name)}</div>
              <div><span class="habit-cat">${escapeHtml(h.category)}</span></div>
            </div>
          </div>
          <div class="habit-controls">
            <a class="icon-btn small" href="edit.html?mode=edit&id=${h.id}">Edit</a>
            <button class="icon-btn danger small btn-delete" data-id="${h.id}">Hapus</button>
          </div>
        </div>

        <div class="progress-wrap" aria-hidden="false">
          <div class="progress" aria-hidden="true">
            <div class="progress-bar" style="width:${progressPercent}%; background:${h.color};"></div>
          </div>
          <div class="progress-text">${totalChecked}/7 (${progressPercent}%)</div>
        </div>

        <div class="days-row">
          ${dates.map((d, idx)=>{
            const iso = toISODate(d);
            const isChecked = !!(h.checks && h.checks[iso]);
            const classes = `day ${isChecked ? "checked" : ""} ${iso === todayISO ? "today": ""}`;
            return `<div tabindex="0" role="button" aria-pressed="${isChecked}" class="${classes}" data-day="${iso}" data-id="${h.id}" title="${DAY_NAMES[idx]} ${iso}">${DAY_NAMES[idx].slice(0,2)}</div>`;
          }).join("")}
        </div>

        <div class="small muted">${h.description ? escapeHtml(h.description) : ""}</div>
      `;
      listEl.appendChild(el);
    });

    // attach events
    document.querySelectorAll(".day").forEach(node=>{
      node.addEventListener("click", () => {
        toggleDay(node.dataset.id, node.dataset.day);
      });
      node.addEventListener("keydown", (ev)=>{
        if(ev.key === "Enter" || ev.key === " "){
          ev.preventDefault();
          toggleDay(node.dataset.id, node.dataset.day);
        }
      });
    });

    document.querySelectorAll(".btn-delete").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const id = btn.dataset.id;
        if(confirm("Hapus kebiasaan ini?")){
          state.habits = state.habits.filter(h=>h.id !== id);
          save();
          renderHabits();
          renderStats();
        }
      });
    });
  }

  function renderStats(){
    const dates = weekDatesISO();
    const allHabits = state.habits.length;
    const totalPossible = allHabits * 7;
    let totalChecks = 0;
    const perHabit = state.habits.map(h=>{
      const checked = dates.reduce((a,d)=> a + (h.checks && h.checks[d] ? 1 : 0), 0);
      totalChecks += checked;
      return {name: h.name, checked};
    });
    const overallPercent = totalPossible === 0 ? 0 : Math.round((totalChecks/totalPossible)*100);
    statsBox.innerHTML = `
      <div class="stats-row"><div><strong>Total Kebiasaan</strong></div><div class="small">${allHabits}</div></div>
      <div class="stats-row"><div><strong>Total Centang Minggu Ini</strong></div><div class="small">${totalChecks} / ${totalPossible} (${overallPercent}%)</div></div>
      <div style="padding-top:8px;">
        <div class="small" style="margin-bottom:6px"><strong>Detail per kebiasaan</strong></div>
        ${perHabit.map(h=>`<div class="small" style="display:flex;justify-content:space-between"><span>${escapeHtml(h.name)}</span><span>${h.checked}/7</span></div>`).join("")}
      </div>
    `;
  }

  // toggle day
  function toggleDay(habitId, isoDate){
    const h = state.habits.find(x=>x.id === habitId);
    if(!h) return;
    h.checks = h.checks || {};
    if(h.checks[isoDate]) delete h.checks[isoDate];
    else h.checks[isoDate] = true;
    save();
    renderHabits();
    renderStats();
  }

  // reset week
  btnResetWeek.addEventListener("click", ()=>{
    if(!confirm("Reset semua centang untuk minggu ini?")) return;
    const dates = weekDatesISO();
    state.habits.forEach(h=>{
      if(!h.checks) return;
      dates.forEach(d=>{ if(h.checks[d]) delete h.checks[d]; });
    });
    save();
    renderHabits();
    renderStats();
  });

  // clear all
  btnClearAll.addEventListener("click", ()=>{
    if(!confirm("Hapus seluruh kebiasaan dan data? Tindakan ini tidak dapat dibatalkan.")) return;
    state.habits = [];
    save();
    renderHabits();
    renderStats();
  });

  // helpers
  function escapeHtml(str){
    return String(str || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  // init
  load();
  renderWeekHeader();
  renderHabits();
  renderStats();

  // storage watcher
  window.addEventListener("storage", (e)=>{
    if(e.key === LS_KEY){
      load();
      renderHabits();
      renderStats();
    }
  });
});
