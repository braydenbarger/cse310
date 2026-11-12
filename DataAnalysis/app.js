const { views, outsideHours } = window.STATS;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const $ = (id) => document.getElementById(id);

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function parseDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(iso, options = { month: "short", day: "numeric", year: "numeric" }) {
  return parseDate(iso).toLocaleDateString("en-US", options);
}

function formatHours(h) {
  if (h < 1) return `${Math.round(h * 60)} min`;
  return h.toFixed(1) === "1.0" ? "1 hour" : `${h.toFixed(1)} hours`;
}

function formatHour(h) {
  if (h === 0) return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

function renderHero(view) {
  const artist = view.artists[0];
  const album = view.albums[0];
  $("hero-artist").textContent =
    `Most-played artist: ${artist.name}, at ${formatHours(artist.hours)}.`;
  $("hero-album").textContent =
    `Most-played album: ${album.name} by ${album.artist}, at ${formatHours(album.hours)}.`;
}

function renderTiles(view) {
  const tiles = [
    ["Days listening", view.activeDays],
    ["Per listening day", `${view.hoursPerDay.toFixed(1)} h`],
    ["Longest streak", `${view.streak} days`],
    ["Biggest day", `${view.peakDay.hours.toFixed(1)} h`, formatDate(view.peakDay.date)],
    ["Artists", view.artistCount.toLocaleString("en-US")],
    ["Songs", view.songCount.toLocaleString("en-US")],
  ];
  $("tiles").replaceChildren(...tiles.map(([label, value, sub]) => {
    const tile = el("div", "tile");
    tile.append(el("p", "tile-label", label), el("p", "tile-value", value));
    if (sub) tile.append(el("p", "tile-sub", sub));
    return tile;
  }));
}

function renderDaily(view, key) {
  const allDays = view.panels.flatMap((p) => p.days);
  const ceiling = Math.ceil(Math.max(...allDays.map((d) => d.hours)) / 2) * 2;
  const ticks = [];
  for (let t = 2; t <= ceiling; t += 2) ticks.push(t);

  $("daily").replaceChildren(...view.panels.map((panel) => {
    const wrap = el("div", "panel");
    wrap.style.flex = `${panel.days.length} 1 0`;
    if (view.panels.length > 1) wrap.append(el("p", "panel-title", panel.label));

    const plot = el("div", "plot");
    ticks.forEach((t) => {
      const line = el("div", "gridline");
      line.style.bottom = `${(t / ceiling) * 100}%`;
      line.append(el("span", "", `${t}h`));
      plot.append(line);
    });

    const bars = el("div", "bars");
    panel.days.forEach((day) => {
      const col = el("div", "day");
      col.dataset.tip = `${formatDate(day.date)}: ${day.hours ? formatHours(day.hours) : "no listening"}`;
      if (day.hours) {
        const bar = el("div", "bar");
        bar.style.height = `${(day.hours / ceiling) * 100}%`;
        col.append(bar);
      }
      bars.append(col);
    });
    plot.append(bars);

    const months = el("div", "months");
    panel.days.forEach((day, i) => {
      if (i === 0 || day.date.endsWith("-01")) {
        const label = el("span", "", formatDate(day.date, { month: "short" }));
        label.style.left = `${(i / panel.days.length) * 100}%`;
        months.append(label);
      }
    });

    wrap.append(plot, months);
    return wrap;
  }));

  $("daily-note").textContent = key === "all"
    ? `This export is two stretches of listening, not five years of it. ` +
      `Only ${formatHours(outsideHours)} of music falls outside them, so a gap here means no data.`
    : "";

  renderTable($("daily-table"), ["Date", "Hours"],
    allDays.map((d) => [formatDate(d.date), d.hours.toFixed(2)]));
}

function renderRanked(list, items, valueOf, labelOf, subOf) {
  const max = Math.max(...items.map(valueOf));
  list.replaceChildren(...items.map((item) => {
    const li = el("li");
    const row = el("div", "row");
    row.append(el("span", "row-name", item.name), el("span", "row-value", labelOf(item)));
    li.append(row);
    if (subOf && subOf(item)) li.append(el("p", "row-sub", subOf(item)));
    const meter = el("div", "meter");
    meter.style.width = `${(valueOf(item) / max) * 100}%`;
    li.append(meter);
    return li;
  }));
}

function renderHeat(view) {
  const max = Math.max(...view.grid.flat());
  const cells = [];
  let peak = { hours: -1 };

  view.grid.forEach((row, d) => {
    cells.push(el("div", "heat-day", DAYS[d]));
    row.forEach((hours, h) => {
      const cell = el("div", "cell");
      cell.dataset.step = hours > 0 ? Math.ceil((hours / max) * 6) : 0;
      cell.dataset.tip = `${DAYS[d]} ${formatHour(h)}: ${hours ? formatHours(hours) : "none"}`;
      cells.push(cell);
      if (hours > peak.hours) peak = { d, h, hours };
    });
  });

  [0, 6, 12, 18].forEach((h) => {
    const label = el("div", "heat-hour", formatHour(h));
    label.style.gridColumn = `${h + 2} / span 6`;
    cells.push(label);
  });

  $("heat").replaceChildren(...cells);
  $("heat-peak").textContent =
    `Total listening by hour of the week, in local time. Busiest: ${DAYS[peak.d]} at ${formatHour(peak.h)}.`;

  const legend = [el("span", "", "Less")];
  for (let step = 1; step <= 6; step++) {
    const swatch = el("i");
    swatch.style.background = `var(--heat-${step})`;
    legend.push(swatch);
  }
  legend.push(el("span", "", `More (top slot: ${formatHours(max)} in total)`));
  $("heat-legend").replaceChildren(...legend);

  const hoursHead = Array.from({ length: 24 }, (_, h) => formatHour(h));
  renderTable($("heat-table"), ["Day", ...hoursHead],
    view.grid.map((row, d) => [DAYS[d], ...row.map((h) => h.toFixed(1))]));
}

function renderTable(host, headers, rows) {
  const table = el("table");
  const head = el("tr");
  headers.forEach((h) => head.append(el("th", "", h)));
  table.append(head);
  rows.forEach((row) => {
    const tr = el("tr");
    row.forEach((value) => tr.append(el("td", "", value)));
    table.append(tr);
  });
  host.replaceChildren(table);
}

function render(key) {
  const view = views[key];
  renderHero(view);
  renderTiles(view);
  renderDaily(view, key);

  const hoursLabel = (item) => formatHours(item.hours);
  const hoursOf = (item) => item.hours;
  renderRanked($("artists"), view.artists, hoursOf, hoursLabel);
  renderRanked($("albums"), view.albums, hoursOf, hoursLabel, (a) => a.artist);
  renderRanked($("songs"), view.songs, hoursOf, hoursLabel, (s) => s.artist);
  renderRanked($("genres"), view.genres, hoursOf, hoursLabel);

  renderHeat(view);
}

function setupTooltip() {
  const tip = $("tooltip");
  const place = (event) => {
    const x = Math.min(event.clientX + 12, innerWidth - tip.offsetWidth - 8);
    const y = Math.max(event.clientY - tip.offsetHeight - 10, 8);
    tip.style.left = `${Math.max(x, 8)}px`;
    tip.style.top = `${y}px`;
  };
  document.addEventListener("pointermove", (event) => {
    const target = event.target.closest?.("[data-tip]");
    tip.hidden = !target;
    if (target) {
      tip.textContent = target.dataset.tip;
      place(event);
    }
  });
}

setupTooltip();

render("2026");
