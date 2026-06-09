/* Main JS for navigation, demo admin login, announcement badge, and school-year calendar. */
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const adminButton = document.querySelector(".admin-button");
const adminDialog = document.querySelector("#adminDialog");
const closeDialog = document.querySelector("#closeDialog");
const adminForm = document.querySelector("#adminForm");
let toast = document.querySelector("#toast");
let adminStatus = document.querySelector("#adminStatus");
let signOutButton = document.querySelector("#signOutButton");
const demoPassword = "captain2026";
const savedEventsKey = "adminEventScheduleData";
const savedAnnouncementsKey = "adminAnnouncementsData";
const savedMembersKey = "adminImportantMembersData";
const hiddenMembersKey = "adminHiddenImportantMembers";

const faqData = [];

ensureAdminUI();

function ensureAdminUI() {
  if (!document.querySelector("#toast")) {
    const toastEl = document.createElement("div");
    toastEl.className = "toast";
    toastEl.id = "toast";
    toastEl.setAttribute("role", "status");
    toastEl.setAttribute("aria-live", "polite");
    document.body.appendChild(toastEl);
  }

  if (!document.querySelector("#adminStatus")) {
    const adminStatusEl = document.createElement("div");
    adminStatusEl.className = "admin-status";
    adminStatusEl.id = "adminStatus";
    adminStatusEl.hidden = true;

    const label = document.createElement("span");
    label.textContent = "ADMIN MODE";

    const button = document.createElement("button");
    button.className = "btn btn-secondary admin-signout-button";
    button.type = "button";
    button.id = "signOutButton";
    button.textContent = "Sign Out";

    adminStatusEl.append(label, button);
    document.body.appendChild(adminStatusEl);
  }

  if (!document.querySelector("#signOutButton")) {
    const button = document.createElement("button");
    button.className = "btn btn-secondary admin-signout-button";
    button.type = "button";
    button.id = "signOutButton";
    button.textContent = "Sign Out";
    document.querySelector("#adminStatus")?.appendChild(button);
  }

  toast = document.querySelector("#toast");
  adminStatus = document.querySelector("#adminStatus");
  signOutButton = document.querySelector("#signOutButton");
}

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

if (adminButton) {
  adminButton.addEventListener("click", () => {
    if (isAdminLoggedIn()) {
      signOutAdmin();
    } else if (adminDialog) {
      adminDialog.showModal();
    }
  });
}

if (closeDialog && adminDialog) {
  closeDialog.addEventListener("click", () => adminDialog.close());
}

if (adminForm) {
  adminForm.addEventListener("submit", event => {
    event.preventDefault();
    const password = adminForm.querySelector("#password").value;
    const message = adminForm.querySelector(".form-message");

    if (password === demoPassword) {
      localStorage.setItem("isCaptain", "true");
      message.textContent = "Login successful.";
      adminDialog.close();
      syncAdminControls();
      showToast("Login successful. Admin mode is enabled. See ADMIN_NOTES.md for editing instructions.");
    } else {
      message.textContent = "Incorrect demo password.";
    }
  });
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  setTimeout(() => toast.classList.remove("is-visible"), 5200);
}

function isAdminLoggedIn() {
  return localStorage.getItem("isCaptain") === "true";
}

function syncAdminControls() {
  const loggedIn = isAdminLoggedIn();
  document.querySelectorAll("[data-admin-only]").forEach(control => {
    control.hidden = !loggedIn;
    control.style.display = loggedIn ? "" : "none";
  });

  if (adminButton) adminButton.textContent = loggedIn ? "Sign Out" : "Login";
  if (adminStatus) adminStatus.hidden = !loggedIn;
  if (!loggedIn) {
    document.querySelectorAll("[data-video-edit-panel]").forEach(panel => panel.hidden = true);
  }
  renderScheduleLists();
  renderFAQList();
  renderAnnouncements();
  renderImportantMembers();
  updateVideoHighlightsUI();
}

function signOutAdmin() {
  localStorage.removeItem("isCaptain");
  syncAdminControls();
  closeAddGameMenu();
  closeAddAnnouncementMenu();
  closeAddMemberMenu();
  showToast("Admin mode signed out.");
}

if (signOutButton) {
  signOutButton.addEventListener("click", signOutAdmin);
}

const schoolYearMonths = [
  { year: 2026, month: 8, label: "September 2026" },
  { year: 2026, month: 9, label: "October 2026" },
  { year: 2026, month: 10, label: "November 2026" },
  { year: 2026, month: 11, label: "December 2026" },
  { year: 2027, month: 0, label: "January 2027" },
  { year: 2027, month: 1, label: "February 2027" },
  { year: 2027, month: 2, label: "March 2027" },
  { year: 2027, month: 3, label: "April 2027" },
  { year: 2027, month: 4, label: "May 2027" },
  { year: 2027, month: 5, label: "June 2027" }
];

const eventData = {
  competitive: [],
  casual: []
};

const calendarRoot = document.querySelector("[data-calendar]");
const monthTitle = document.querySelector("[data-calendar-title]");
const prevButton = document.querySelector("[data-prev-month]");
const nextButton = document.querySelector("[data-next-month]");
const addGameToggle = document.querySelector("[data-add-game-toggle]");
const addGameMenu = document.querySelector("[data-add-game-menu]");
const gameCalendarRoot = document.querySelector("[data-game-calendar]");
const gameCalendarTitle = document.querySelector("[data-game-calendar-title]");
const gameDateInput = document.querySelector("[data-game-date]");
const gamePrevButton = document.querySelector("[data-game-prev-month]");
const gameNextButton = document.querySelector("[data-game-next-month]");
const timeHourInput = document.querySelector("input[name='hour']");
const timeMinuteInput = document.querySelector("input[name='minute']");
const timePeriodToggle = document.querySelector("[data-period-toggle]");
const timePeriodInput = document.querySelector("input[name='period']");
const faqListRoot = document.querySelector("[data-faq-list]");
const addQAToggle = document.querySelector("[data-add-qa-toggle]");
const addQAMenu = document.querySelector("[data-add-qa-menu]");
const qaQuestionInput = document.querySelector("textarea[name='qaQuestion']");
const qaAnswerInput = document.querySelector("textarea[name='qaAnswer']");
const qaSaveKey = "adminFAQData";
const videoHighlightsKey = "adminVideoHighlights";
const announcementLists = document.querySelectorAll("[data-announcement-list]");
const addAnnouncementToggle = document.querySelector("[data-add-announcement-toggle]");
const addAnnouncementMenu = document.querySelector("[data-add-announcement-menu]");
const announcementTitleInput = document.querySelector("input[name='announcementTitle']");
const announcementDetailsInput = document.querySelector("textarea[name='announcementDetails']");
const memberListRoot = document.querySelector("[data-member-list]");
const addMemberToggle = document.querySelector("[data-add-member-toggle]");
const addMemberMenu = document.querySelector("[data-add-member-menu]");
const memberNameInput = document.querySelector("input[name='memberName']");
const memberDescriptionInput = document.querySelector("textarea[name='memberDescription']");
const memberImageInput = document.querySelector("input[name='memberImage']");
const oneDayMs = 1000 * 60 * 60 * 24;
const oneWeekMs = oneDayMs * 7;
let videoHighlights = { featured: "", practice: "" };
let announcementData = [];
let importantMemberData = [];
let hiddenStaticMemberIds = [];
let currentMonthIndex = getStartingMonthIndex();
let gameMonthIndex = currentMonthIndex;

loadSavedAdminEvents();
loadSavedFAQ();
loadSavedVideoHighlights();
loadSavedAnnouncements();
loadSavedImportantMembers();
initializeVideoEditors();
updateVideoHighlightsUI();
setupAddAnnouncementMenu();
setupAddMemberMenu();
renderAnnouncements();
renderImportantMembers();
updateAnnouncementBadge();
startAnnouncementLifecycleTimer();
syncAdminControls();

if (calendarRoot) {
  renderSelectedMonth();
  prevButton?.addEventListener("click", () => {
    currentMonthIndex = (currentMonthIndex - 1 + schoolYearMonths.length) % schoolYearMonths.length;
    renderSelectedMonth();
  });
  nextButton?.addEventListener("click", () => {
    currentMonthIndex = (currentMonthIndex + 1) % schoolYearMonths.length;
    renderSelectedMonth();
  });
}

setupAddGameMenu();
setupAddQAMenu();
renderScheduleLists();
renderFAQList();
renderAnnouncements();
renderImportantMembers();

function getStartingMonthIndex() {
  const now = new Date();
  const matchingMonth = schoolYearMonths.findIndex(month => month.year === now.getFullYear() && month.month === now.getMonth());
  return matchingMonth === -1 ? 0 : matchingMonth;
}

function eventsForType(type) {
  return eventData[type] || [];
}

function renderSelectedMonth() {
  const type = calendarRoot.dataset.calendar;
  const month = schoolYearMonths[currentMonthIndex];
  renderCalendar(calendarRoot, month.year, month.month, eventsForType(type));
  if (monthTitle) monthTitle.textContent = month.label;
}

function renderCalendar(root, year, month, events) {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  root.innerHTML = "";

  dayNames.forEach(day => {
    const dayName = document.createElement("div");
    dayName.className = "day-name";
    dayName.textContent = day;
    root.appendChild(dayName);
  });

  for (let day = 0; day < firstDay; day++) {
    const emptyDay = document.createElement("div");
    emptyDay.className = "empty-day";
    root.appendChild(emptyDay);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = getDateValue(year, month, day);
    const matchingEvents = events.filter(event => event.date === date);
    const dayCell = document.createElement("div");
    dayCell.innerHTML = `<strong>${day}</strong>`;

    if (matchingEvents.length > 0) {
      dayCell.classList.add("has-event");
      matchingEvents.forEach(event => {
        const titleText = event.title ? `${escapeHtml(event.time)} — ${escapeHtml(event.title)}` : escapeHtml(event.time) || "Scheduled";
        dayCell.innerHTML += `<div class="calendar-event"><span>${titleText}</span></div>`;
      });
    }

    root.appendChild(dayCell);
  }
}

function renderScheduleLists() {
  document.querySelectorAll("[data-event-list]").forEach(list => {
    const type = list.dataset.eventList;
    const status = list.dataset.eventStatus;
    const now = new Date();
    const filteredEvents = eventsForType(type)
      .filter(event => {
        const eventDate = new Date(event.date + "T23:59:59");
        return status === "upcoming" ? eventDate >= now : eventDate < now;
      })
      .sort((first, second) => first.date.localeCompare(second.date));

    list.innerHTML = "";
    if (filteredEvents.length === 0) {
      if (type === "competitive" && status === "upcoming") return;
      list.innerHTML = `<article class="event-card"><div><h3>No ${status} ${type === "competitive" ? "games" : "meetings"} right now</h3><p>Events will appear here automatically based on the current date.</p></div></article>`;
      return;
    }

    filteredEvents.forEach(event => list.appendChild(type === "competitive" ? createGameCard(event, status) : createMeetingCard(event, status)));
  });
}

function createGameCard(event, status) {
  const card = document.createElement("article");
  card.className = status === "completed" ? "event-card completed-game" : "event-card";
  const isAdmin = isAdminLoggedIn();
  const logos = `<div class="match-logos"><img src="${event.homeLogo}" alt="PHS falcon logo"><img src="${event.awayLogo}" alt="${event.awayAlt}"></div>`;

  if (status === "completed") {
    card.innerHTML = `<div><details><summary><strong>${formatDate(event.date)} at ${escapeHtml(event.time)}</strong> — ${escapeHtml(event.title)}</summary><p><strong>Score:</strong> ${escapeHtml(event.score)}</p><p>${escapeHtml(event.description)}</p></details></div>${logos}`;
  } else {
    const timeText = escapeHtml(formatTime(event.time));
    const matchupText = escapeHtml(event.title || `${event.schoolOne || ""}${event.schoolOne && event.schoolTwo ? " vs " : ""}${event.schoolTwo || ""}`.trim() || "Matchup TBD");
    card.innerHTML = `<div><p class="game-datetime"><strong>${formatDate(event.date)} at ${timeText}</strong></p><p class="game-matchup">${matchupText}</p><p>${escapeHtml(event.description)}</p></div>${logos}`;
    if (isAdmin) {
      const deleteButton = document.createElement("button");
      deleteButton.className = "btn btn-secondary game-delete-button";
      deleteButton.type = "button";
      deleteButton.dataset.adminOnly = "";
      deleteButton.setAttribute("aria-label", "Delete upcoming game");
      deleteButton.textContent = "✕";
      deleteButton.addEventListener("click", () => {
        eventData.competitive = eventData.competitive.filter(existing => existing !== event);
        saveAdminEvents();
        renderScheduleLists();
        renderSelectedMonth();
      });
      card.appendChild(deleteButton);
    }
  }

  return card;
}

function createMeetingCard(event, status) {
  const card = document.createElement("article");
  card.className = status === "completed" ? "event-card completed-game" : "event-card";
  const isAdmin = isAdminLoggedIn();

  if (status === "completed") {
    card.innerHTML = `<div><details><summary><strong>${formatDate(event.date)} at ${escapeHtml(event.time)}</strong> — ${escapeHtml(event.title)}</summary><p>${escapeHtml(event.description)}</p></details></div>`;
  } else {
    const timeText = escapeHtml(formatTime(event.time));
    const titleText = escapeHtml(event.title || "Meeting TBD");
    card.innerHTML = `<div><p class="game-datetime"><strong>${formatDate(event.date)} at ${timeText}</strong></p><p class="game-matchup">${titleText}</p><p>${escapeHtml(event.description)}</p></div>`;
    if (isAdmin) {
      const deleteButton = document.createElement("button");
      deleteButton.className = "btn btn-secondary game-delete-button";
      deleteButton.type = "button";
      deleteButton.dataset.adminOnly = "";
      deleteButton.setAttribute("aria-label", "Delete upcoming meeting");
      deleteButton.textContent = "✕";
      deleteButton.addEventListener("click", () => {
        eventData.casual = eventData.casual.filter(existing => existing !== event);
        saveAdminEvents();
        renderScheduleLists();
        renderSelectedMonth();
      });
      card.appendChild(deleteButton);
    }
  }

  return card;
}

function renderFAQList() {
  if (!faqListRoot) return;
  faqListRoot.innerHTML = "";
  faqData.forEach((item, index) => {
    const detail = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = item.question;
    const answer = document.createElement("p");
    answer.textContent = item.answer;
    detail.append(summary, answer);

    if (isAdminLoggedIn()) {
      const deleteButton = document.createElement("button");
      deleteButton.className = "btn btn-secondary faq-delete-button";
      deleteButton.type = "button";
      deleteButton.dataset.adminOnly = "";
      deleteButton.setAttribute("aria-label", "Delete Q/A");
      deleteButton.textContent = "✕";
      deleteButton.addEventListener("click", () => {
        faqData.splice(index, 1);
        saveAdminFAQ();
        renderFAQList();
      });
      detail.appendChild(deleteButton);
    }

    faqListRoot.appendChild(detail);
  });
}

function setupAddAnnouncementMenu() {
  if (!addAnnouncementToggle || !addAnnouncementMenu) return;

  addAnnouncementToggle.addEventListener("click", () => {
    if (addAnnouncementMenu.hidden) {
      openAddAnnouncementMenu();
    } else {
      closeAddAnnouncementMenu();
    }
  });

  document.addEventListener("click", event => {
    if (addAnnouncementMenu.hidden) return;
    const target = event.target;
    if (target instanceof Node && !addAnnouncementMenu.contains(target) && !addAnnouncementToggle.contains(target)) {
      closeAddAnnouncementMenu();
    }
  });

  addAnnouncementMenu.addEventListener("submit", event => {
    event.preventDefault();
    if (!isAdminLoggedIn()) return;

    const title = String(announcementTitleInput?.value || "").trim();
    const details = String(announcementDetailsInput?.value || "").trim();

    if (!title || !details) {
      showToast("Enter an announcement title and details.");
      return;
    }

    announcementData.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title,
      details,
      createdAt: new Date().toISOString()
    });

    saveAnnouncements();
    renderAnnouncements();
    updateAnnouncementBadge();
    addAnnouncementMenu.reset();
    closeAddAnnouncementMenu();
    showToast("Announcement added.");
  });
}

function openAddAnnouncementMenu() {
  if (!addAnnouncementMenu || !addAnnouncementToggle) return;
  addAnnouncementMenu.hidden = false;
  addAnnouncementToggle.setAttribute("aria-expanded", "true");
  announcementTitleInput?.focus();
}

function closeAddAnnouncementMenu() {
  if (!addAnnouncementMenu || !addAnnouncementToggle) return;
  addAnnouncementMenu.hidden = true;
  addAnnouncementToggle.setAttribute("aria-expanded", "false");
}

function renderAnnouncements() {
  if (announcementLists.length === 0) return;
  pruneAnnouncements();

  announcementLists.forEach(list => {
    const status = list.dataset.announcementList;
    const announcements = announcementData
      .filter(item => getAnnouncementStatus(item) === status)
      .sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt));

    list.innerHTML = "";
    if (announcements.length === 0) {
      const emptyCard = document.createElement("article");
      emptyCard.className = "card announcement";
      emptyCard.innerHTML = `<h3>No ${status} announcements right now</h3><p>Announcements will appear here automatically.</p>`;
      list.appendChild(emptyCard);
      return;
    }

    announcements.forEach(item => list.appendChild(createAnnouncementCard(item, status)));
  });
}

function createAnnouncementCard(item, status) {
  const card = document.createElement("article");
  card.className = "card announcement announcement-card";

  const content = document.createElement("div");
  const title = document.createElement("h3");
  const details = document.createElement("p");
  title.textContent = item.title;
  details.textContent = item.details;
  content.append(title, details);
  card.appendChild(content);

  if (status === "recent" && isAdminLoggedIn()) {
    const deleteButton = document.createElement("button");
    deleteButton.className = "btn btn-secondary announcement-delete-button";
    deleteButton.type = "button";
    deleteButton.dataset.adminOnly = "";
    deleteButton.setAttribute("aria-label", "Delete recent announcement");
    deleteButton.textContent = "X";
    deleteButton.addEventListener("click", () => {
      announcementData = announcementData.filter(existing => existing.id !== item.id);
      saveAnnouncements();
      renderAnnouncements();
      updateAnnouncementBadge();
      showToast("Announcement deleted.");
    });
    card.appendChild(deleteButton);
  }

  return card;
}

function loadSavedAnnouncements() {
  try {
    const saved = JSON.parse(localStorage.getItem(savedAnnouncementsKey) || "[]");
    if (Array.isArray(saved)) {
      announcementData = saved
        .filter(item => item && typeof item === "object")
        .map(item => ({
          id: String(item.id || `${Date.parse(item.createdAt) || Date.now()}-${Math.random().toString(36).slice(2)}`),
          title: String(item.title || "").trim(),
          details: String(item.details || "").trim(),
          createdAt: String(item.createdAt || "")
        }))
        .filter(item => item.title && item.details && !Number.isNaN(Date.parse(item.createdAt)));
    }
  } catch {
    localStorage.removeItem(savedAnnouncementsKey);
  }
  pruneAnnouncements();
}

function saveAnnouncements() {
  pruneAnnouncements(false);
  localStorage.setItem(savedAnnouncementsKey, JSON.stringify(announcementData));
}

function pruneAnnouncements(shouldSave = true) {
  const beforeLength = announcementData.length;
  const now = Date.now();
  announcementData = announcementData.filter(item => {
    const createdTime = Date.parse(item.createdAt);
    return !Number.isNaN(createdTime) && now - createdTime < oneWeekMs;
  });
  if (shouldSave && beforeLength !== announcementData.length) {
    localStorage.setItem(savedAnnouncementsKey, JSON.stringify(announcementData));
  }
}

function getAnnouncementStatus(item) {
  const age = Date.now() - Date.parse(item.createdAt);
  return age < oneDayMs ? "recent" : "past";
}

function updateAnnouncementBadge() {
  const badge = document.querySelector("[data-announcement-badge]");
  if (!badge) return;
  pruneAnnouncements();
  const hasRecentAnnouncement = announcementData.some(item => getAnnouncementStatus(item) === "recent");
  badge.classList.toggle("is-visible", hasRecentAnnouncement);
}

function startAnnouncementLifecycleTimer() {
  if (announcementLists.length === 0 && !document.querySelector("[data-announcement-badge]")) return;
  setInterval(() => {
    renderAnnouncements();
    updateAnnouncementBadge();
  }, 1000 * 60);
}

function setupAddMemberMenu() {
  if (!addMemberToggle || !addMemberMenu) return;

  addMemberToggle.addEventListener("click", () => {
    if (addMemberMenu.hidden) {
      openAddMemberMenu();
    } else {
      closeAddMemberMenu();
    }
  });

  document.addEventListener("click", event => {
    if (addMemberMenu.hidden) return;
    const target = event.target;
    if (target instanceof Node && !addMemberMenu.contains(target) && !addMemberToggle.contains(target)) {
      closeAddMemberMenu();
    }
  });

  addMemberMenu.addEventListener("submit", event => {
    event.preventDefault();
    if (!isAdminLoggedIn()) return;

    const name = String(memberNameInput?.value || "").trim();
    const description = String(memberDescriptionInput?.value || "").trim();
    const imageFile = memberImageInput?.files?.[0];

    if (!name || !description || !imageFile) {
      showToast("Enter a member name, description, and image.");
      return;
    }

    if (!imageFile.type.startsWith("image/")) {
      showToast("Choose an image file for the member.");
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const newMember = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name,
        description,
        imageSrc: String(reader.result || "")
      };
      importantMemberData.push(newMember);
      if (!saveImportantMembers()) {
        importantMemberData = importantMemberData.filter(member => member.id !== newMember.id);
        showToast("That image is too large to save in this browser.");
        return;
      }
      renderImportantMembers();
      addMemberMenu.reset();
      closeAddMemberMenu();
      showToast("Important member added.");
    });
    reader.addEventListener("error", () => showToast("Could not read that image file."));
    reader.readAsDataURL(imageFile);
  });
}

function openAddMemberMenu() {
  if (!addMemberMenu || !addMemberToggle) return;
  addMemberMenu.hidden = false;
  addMemberToggle.setAttribute("aria-expanded", "true");
  memberNameInput?.focus();
}

function closeAddMemberMenu() {
  if (!addMemberMenu || !addMemberToggle) return;
  addMemberMenu.hidden = true;
  addMemberToggle.setAttribute("aria-expanded", "false");
}

function renderImportantMembers() {
  if (!memberListRoot) return;

  memberListRoot.querySelectorAll("[data-static-member]").forEach(card => {
    const isHidden = hiddenStaticMemberIds.includes(card.dataset.staticMember);
    card.hidden = isHidden;
    card.style.display = isHidden ? "none" : "";
    card.querySelector("[data-member-delete]")?.remove();
    if (!isHidden && isAdminLoggedIn()) {
      card.appendChild(createMemberDeleteButton(() => {
        hiddenStaticMemberIds.push(card.dataset.staticMember);
        saveHiddenStaticMembers();
        renderImportantMembers();
        showToast("Important member deleted.");
      }));
    }
  });

  memberListRoot.querySelectorAll("[data-admin-member]").forEach(card => card.remove());
  importantMemberData.forEach(member => {
    memberListRoot.appendChild(createImportantMemberCard(member));
  });
}

function createImportantMemberCard(member) {
  const card = document.createElement("article");
  card.className = "card member-card";
  card.dataset.adminMember = member.id;

  const image = document.createElement("img");
  image.src = member.imageSrc;
  image.alt = `Portrait for ${member.name}`;
  image.loading = "lazy";

  const name = document.createElement("h3");
  name.textContent = member.name;

  const description = document.createElement("p");
  description.textContent = member.description;

  card.append(image, name, description);

  if (isAdminLoggedIn()) {
    card.appendChild(createMemberDeleteButton(() => {
      importantMemberData = importantMemberData.filter(existing => existing.id !== member.id);
      saveImportantMembers();
      renderImportantMembers();
      showToast("Important member deleted.");
    }));
  }

  return card;
}

function createMemberDeleteButton(onDelete) {
  const deleteButton = document.createElement("button");
  deleteButton.className = "btn btn-secondary member-delete-button";
  deleteButton.type = "button";
  deleteButton.dataset.adminOnly = "";
  deleteButton.dataset.memberDelete = "";
  deleteButton.setAttribute("aria-label", "Delete important member");
  deleteButton.textContent = "X";
  deleteButton.addEventListener("click", onDelete);
  return deleteButton;
}

function loadSavedImportantMembers() {
  if (!memberListRoot) return;
  try {
    const savedMembers = JSON.parse(localStorage.getItem(savedMembersKey) || "[]");
    if (Array.isArray(savedMembers)) {
      importantMemberData = savedMembers
        .filter(member => member && typeof member === "object")
        .map(member => ({
          id: String(member.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`),
          name: String(member.name || "").trim(),
          description: String(member.description || "").trim(),
          imageSrc: String(member.imageSrc || "")
        }))
        .filter(member => member.name && member.description && member.imageSrc);
    }
  } catch {
    localStorage.removeItem(savedMembersKey);
  }

  try {
    const hiddenIds = JSON.parse(localStorage.getItem(hiddenMembersKey) || "[]");
    if (Array.isArray(hiddenIds)) hiddenStaticMemberIds = hiddenIds.map(id => String(id));
  } catch {
    localStorage.removeItem(hiddenMembersKey);
  }
}

function saveImportantMembers() {
  if (!memberListRoot) return false;
  try {
    localStorage.setItem(savedMembersKey, JSON.stringify(importantMemberData));
    return true;
  } catch {
    return false;
  }
}

function saveHiddenStaticMembers() {
  if (!memberListRoot) return;
  hiddenStaticMemberIds = [...new Set(hiddenStaticMemberIds)];
  localStorage.setItem(hiddenMembersKey, JSON.stringify(hiddenStaticMemberIds));
}

function setupAddQAMenu() {
  if (!addQAToggle || !addQAMenu) return;

  addQAToggle.addEventListener("click", () => {
    if (addQAMenu.hidden) {
      addQAMenu.hidden = false;
      addQAToggle.setAttribute("aria-expanded", "true");
    } else {
      addQAMenu.hidden = true;
      addQAToggle.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("click", event => {
    if (!addQAMenu || addQAMenu.hidden) return;
    const target = event.target;
    if (target instanceof Node && !addQAMenu.contains(target) && !addQAToggle.contains(target)) {
      addQAMenu.hidden = true;
      addQAToggle.setAttribute("aria-expanded", "false");
    }
  });

  addQAMenu.addEventListener("submit", event => {
    event.preventDefault();
    if (!isAdminLoggedIn()) return;
    const question = String(qaQuestionInput?.value || "").trim();
    const answer = String(qaAnswerInput?.value || "").trim();
    if (!question || !answer) {
      showToast("Enter both a question and an answer.");
      return;
    }

    faqData.push({ question, answer, adminAdded: true });
    saveAdminFAQ();
    renderFAQList();
    addQAMenu.reset();
    addQAMenu.hidden = true;
    addQAToggle.setAttribute("aria-expanded", "false");
    showToast("Q/A added.");
  });
}

function loadSavedFAQ() {
  if (!faqListRoot) return;
  try {
    const saved = JSON.parse(localStorage.getItem(qaSaveKey) || "[]");
    if (Array.isArray(saved)) {
      faqData.push(...saved.map(item => ({ ...item, adminAdded: true })));
    }
  } catch {
    localStorage.removeItem(qaSaveKey);
  }
}

function saveAdminFAQ() {
  if (!faqListRoot) return;
  const adminFaqs = faqData.filter(item => item.adminAdded);
  localStorage.setItem(qaSaveKey, JSON.stringify(adminFaqs));
}

function loadSavedVideoHighlights() {
  try {
    const saved = JSON.parse(localStorage.getItem(videoHighlightsKey) || "{}");
    if (saved && typeof saved === "object") {
      videoHighlights.featured = String(saved.featured || "");
      videoHighlights.practice = String(saved.practice || "");
    }
  } catch {
    localStorage.removeItem(videoHighlightsKey);
  }
}

function saveVideoHighlights() {
  localStorage.setItem(videoHighlightsKey, JSON.stringify(videoHighlights));
}

function updateVideoHighlightsUI() {
  document.querySelectorAll("[data-video-card]").forEach(card => {
    const type = card.dataset.videoCard;
    const iframe = card.querySelector("iframe");
    const description = card.querySelector(".video-description");
    const savedUrl = videoHighlights[type];
    if (iframe && savedUrl) {
      iframe.src = savedUrl;
      if (description) description.textContent = "Updated video embed.";
    }
  });
}

function initializeVideoEditors() {
  document.querySelectorAll("[data-video-card]").forEach(card => {
    const toggle = card.querySelector("[data-video-edit-toggle]");
    const panel = card.querySelector("[data-video-edit-panel]");
    const input = card.querySelector(".video-url-input");
    const saveButton = card.querySelector("[data-video-save]");
    const cancelButton = card.querySelector("[data-video-cancel]");
    if (!toggle || !panel || !input || !saveButton || !cancelButton) return;

    toggle.addEventListener("click", () => {
      if (!isAdminLoggedIn()) return;
      panel.hidden = false;
      input.value = videoHighlights[card.dataset.videoCard] || "";
      input.focus();
    });

    saveButton.addEventListener("click", () => {
      if (!isAdminLoggedIn()) return;
      const rawUrl = String(input.value || "").trim();
      const embedUrl = getVideoEmbedUrl(rawUrl);
      if (!embedUrl) {
        showToast("Enter a valid YouTube or Vimeo video URL.");
        return;
      }
      videoHighlights[card.dataset.videoCard] = embedUrl;
      saveVideoHighlights();
      updateVideoHighlightsUI();
      panel.hidden = true;
      showToast("Video embed updated.");
    });

    cancelButton.addEventListener("click", () => {
      panel.hidden = true;
    });
  });
}

function getVideoEmbedUrl(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      if (parsed.pathname === "/watch") {
        const id = parsed.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : "";
      }
      if (parsed.pathname.startsWith("/embed/")) {
        return `https://www.youtube.com${parsed.pathname}${parsed.search}`;
      }
      if (parsed.pathname.startsWith("/shorts/")) {
        const id = parsed.pathname.split("/")[2];
        return id ? `https://www.youtube.com/embed/${id}` : "";
      }
    }
    if (hostname === "youtu.be") {
      const id = parsed.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }
    if (hostname === "vimeo.com") {
      const id = parsed.pathname.slice(1).split("/")[0];
      return id ? `https://player.vimeo.com/video/${id}` : "";
    }
    if (hostname === "player.vimeo.com") {
      return url;
    }
  } catch {
    return "";
  }
  return "";
}

function setupAddGameMenu() {
  if (!addGameToggle || !addGameMenu || !gameCalendarRoot) return;

  addGameToggle.addEventListener("click", () => {
    if (addGameMenu.hidden) {
      openAddGameMenu();
    } else {
      closeAddGameMenu();
    }
  });


  document.addEventListener("click", event => {
    if (addGameMenu.hidden) return;
    const target = event.target;
    if (target instanceof Node && !addGameMenu.contains(target) && !addGameToggle.contains(target)) {
      closeAddGameMenu();
    }
  });

  gamePrevButton?.addEventListener("click", () => {
    gameMonthIndex = (gameMonthIndex - 1 + schoolYearMonths.length) % schoolYearMonths.length;
    renderGamePickerMonth();
  });

  gameNextButton?.addEventListener("click", () => {
    gameMonthIndex = (gameMonthIndex + 1) % schoolYearMonths.length;
    renderGamePickerMonth();
  });

  timePeriodToggle?.addEventListener("click", () => {
    const nextPeriod = timePeriodToggle.textContent === "PM" ? "AM" : "PM";
    timePeriodToggle.textContent = nextPeriod;
    if (timePeriodInput) timePeriodInput.value = nextPeriod;
  });

  addGameMenu.addEventListener("submit", event => {
    event.preventDefault();
    if (!isAdminLoggedIn()) return;

    const formData = new FormData(addGameMenu);
    const date = String(formData.get("date") || "");
    const hour = String(formData.get("hour") || "").trim();
    const minute = String(formData.get("minute") || "").trim().padStart(2, "0");
    const period = String(formData.get("period") || "PM").trim();
    const schoolOne = String(formData.get("schoolOne") || "").trim();
    const schoolTwo = String(formData.get("schoolTwo") || "").trim();
    const notes = String(formData.get("notes") || "").trim();

    const hourNum = Number(hour);
    const minuteNum = Number(minute);

    if (!date || !hour || !minute || !schoolOne || !schoolTwo) {
      showToast("Choose a date, time, and enter both fields.");
      return;
    }

    if (
      Number.isNaN(hourNum) ||
      Number.isNaN(minuteNum) ||
      hourNum < 1 ||
      hourNum > 12 ||
      minuteNum < 0 ||
      minuteNum > 59
    ) {
      showToast("Enter a valid time: hour 1–12 and minute 0–59.");
      return;
    }

    const normalizedHour = String(hourNum);
    const normalizedMinute = String(minuteNum).padStart(2, "0");

    const eventType = calendarRoot?.dataset.calendar || "competitive";
    const eventTitle = eventType === "competitive"
      ? `${schoolOne} vs. ${schoolTwo}`
      : `${schoolOne}${schoolTwo ? ` — ${schoolTwo}` : ""}`;
    const eventDescription = notes || (eventType === "competitive" ? "Varsity Rocket League match." : "Casual club meeting.");

    const game = {
      date,
      time: `${normalizedHour}:${normalizedMinute} ${period}`,
      title: eventTitle,
      description: eventDescription,
      adminAdded: true
    };

    if (eventType === "competitive") {
      Object.assign(game, {
        score: "Score will be added after the match.",
        homeLogo: "assets/falcon-logo.png",
        awayLogo: "assets/school-placeholder.png",
        awayAlt: `${schoolTwo} mascot placeholder`
      });
    }

    eventData[eventType].push(game);
    saveAdminEvents();
    renderScheduleLists();
    renderSelectedMonth();
    addGameMenu.reset();
    resetTimePicker();
    clearGamePickerSelection();
    closeAddGameMenu();
    showToast(eventType === "competitive" ? "Game added to the schedule." : "Meeting added to the schedule.");
  });

  renderGamePickerMonth();
  resetTimePicker();
}

function openAddGameMenu() {
  if (!addGameMenu || !addGameToggle) return;
  addGameMenu.hidden = false;
  addGameToggle.setAttribute("aria-expanded", "true");
  renderGamePickerMonth();
}

function closeAddGameMenu() {
  if (!addGameMenu || !addGameToggle) return;
  addGameMenu.hidden = true;
  addGameToggle.setAttribute("aria-expanded", "false");
}

function resetTimePicker() {
  if (timeHourInput) timeHourInput.value = "4";
  if (timeMinuteInput) timeMinuteInput.value = "00";
  if (timePeriodToggle) timePeriodToggle.textContent = "PM";
  if (timePeriodInput) timePeriodInput.value = "PM";
}

function renderGamePickerMonth() {
  if (!gameCalendarRoot) return;
  const month = schoolYearMonths[gameMonthIndex];
  const firstDay = new Date(month.year, month.month, 1).getDay();
  const daysInMonth = new Date(month.year, month.month + 1, 0).getDate();

  if (gameCalendarTitle) gameCalendarTitle.textContent = month.label;
  gameCalendarRoot.innerHTML = "";

  ["S", "M", "T", "W", "T", "F", "S"].forEach(day => {
    const dayName = document.createElement("span");
    dayName.className = "mini-day-name";
    dayName.textContent = day;
    gameCalendarRoot.appendChild(dayName);
  });

  for (let day = 0; day < firstDay; day++) {
    const emptyDay = document.createElement("span");
    emptyDay.className = "mini-empty-day";
    gameCalendarRoot.appendChild(emptyDay);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const button = document.createElement("button");
    const date = getDateValue(month.year, month.month, day);
    button.className = "mini-day-button";
    button.type = "button";
    button.textContent = String(day);
    button.dataset.date = date;
    button.setAttribute("aria-label", `Choose ${formatDate(date)}`);

    if (gameDateInput?.value === date) button.classList.add("is-selected");

    button.addEventListener("click", () => {
      if (gameDateInput) gameDateInput.value = date;
      clearGamePickerSelection();
      button.classList.add("is-selected");
    });

    gameCalendarRoot.appendChild(button);
  }
}

function clearGamePickerSelection() {
  gameCalendarRoot?.querySelectorAll(".mini-day-button").forEach(button => {
    button.classList.toggle("is-selected", button.dataset.date === gameDateInput?.value);
  });
}

function loadSavedAdminEvents() {
  try {
    const savedData = JSON.parse(localStorage.getItem(savedEventsKey) || "{}");
    if (Array.isArray(savedData)) {
      eventData.competitive.push(...savedData);
    } else {
      if (Array.isArray(savedData.competitive)) eventData.competitive.push(...savedData.competitive);
      if (Array.isArray(savedData.casual)) eventData.casual.push(...savedData.casual);
    }
  } catch {
    localStorage.removeItem(savedEventsKey);
  }
}

function saveAdminEvents() {
  const adminEvents = {
    competitive: eventData.competitive.filter(event => event.adminAdded),
    casual: eventData.casual.filter(event => event.adminAdded)
  };
  localStorage.setItem(savedEventsKey, JSON.stringify(adminEvents));
}

function getDateValue(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDate(date) {
  const parsedDate = new Date(date + "T12:00:00");
  return parsedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function formatTime(time) {
  const trimmed = String(time || "").trim();
  if (!trimmed) return "TBD";

  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return trimmed;

  let hour = Number(match[1]);
  const minute = match[2];
  const period = match[3] ? match[3].toUpperCase() : hour >= 12 ? "PM" : "AM";

  if (!match[3]) {
    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;
  }

  return `${hour}:${minute} ${period}`;
}

function escapeHtml(value) {
  const container = document.createElement("div");
  container.textContent = String(value || "");
  return container.innerHTML;
}
