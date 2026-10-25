// ==============================================
// ضع مفتاح ImgBB هنا
// ==============================================
const IMGBB_API_KEY = "753d9cfad92e1cf2e87bcd0ba74dc0bf";

let currentLang = localStorage.getItem("lang") || "ar";
let currentTheme = localStorage.getItem("theme") || "dark";
let selectedFiles = [];

const translations = {
  ar: {
    title: "رفع الصور",
    subtitle: "ارفع صورك بسهولة واحصل على روابط مباشرة جاهزة للاستخدام",
    drop: "اسحب الصور هنا أو اضغط للاختيار",
    select: "اختيار صور",
    upload: "رفع الصور",
    uploading: "جاري الرفع...",
    success: "تم الرفع بنجاح",
    copy: "نسخ",
    copyAll: "نسخ جميع الروابط",
    downloadTxt: "تحميل ملف TXT",
    newUpload: "رفع صور جديدة",
    noImages: "لم يتم اختيار أي صور بعد",
    invalidType: "يُسمح فقط بصور JPEG و PNG و WebP",
    tooMany: "الحد الأقصى 15 صورة في المرة الواحدة",
    tooLarge: "حجم الملف أكبر من 10 ميجابايت",
    error: "حدث خطأ أثناء الرفع",
    urlsTitle: "الروابط المباشرة",
    keyMissing: "من فضلك ضع مفتاح ImgBB في ملف app.js"
  },
  en: {
    title: "Upload Images",
    subtitle: "Upload your images easily and get direct, ready-to-use URLs",
    drop: "Drag images here or click to select",
    select: "Select Images",
    upload: "Upload Images",
    uploading: "Uploading...",
    success: "Upload Successful",
    copy: "Copy",
    copyAll: "Copy All URLs",
    downloadTxt: "Download TXT",
    newUpload: "Upload More Images",
    noImages: "No images selected yet",
    invalidType: "Only JPEG, PNG and WebP are allowed",
    tooMany: "Maximum 15 images at once",
    tooLarge: "File is larger than 10MB",
    error: "An error occurred during upload",
    urlsTitle: "Direct Image URLs",
    keyMissing: "Please add your ImgBB API key in app.js"
  }
};

function t(key) {
  return translations[currentLang][key] || key;
}

function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  document.getElementById("themeIcon").textContent = theme === "dark" ? "🌙" : "☀️";
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem("lang", lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.getElementById("langToggle").textContent = lang === "ar" ? "English" : "العربية";
  render();
}

document.getElementById("langToggle").onclick = () => setLang(currentLang === "ar" ? "en" : "ar");
document.getElementById("themeToggle").onclick = () => applyTheme(currentTheme === "dark" ? "light" : "dark");

function render() {
  if (window.location.hash === "#results") renderResults();
  else renderUpload();
}

function renderUpload() {
  document.getElementById("app").innerHTML = `
    <div class="text-center mb-10 fade-in">
      <h1 class="text-4xl md:text-5xl font-extrabold mb-4">${t("title")}</h1>
      <p class="text-muted text-lg max-w-xl mx-auto">${t("subtitle")}</p>
    </div>

    <div class="card p-6 md:p-8 fade-in">
      <div id="dropzone" class="dropzone p-12 text-center cursor-pointer mb-6">
        <div class="text-5xl mb-3">📤</div>
        <p class="text-muted mb-4 text-lg">${t("drop")}</p>
        <button type="button" class="btn-primary px-8 py-3 text-base">${t("select")}</button>
        <input id="fileInput" type="file" multiple accept="image/jpeg,image/png,image/webp" class="hidden">
      </div>

      <div id="previews" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6"></div>

      <button id="uploadBtn" class="btn-primary w-full py-4 text-lg font-bold" disabled>${t("upload")}</button>

      <div id="progressWrap" class="hidden mt-5">
        <div class="progress-bar"><div id="progressBar"></div></div>
        <p id="progressText" class="text-center text-sm text-muted mt-2"></p>
      </div>

      <div id="status" class="mt-4 text-center text-sm"></div>
    </div>
  `;
  setupHandlers();
  renderPreviews();
}

function setupHandlers() {
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("fileInput");
  const uploadBtn = document.getElementById("uploadBtn");

  dropzone.onclick = () => fileInput.click();
  dropzone.ondragover = (e) => { e.preventDefault(); dropzone.classList.add("dragover"); };
  dropzone.ondragleave = () => dropzone.classList.remove("dragover");
  dropzone.ondrop = (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    addFiles(e.dataTransfer.files);
  };
  fileInput.onchange = () => { addFiles(fileInput.files); fileInput.value = ""; };
  uploadBtn.onclick = startUpload;
}

function addFiles(fileList) {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  for (const file of Array.from(fileList)) {
    if (selectedFiles.length >= 15) { alert(t("tooMany")); break; }
    if (!allowed.includes(file.type)) { alert(t("invalidType")); continue; }
    if (file.size > 10 * 1024 * 1024) { alert(t("tooLarge")); continue; }
    selectedFiles.push({ id: Date.now() + Math.random(), file, preview: URL.createObjectURL(file) });
  }
  renderPreviews();
  updateButton();
}

function renderPreviews() {
  const c = document.getElementById("previews");
  if (!c) return;
  if (!selectedFiles.length) {
    c.innerHTML = `<p class="col-span-full text-center text-muted py-6">${t("noImages")}</p>`;
    return;
  }
  c.innerHTML = selectedFiles.map(item => `
    <div class="relative group fade-in">
      <img src="${item.preview}" class="w-full aspect-square object-cover rounded-2xl border border-border">
      <button onclick="removeFile('${item.id}')" class="absolute top-2 right-2 bg-black/70 text-white w-7 h-7 rounded-full text-sm opacity-0 group-hover:opacity-100 transition">✕</button>
      <p class="text-xs text-muted mt-2 truncate px-1">${item.file.name}</p>
    </div>
  `).join("");
}

window.removeFile = (id) => {
  selectedFiles = selectedFiles.filter(f => f.id != id);
  renderPreviews();
  updateButton();
};

function updateButton() {
  const btn = document.getElementById("uploadBtn");
  if (btn) btn.disabled = selectedFiles.length === 0;
}

async function startUpload() {
  if (!IMGBB_API_KEY || IMGBB_API_KEY.includes("ضع_مفتاحك")) {
    alert(t("keyMissing"));
    return;
  }
  if (!selectedFiles.length) return;

  const btn = document.getElementById("uploadBtn");
  const wrap = document.getElementById("progressWrap");
  const bar = document.getElementById("progressBar");
  const text = document.getElementById("progressText");
  const status = document.getElementById("status");

  btn.disabled = true;
  wrap.classList.remove("hidden");
  status.textContent = "";
  text.textContent = t("uploading");

  const results = [];
  let done = 0;

  try {
    for (const item of selectedFiles) {
      const form = new FormData();
      form.append("image", item.file);
      form.append("name", item.file.name.replace(/\.[^/.]+$/, ""));

      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: "POST",
        body: form
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Upload failed");

      results.push({
        originalName: item.file.name,
        url: json.data.url || json.data.display_url
      });

      done++;
      bar.style.width = Math.round((done / selectedFiles.length) * 100) + "%";
    }

    sessionStorage.setItem("uploadResults", JSON.stringify({ images: results }));
    selectedFiles = [];
    location.hash = "#results";
  } catch (err) {
    wrap.classList.add("hidden");
    status.textContent = t("error") + ": " + err.message;
    btn.disabled = false;
  }
}

function renderResults() {
  const raw = sessionStorage.getItem("uploadResults");
  if (!raw) { location.hash = "#upload"; return; }
  const data = JSON.parse(raw);

  document.getElementById("app").innerHTML = `
    <div class="text-center mb-8 fade-in">
      <h1 class="text-4xl font-extrabold text-neon mb-2">${t("success")}</h1>
      <p class="text-muted">${data.images.length} ${currentLang === "ar" ? "صورة" : "images"}</p>
    </div>

    <div class="card p-6 md:p-8 fade-in">
      <h2 class="font-bold text-xl mb-5">${t("urlsTitle")}</h2>
      <div class="space-y-4">
        ${data.images.map(img => `
          <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-bg/50 p-4 rounded-2xl border border-border">
            <img src="${img.url}" class="w-20 h-20 object-cover rounded-xl border border-border flex-shrink-0">
            <div class="flex-1 min-w-0">
              <p class="font-medium truncate">${img.originalName}</p>
              <p class="text-xs text-muted break-all mt-1">${img.url}</p>
            </div>
            <button onclick="copyText('${img.url}')" class="text-neon text-sm border border-neon/50 px-5 py-2 rounded-xl whitespace-nowrap hover:bg-neon/10 transition">
              ${t("copy")}
            </button>
          </div>
        `).join("")}
      </div>

      <div class="flex flex-wrap gap-3 mt-8">
        <button onclick="copyAll()" class="btn-primary px-6 py-3">${t("copyAll")}</button>
        <button onclick="downloadTxt()" class="border-2 border-neon text-neon px-6 py-3 rounded-xl font-semibold hover:bg-neon/10 transition">${t("downloadTxt")}</button>
        <button onclick="location.hash='#upload'" class="border border-border px-6 py-3 rounded-xl font-medium hover:bg-bg transition">${t("newUpload")}</button>
      </div>
    </div>
  `;
}

window.copyText = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    alert(currentLang === "ar" ? "تم النسخ بنجاح" : "Copied successfully");
  });
};

window.copyAll = () => {
  const data = JSON.parse(sessionStorage.getItem("uploadResults"));
  const urls = data.images.map(i => i.url).join("\n");
  navigator.clipboard.writeText(urls).then(() => {
    alert(currentLang === "ar" ? "تم نسخ جميع الروابط" : "All URLs copied");
  });
};

window.downloadTxt = () => {
  const data = JSON.parse(sessionStorage.getItem("uploadResults"));
  const content = data.images.map(i => i.url).join("\n");
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "nexta-link-urls.txt";
  a.click();
};

// Initialize
applyTheme(currentTheme);
setLang(currentLang);
window.addEventListener("hashchange", render);
render();
