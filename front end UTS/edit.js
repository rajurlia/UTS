// edit.js
const LS_KEY = "habit-tracker-v2";
const COLOR_PALETTE = ["#0b69ff","#16a34a","#f97316","#7c3aed","#fb7185","#06b6d4"];

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode") || "add";
  const editId = params.get("id") || null;

  const pageTitle = document.getElementById("page-title");
  const form = document.getElementById("habit-form");
  const nameInput = document.getElementById("name");
  const descInput = document.getElementById("description");
  const goalInput = document.getElementById("goal");
  const categorySelect = document.getElementById("category");
  const colorInput = document.getElementById("color");
  const presetColorsEl = document.getElementById("preset-colors");
  const deleteBtn = document.getElementById("delete-btn");

  let state = { habits: [] };

  const saveState = () => localStorage.setItem(LS_KEY, JSON.stringify(state));
  const loadState = () => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if(raw) state = JSON.parse(raw);
    } catch (e) {
      state = { habits: [] };
    }
  };

  function randColor(){ return COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)]; }

  // populate preset colors
  COLOR_PALETTE.forEach(c=>{
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "preset-color";
    btn.style.background = c;
    btn.title = c;
    btn.addEventListener("click", () => {
      colorInput.value = rgbToHex(c);
      document.querySelectorAll(".preset-color").forEach(x=>x.classList.remove("active"));
      btn.classList.add("active");
    });
    presetColorsEl.appendChild(btn);
  });

  // helper convert color already hex -> keep as is
  function rgbToHex(hex){ // input is hex already (like #0b69ff)
    return hex;
  }

  // load existing habit if edit mode
  loadState();
  if(mode === "edit" && editId){
    const h = state.habits.find(x => x.id === editId);
    if(h){
      pageTitle.textContent = "Edit Kebiasaan";
      nameInput.value = h.name || "";
      descInput.value = h.description || "";
      goalInput.value = h.goal || "";
      categorySelect.value = h.category || "Lainnya";
      colorInput.value = h.color || randColor();
      // highlight preset color if matches
      document.querySelectorAll(".preset-color").forEach(btn=>{
        btn.classList.toggle("active", btn.style.backgroundColor.toLowerCase() === colorInput.value.toLowerCase());
      });
      deleteBtn.hidden = false;
      deleteBtn.addEventListener("click", ()=>{
        if(confirm("Hapus kebiasaan ini?")){
          state.habits = state.habits.filter(x=>x.id !== h.id);
          saveState();
          window.location.href = "index.html";
        }
      });
    } else {
      // invalid id — fallback to add
      pageTitle.textContent = "Tambah Kebiasaan";
      colorInput.value = randColor();
    }
  } else {
    // add mode
    pageTitle.textContent = "Tambah Kebiasaan";
    colorInput.value = randColor();
  }

  // form submit
  form.addEventListener("submit", (ev)=>{
    ev.preventDefault();
    const name = nameInput.value.trim();
    if(!name) { alert("Nama kebiasaan wajib diisi."); nameInput.focus(); return; }
    const description = descInput.value.trim();
    const goalRaw = parseInt(goalInput.value, 10);
    const goal = isNaN(goalRaw) ? null : Math.max(1, Math.min(7, goalRaw));
    const category = categorySelect.value || "Lainnya";
    const color = colorInput.value || randColor();

    loadState();
    if(mode === "edit" && editId){
      const idx = state.habits.findIndex(x=>x.id === editId);
      if(idx >= 0){
        state.habits[idx].name = name;
        state.habits[idx].description = description;
        state.habits[idx].goal = goal;
        state.habits[idx].category = category;
        state.habits[idx].color = color;
        saveState();
        window.location.href = "index.html";
        return;
      }
    }

    // create new
    const newHabit = {
      id: `h-${Date.now()}-${Math.floor(Math.random()*9999)}`,
      name,
      description,
      goal,
      category,
      color,
      createdAt: new Date().toISOString(),
      checks: {}
    };
    state.habits.push(newHabit);
    saveState();
    window.location.href = "index.html";
  });

  // highlight preset color if user changes color input manually
  colorInput.addEventListener("input", ()=>{
    document.querySelectorAll(".preset-color").forEach(x=>{
      x.classList.toggle("active", x.style.backgroundColor.toLowerCase() === colorInput.value.toLowerCase());
    });
  });

});
