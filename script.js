// Initialize the app
document.addEventListener("DOMContentLoaded", function () {
  initializeHizbSelect();
  initializeDefaultNames();
  loadDrawHistory();
  currentPage = 1;
  setupModalListeners();
});

// Modal state
let modalCallback = null;

// Setup Modal Listeners
function setupModalListeners() {
  const cancelBtn = document.getElementById("confirmCancel");
  const okBtn = document.getElementById("confirmOk");

  cancelBtn.addEventListener("click", closeModal);
  okBtn.addEventListener("click", confirmModal);
}

// Show Modal
function showConfirmModal(title, message, callback) {
  const modal = document.getElementById("confirmModal");
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalMessage").textContent = message;
  modalCallback = callback;
  modal.style.display = "flex";
}

// Close Modal
function closeModal() {
  const modal = document.getElementById("confirmModal");
  modal.style.display = "none";
  modalCallback = null;
}

// Confirm Modal
function confirmModal() {
  if (modalCallback) {
    modalCallback();
  }
  closeModal();
}

// Pagination state
let currentPage = 1;
const ITEMS_PER_PAGE = 5;

// Initialize Hizb (Part) Select - 60 Ahzab
function initializeHizbSelect() {
  const hizbSelect = document.getElementById("hizb");
  for (let i = 1; i <= 60; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `الحزب ${i}`;
    hizbSelect.appendChild(option);
  }
}

// Save Names
function saveNames() {
  const names = [];
  let valid = true;

  for (let i = 1; i <= 4; i++) {
    const name = document.getElementById(`name${i}`).value.trim();
    if (!name) {
      showToast("يجب ملء جميع الأسماء", "error");
      valid = false;
      break;
    }
    names.push(name);
  }

  if (valid) {
    localStorage.setItem("quranNames", JSON.stringify(names));
    showToast("تم حفظ الأسماء بنجاح");
    moveToSelectSection();
  }
}

// Auto-save Names when input changes
document.addEventListener("DOMContentLoaded", function () {
  for (let i = 1; i <= 4; i++) {
    const input = document.getElementById(`name${i}`);
    if (input) {
      input.addEventListener("change", function () {
        const names = [];
        for (let j = 1; j <= 4; j++) {
          names.push(document.getElementById(`name${j}`).value.trim());
        }
        if (names.every((name) => name !== "")) {
          localStorage.setItem("quranNames", JSON.stringify(names));
        }
      });
    }
  }
});

// Initialize Default Names
function initializeDefaultNames() {
  const defaultNames = [
    "عمر بنعربية",
    "محمد عمر صحنون",
    "أحمد قسنطيني",
    "وائل بلدي",
  ];

  localStorage.setItem("quranNames", JSON.stringify(defaultNames));
}

// Perform Draw (Lottery)
function performDraw() {
  const hizb = document.getElementById("hizb").value;

  if (!hizb) {
    showToast("اختر الحزب", "error");
    return;
  }

  // Check if hizb already exists in history
  const history = JSON.parse(localStorage.getItem("drawHistory")) || [];
  if (history.some((item) => item.hizb === hizb)) {
    showToast("هذا الحزب مسجل مسبقاً في القائمة", "error");
    return;
  }

  const names = JSON.parse(localStorage.getItem("quranNames"));

  // Shuffle names randomly
  const shuffledNames = shuffleArray([...names]);

  // Create draw record with FR format timestamp
  const drawRecord = {
    id: Date.now(),
    hizb: hizb,
    readers: shuffledNames,
    timestamp: new Date().toLocaleString("fr-FR"),
  };

  // Save to history
  saveDrawToHistory(drawRecord);

  // Display Results
  displayResults(hizb, shuffledNames, drawRecord.id);
}

// Shuffle Array (Fisher-Yates Algorithm)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Display Results
function displayResults(hizb, shuffledNames, drawId) {
  document.getElementById("selectSection").style.display = "none";
  document.getElementById("resultsSection").style.display = "block";

  // Store current draw ID for updates
  document.getElementById("resultsSection").dataset.drawId = drawId;

  // Set Hizb
  document.getElementById("resultHizb").textContent = `الحزب ${hizb}`;

  // Set Names for each quarter
  for (let i = 1; i <= 4; i++) {
    const quarterElement = document.getElementById(`result${i}`);
    quarterElement.textContent = shuffledNames[i - 1];
    // Add animation by triggering reflow
    quarterElement.style.animation = "none";
    setTimeout(() => {
      quarterElement.style.animation = "";
    }, 10);
  }

  showToast("تم إجراء القرعة بنجاح");
}

// New Draw
function newDraw() {
  document.getElementById("selectSection").style.display = "block";
  document.getElementById("resultsSection").style.display = "none";
  document.getElementById("hizb").value = "";
  currentPage = 1;
}

// Update Draw (Re-shuffle for same hizb)
function updateDraw() {
  const hizb = document
    .getElementById("resultHizb")
    .textContent.replace("الحزب ", "");
  const drawId = document.getElementById("resultsSection").dataset.drawId;

  const names = JSON.parse(localStorage.getItem("quranNames"));
  const shuffledNames = shuffleArray([...names]);

  // Create new draw record
  const drawRecord = {
    id: drawId,
    hizb: hizb,
    readers: shuffledNames,
    timestamp: new Date().toLocaleString("fr-FR"),
  };

  // Update in history
  updateDrawInHistory(drawRecord);
  showToast("تم إعادة القرعة بنجاح");

  // Display new results
  displayResults(hizb, shuffledNames, drawId);
}

// Change Names
function changeNames() {
  localStorage.removeItem("quranNames");
  location.reload();
}

// Save Draw to History
function saveDrawToHistory(drawRecord) {
  let history = JSON.parse(localStorage.getItem("drawHistory")) || [];
  history.unshift(drawRecord); // Add to beginning

  // Keep only last 50 draws
  if (history.length > 50) {
    history = history.slice(0, 50);
  }

  localStorage.setItem("drawHistory", JSON.stringify(history));
  loadDrawHistory();
}

// Update Draw in History
function updateDrawInHistory(drawRecord) {
  let history = JSON.parse(localStorage.getItem("drawHistory")) || [];

  // Find and update the record
  const index = history.findIndex((item) => item.id === drawRecord.id);
  if (index !== -1) {
    history[index] = drawRecord;
  }

  localStorage.setItem("drawHistory", JSON.stringify(history));
  loadDrawHistory();
}

// Load and Display Draw History
function loadDrawHistory() {
  const history = JSON.parse(localStorage.getItem("drawHistory")) || [];
  const historyContainer = document.getElementById("historyContainer");

  if (history.length === 0) {
    historyContainer.style.display = "none";
    return;
  }

  historyContainer.style.display = "block";

  // Sort by hizb number in ascending order
  const sortedHistory = [...history].sort(
    (a, b) => parseInt(a.hizb) - parseInt(b.hizb),
  );

  // Calculate pagination
  const totalPages = Math.ceil(sortedHistory.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedHistory = sortedHistory.slice(startIndex, endIndex);

  // Display items for current page
  const drawHistoryDiv = document.getElementById("drawHistory");
  drawHistoryDiv.innerHTML = "";

  paginatedHistory.forEach((item) => {
    const historyItem = document.createElement("div");
    historyItem.className = "history-item";
    historyItem.innerHTML = `
            <div class="history-info">
                <h4>الحزب ${item.hizb}</h4>
                <div class="history-quarters">
                    <div><span>الربع 1:</span> ${item.readers[0]}</div>
                    <div><span>الربع 2:</span> ${item.readers[1]}</div>
                    <div><span>الربع 3:</span> ${item.readers[2]}</div>
                    <div><span>الربع 4:</span> ${item.readers[3]}</div>
                </div>
                <small style="color: #999; margin-top: 8px;">${item.timestamp}</small>
            </div>
            <div class="history-actions">
                <button class="edit-btn" onclick="redrawHizb(${item.id})">إعادة القرعة</button>
                <button class="delete-btn" onclick="deleteDrawRecord(${item.id})">حذف</button>
            </div>
        `;
    drawHistoryDiv.appendChild(historyItem);
  });

  // Display pagination controls
  displayPaginationControls(totalPages);
}

// Display Pagination Controls
function displayPaginationControls(totalPages) {
  const paginationDiv = document.getElementById("paginationControls");
  paginationDiv.innerHTML = "";

  if (totalPages <= 1) return;

  const controls = document.createElement("div");
  controls.className = "pagination";

  // Previous button
  const prevBtn = document.createElement("button");
  prevBtn.className = "pagination-btn";
  prevBtn.textContent = "السابق";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      loadDrawHistory();
      scrollToHistory();
    }
  };
  controls.appendChild(prevBtn);

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = document.createElement("button");
    pageBtn.className = `pagination-btn ${currentPage === i ? "active" : ""}`;
    pageBtn.textContent = i;
    pageBtn.onclick = () => {
      currentPage = i;
      loadDrawHistory();
      scrollToHistory();
    };
    controls.appendChild(pageBtn);
  }

  // Next button
  const nextBtn = document.createElement("button");
  nextBtn.className = "pagination-btn";
  nextBtn.textContent = "التالي";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      loadDrawHistory();
      scrollToHistory();
    }
  };
  controls.appendChild(nextBtn);

  paginationDiv.appendChild(controls);
}

// Scroll to history
function scrollToHistory() {
  const historyContainer = document.getElementById("historyContainer");
  historyContainer.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Redraw Hizb
function redrawHizb(id) {
  showConfirmModal(
    "إعادة القرعة",
    "هل أنت متأكد من إعادة قرعة هذا الحزب؟",
    function () {
      const history = JSON.parse(localStorage.getItem("drawHistory")) || [];
      const record = history.find((item) => item.id === id);

      if (record) {
        const names = JSON.parse(localStorage.getItem("quranNames"));
        const shuffledNames = shuffleArray([...names]);

        // Create updated draw record with new shuffle
        const updatedRecord = {
          id: record.id,
          hizb: record.hizb,
          readers: shuffledNames,
          timestamp: new Date().toLocaleString("fr-FR"),
        };

        // Replace in history
        const updatedHistory = history.map((item) =>
          item.id === id ? updatedRecord : item,
        );
        localStorage.setItem("drawHistory", JSON.stringify(updatedHistory));

        loadDrawHistory();
        showToast("تم إعادة القرعة بنجاح");
      }
    },
  );
}

// Delete Draw Record
function deleteDrawRecord(id) {
  showConfirmModal(
    "حذف القرعة",
    "هل أنت متأكد من حذف هذه القرعة؟ لا يمكن التراجع عن هذا الإجراء.",
    function () {
      let history = JSON.parse(localStorage.getItem("drawHistory")) || [];
      history = history.filter((item) => item.id !== id);
      localStorage.setItem("drawHistory", JSON.stringify(history));
      loadDrawHistory();
      showToast("تم حذف القرعة");
    },
  );
}

// Show Toast Notification
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}
