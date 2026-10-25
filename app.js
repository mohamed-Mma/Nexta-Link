// ==============================================
// ضع مفتاح ImgBB هنا (مجاني من imgbb.com)
// ==============================================
const IMGBB_API_KEY = "753d9cfad92e1cf2e87bcd0ba74dc0bf";

let currentLang = localStorage.getItem("lang") || "ar";
let selectedFiles = [];

const translations = {
  ar: {
    title: "رفع الصور",
    subtitle: "ارفع صورك واحصل على روابط مباشرة",
    drop: "اسحب الصور هنا أو اضغط للاختيار",
    select: "اختيار صور",
    upload: "رفع الصور",
    uploading: "جاري الرفع...",
    success: "تم الرفع بنجاح",
    copy: "نسخ",
    copyAll: "نسخ جميع الروابط",
    downloadTxt: "تحميل ملف TXT",
    newUpload: "رفع صور جديدة",
    noImages: "لم يتم اختيار أي صور",
    invalidType: "يُسمح فقط بـ JPEG و PNG و WebP",
    tooMany: "الحد الأقصى 15 صورة في المرة",
    tooLarge: "حجم الملف أكبر من 10 ميجابايت",
    error: "فشل الرفع",
    urlsTitle: "الروابط المباشرة",
    keyMissing: "ضع مفتاح ImgBB في ملف app.js أولاً"
  },
  en: {
    title: "Upload Images",
    subtitle: "Upload images and get direct URLs",
    drop: "Drag images here or click to select",
    select: "Select Images",
    upload: "Upload Images",
    uploading: "Uploading...",
    success: "Upload Successful",
    copy: "Copy",
    copyAll: "Copy All URLs",
    downloadTxt: "Download TXT",
    newUpload: "Upload More",
    noImages: "No images selected",
    invalidType: "Only JPEG, PNG and WebP allowed",
    tooMany: "Maximum 15 images at once",
    tooLarge: "File larger than 10MB",
    error: "Upload failed",
    urlsTitle: "Direct Image URLs",
    keyMissing: "Please put your ImgBB API key in app.js"
  }
};

function t(key) {
  return translations[currentLang][key] || key;
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

function render() {
  if (window.location.hash === "#results") renderResults();
  else renderUpload();
}

function renderUpload() {
  document.getElementById("app").innerHTML = `
    <div class="text-center mb-8">
      <h1 class="text-3xl md:text-4xl font-bold mb-3">${t("title")}</h1>
      <p class="text-gray-400">${t("subtitle")}</p>
    </div>
    <div class="card p-6 md:p-8">
      <div id="dropzone" class="dropzone p-10 text-center cursor-pointer mb-6">
        <p class="text-gray-400 mb-3">${t("drop")}</p>
        <button type="button" class="btn-primary px-6 py-2.5">${t("select")}</button>
        <input id="fileInput" type="file" multiple accept="image/jpeg,image/png,image/webp" class="hidden">
      </div>
      <div id="previews" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6"></div>
      <button id="uploadBtn" class="btn-primary w-full py-4 text-lg" disabled>${t("upload")}</button>
      <div id="progressWrap" class="hidden mt-4">
        <div class="progress-bar"><div id="progressBar"></div></div>
        <p id="progressText" class="text-center text-sm text-gray-400 mt-2"></p>
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
    c.innerHTML = `<p class="col-span-full text-center text-gray-500 py-4">${t("noImages")}</p>`;
    return;
  }
  c.innerHTML = selectedFiles.map(item => `
    <div class="relative group">
      <img src="${item.preview}" class="w-full aspect-square object-cover rounded-xl border border-gray-800">
      <button onclick="removeFile('${item.id}')" class="absolute top-1 right-1 bg-black/70 text-white w-6 h-6 rounded-full text-xs opacity-0 group-hover:opacity-100">✕</button>
      <p class="text-xs text-gray-500 mt-1 truncate">${item.file.name}</p>
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
  if (!IMGBB_API_KEY || IMGBB_API_KEY === "ضع_مفتاحك_هنا") {
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
      form.append("name", item.file.name);

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
    <div class="text-center mb-6">
      <h1 class="text-3xl font-bold text-neon mb-2">${t("success")}</h1>
      <p class="text-gray-400">${data.images.length} ${currentLang === "ar" ? "صورة" : "images"}</p>
    </div>
    <div class="card p-6">
      <h2 class="font-semibold mb-4">${t("urlsTitle")}</h2>
      <div class="space-y-4">
        ${data.images.map(img => `
          <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-black/40 p-3 rounded-xl">
            <img src="${img.url}" class="w-16 h-16 object-cover rounded-lg border border-gray-800">
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-300 truncate">${img.originalName}</p>
              <p class="text-xs text-gray-500 break-all">${img.url}</p>
            </div>
            <button onclick="copyText('${img.url}')" class="text-neon text-sm border border-neon/40 px-4 py-1.5 rounded-lg whitespace-nowrap">${t("copy")}</button>
          </div>
        `).join("")}
      </div>
      <div class="flex flex-wrap gap-3 mt-6">
        <button onclick="copyAll()" class="btn-primary px-5 py-2.5">${t("copyAll")}</button>
        <button onclick="downloadTxt()" class="border border-neon text-neon px-5 py-2.5 rounded-xl">${t("downloadTxt")}</button>
        <button onclick="location.hash='#upload'" class="border border-gray-600 px-5 py-2.5 rounded-xl">${t("newUpload")}</button>
      </div>
    </div>
  `;
}

window.copyText = (text) => navigator.clipboard.writeText(text).then(() => alert(currentLang === "ar" ? "تم النسخ" : "Copied"));
window.copyAll = () => {
  const data = JSON.parse(sessionStorage.getItem("uploadResults"));
  navigator.clipboard.writeText(data.images.map(i => i.url).join("\n"))
    .then(() => alert(currentLang === "ar" ? "تم نسخ الكل" : "All copied"));
};
window.downloadTxt = () => {
  const data = JSON.parse(sessionStorage.getItem("uploadResults"));
  const blob = new Blob([data.images.map(i => i.url).join("\n")], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "nexta-urls.txt";
  a.click();
};

window.addEventListener("hashchange", render);
setLang(currentLang);
render();
