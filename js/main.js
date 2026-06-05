/* Main JS for navigation, demo admin login, announcement badge, and school-year calendar. */
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const adminButton = document.querySelector(".admin-button");
const adminDialog = document.querySelector("#adminDialog");
const closeDialog = document.querySelector("#closeDialog");
const adminForm = document.querySelector("#adminForm");
const toast = document.querySelector("#toast");
const adminStatus = document.querySelector("#adminStatus");
const signOutButton = document.querySelector("#signOutButton");
const demoPassword = "captain2026";
const savedCompetitiveGamesKey = "adminCompetitiveGamesDialTime";

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
  });

  if (adminButton) adminButton.textContent = loggedIn ? "Sign Out" : "Login";
  if (adminStatus) adminStatus.hidden = !loggedIn;
}

function signOutAdmin() {
  localStorage.removeItem("isCaptain");
  syncAdminControls();
  closeAddGameMenu();
  showToast("Admin mode signed out.");
}

if (signOutButton) {
  signOutButton.addEventListener("click", signOutAdmin);
}

const latestAnnouncementIso = "2026-06-04T09:00:00";
const badge = document.querySelector("[data-announcement-badge]");
if (badge) {
  const latestDate = new Date(latestAnnouncementIso);
  const now = new Date();
  const hoursSinceLatest = (now - latestDate) / (1000 * 60 * 60);
  if (hoursSinceLatest >= 0 && hoursSinceLatest <= 24) badge.classList.add("is-visible");
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
  casual: [
    { date: "2026-09-04", time: "3:00 PM", title: "Welcome Meeting", description: "Students meet the club and discuss games for the year." },
    { date: "2026-10-11", time: "3:00 PM", title: "Smash Tournament", description: "Casual bracket-style meeting for students interested in Smash." },
    { date: "2026-11-18", time: "3:00 PM", title: "Mario Kart Meeting", description: "Casual meeting focused on racing games and party games." },
    { date: "2027-02-08", time: "3:00 PM", title: "Minecraft Build Night", description: "Students collaborate on a creative building challenge." },
    { date: "2027-04-25", time: "3:00 PM", title: "Suggestion Day", description: "Members vote on games and activities for future meetings." }
  ]
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
let currentMonthIndex = getStartingMonthIndex();
let gameMonthIndex = currentMonthIndex;

loadSavedCompetitiveGames();
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
renderScheduleLists();

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
    card.innerHTML = `<div><p class="game-datetime"><strong>${formatDate(event.date)} at ${escapeHtml(event.time)}</strong></p><h3>${escapeHtml(event.title)}</h3><p>${escapeHtml(event.description)}</p></div>${logos}`;
    const deleteButton = document.createElement("button");
    deleteButton.className = "btn btn-secondary game-delete-button";
    deleteButton.type = "button";
    deleteButton.dataset.adminOnly = "";
    deleteButton.hidden = !isAdmin;
    deleteButton.setAttribute("aria-label", "Delete upcoming game");
    deleteButton.textContent = "✕";
    deleteButton.addEventListener("click", () => {
      eventData.competitive = eventData.competitive.filter(existing => existing !== event);
      saveAdminCompetitiveGames();
      renderScheduleLists();
      renderSelectedMonth();
    });
    card.appendChild(deleteButton);
  }

  return card;
}

function createMeetingCard(event, status) {
  const card = document.createElement("article");
  card.className = "event-card";

  if (status === "completed") {
    card.innerHTML = `<div><details><summary><strong>${formatDate(event.date)} at ${escapeHtml(event.time)}</strong> — ${escapeHtml(event.title)}</summary><p>${escapeHtml(event.description)}</p></details></div>`;
  } else {
    card.innerHTML = `<div><h3>${formatDate(event.date)} at ${escapeHtml(event.time)}</h3><p>${escapeHtml(event.title)}</p><p>${escapeHtml(event.description)}</p></div>`;
  }

  return card;
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

    if (!date || !hour || !minute || !schoolOne || !schoolTwo) {
      showToast("Choose a date, time, and enter both schools.");
      return;
    }

    const game = {
      date,
      time: `${hour}:${minute} ${period}`,
      title: `${schoolOne} vs. ${schoolTwo}`,
      description: notes || "Varsity Rocket League match.",
      score: "Score will be added after the match.",
      homeLogo: "assets/falcon-logo.png",
      awayLogo: "assets/school-placeholder.png",
      awayAlt: `${schoolTwo} mascot placeholder`,
      adminAdded: true
    };

    eventData.competitive.push(game);
    saveAdminCompetitiveGames();
    renderScheduleLists();
    renderSelectedMonth();
    addGameMenu.reset();
    resetTimePicker();
    clearGamePickerSelection();
    closeAddGameMenu();
    showToast("Game added to the schedule.");
  });

  renderGamePickerMonth();
  resetTimePicker();
}

function openAddGameMenu() {
  addGameMenu.hidden = false;
  addGameToggle.setAttribute("aria-expanded", "true");
  renderGamePickerMonth();
}

function closeAddGameMenu() {
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

function loadSavedCompetitiveGames() {
  try {
    const savedGames = JSON.parse(localStorage.getItem(savedCompetitiveGamesKey) || "[]");
    if (Array.isArray(savedGames)) eventData.competitive.push(...savedGames);
  } catch {
    localStorage.removeItem(savedCompetitiveGamesKey);
  }
}

function saveAdminCompetitiveGames() {
  const adminGames = eventData.competitive.filter(event => event.adminAdded);
  localStorage.setItem(savedCompetitiveGamesKey, JSON.stringify(adminGames));
}

function getDateValue(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDate(date) {
  const parsedDate = new Date(date + "T12:00:00");
  return parsedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function escapeHtml(value) {
  const template = document.createElement("template");
  template.textContent = value;
  return template.innerHTML;
}
