/* ── Layout constants ────────────────────────────────────────────── */
const WIDTH         = 960;
const PANEL_INNER_H = 200;
const X_LABEL_H     = 90;
const TITLE_H       = 28;
const PANEL_H       = TITLE_H + PANEL_INNER_H + X_LABEL_H;
const PANEL_GAP     = 24;
const MARGIN        = { top: 16, right: 160, bottom: 16, left: 80 };
const INNER_W       = WIDTH - MARGIN.left - MARGIN.right;

/* ── Ticket type ordering & labels ───────────────────────────────── */
const TICKET_ORDER     = ["round_trip", "two_one_ways", "one_way", "one_way_return"];
const GRR_TICKET_ORDER = ["md_grr_round_trip", "md_grr_one_way", "grr_one_way"];

const TYPE_LABEL = {
  round_trip:       "Round Trips (Jun 29 – Aug 28)",
  two_one_ways:     "Two One-Ways",
  one_way:          "One-Way Outbound (MD → Taipei, Jun 29)",
  one_way_return:   "One-Way Return (Taipei → MD, Aug 28)",
  grr_one_way:      "GRR → Taipei One-Way (Jun 29)",
  md_grr_one_way:   "MD → GRR One-Way (Jun 24)",
  md_grr_round_trip:"MD → GRR Round-Trip (Jun 24 – Jun 30)",
};

/* ── Origin colours ──────────────────────────────────────────────── */
const ORIGIN_COLOUR = d3.scaleOrdinal()
  .domain(["BWI", "DCA", "GRR", "IAD", "PHL"])
  .range(["#4c9be8", "#f4a94e", "#9b59b6", "#e06b8b", "#a3c97a"]);

/* ── Sample data (shown when data/flights.json is absent) ────────── */
const SAMPLE = [
  { ticket_type:"round_trip",       origin:"BWI", destination:"TPE", airline:"United",              stops:1, hub:"NRT", price_usd:980,  duration_outbound:"22h 00m", group:"tpe" },
  { ticket_type:"round_trip",       origin:"BWI", destination:"TPE", airline:"Korean Air",          stops:1, hub:"ICN", price_usd:940,  duration_outbound:"21h 30m", group:"tpe" },
  { ticket_type:"round_trip",       origin:"DCA", destination:"TPE", airline:"American",            stops:1, hub:"JFK", price_usd:1050, duration_outbound:"20h 15m", group:"tpe" },
  { ticket_type:"round_trip",       origin:"DCA", destination:"TPE", airline:"EVA Air",             stops:1, hub:"JFK", price_usd:995,  duration_outbound:"19h 50m", group:"tpe" },
  { ticket_type:"round_trip",       origin:"IAD", destination:"TPE", airline:"United",              stops:1, hub:"NRT", price_usd:960,  duration_outbound:"21h 45m", group:"tpe" },
  { ticket_type:"round_trip",       origin:"IAD", destination:"TPE", airline:"Cathay Pacific",      stops:1, hub:"HKG", price_usd:910,  duration_outbound:"23h 20m", group:"tpe" },
  { ticket_type:"round_trip",       origin:"PHL", destination:"TPE", airline:"Korean Air",          stops:1, hub:"ICN", price_usd:920,  duration_outbound:"21h 10m", group:"tpe" },
  { ticket_type:"round_trip",       origin:"PHL", destination:"TPE", airline:"ANA",                 stops:1, hub:"NRT", price_usd:975,  duration_outbound:"22h 30m", group:"tpe" },
  { ticket_type:"two_one_ways",     origin:"IAD", destination:"TPE", airline:"United + EVA Air",    stops:1, hub:"NRT", price_usd:890,  price_outbound:490, price_return:400, duration_outbound:"21h 45m", group:"tpe" },
  { ticket_type:"two_one_ways",     origin:"BWI", destination:"TPE", airline:"Korean Air + United", stops:1, hub:"ICN", price_usd:870,  price_outbound:460, price_return:410, duration_outbound:"21h 30m", group:"tpe" },
  { ticket_type:"two_one_ways",     origin:"PHL", destination:"TPE", airline:"ANA + Korean Air",    stops:1, hub:"NRT", price_usd:910,  price_outbound:500, price_return:410, duration_outbound:"22h 30m", group:"tpe" },
  { ticket_type:"two_one_ways",     origin:"DCA", destination:"TPE", airline:"EVA Air + United",    stops:1, hub:"JFK", price_usd:940,  price_outbound:520, price_return:420, duration_outbound:"19h 50m", group:"tpe" },
  { ticket_type:"one_way",          origin:"IAD", destination:"TPE", airline:"United",              stops:1, hub:"NRT", price_usd:510,  duration_outbound:"21h 45m", group:"tpe" },
  { ticket_type:"one_way",          origin:"PHL", destination:"TPE", airline:"Korean Air",          stops:1, hub:"ICN", price_usd:475,  duration_outbound:"21h 10m", group:"tpe" },
  { ticket_type:"one_way",          origin:"BWI", destination:"TPE", airline:"United",              stops:1, hub:"NRT", price_usd:490,  duration_outbound:"22h 00m", group:"tpe" },
  { ticket_type:"one_way",          origin:"DCA", destination:"TPE", airline:"EVA Air",             stops:1, hub:"JFK", price_usd:530,  duration_outbound:"19h 50m", group:"tpe" },
  { ticket_type:"one_way_return",   origin:"BWI", destination:"TPE", airline:"EVA Air",             stops:1, hub:"JFK", price_usd:420,  duration_outbound:"19h 50m", group:"tpe" },
  { ticket_type:"one_way_return",   origin:"IAD", destination:"TPE", airline:"United",              stops:1, hub:"NRT", price_usd:440,  duration_outbound:"21h 45m", group:"tpe" },
  { ticket_type:"grr_one_way",      origin:"GRR", destination:"TPE", airline:"United",              stops:2, hub:"ORD", price_usd:620,  duration_outbound:"26h 00m", group:"grr" },
  { ticket_type:"md_grr_one_way",   origin:"BWI", destination:"GRR", airline:"American",            stops:1, hub:"CLT", price_usd:180,  duration_outbound:"4h 30m",  group:"grr" },
  { ticket_type:"md_grr_one_way",   origin:"DCA", destination:"GRR", airline:"Delta",               stops:1, hub:"DTW", price_usd:165,  duration_outbound:"4h 00m",  group:"grr" },
  { ticket_type:"md_grr_one_way",   origin:"IAD", destination:"GRR", airline:"United",              stops:1, hub:"ORD", price_usd:195,  duration_outbound:"4h 45m",  group:"grr" },
  { ticket_type:"md_grr_round_trip",origin:"BWI", destination:"GRR", airline:"American",            stops:1, hub:"CLT", price_usd:320,  duration_outbound:"4h 30m",  group:"grr" },
  { ticket_type:"md_grr_round_trip",origin:"IAD", destination:"GRR", airline:"United",              stops:1, hub:"ORD", price_usd:290,  duration_outbound:"5h 15m",  group:"grr" },
  { ticket_type:"md_grr_round_trip",origin:"DCA", destination:"GRR", airline:"Delta",               stops:1, hub:"DTW", price_usd:310,  duration_outbound:"4h 00m",  group:"grr" },
];

/* ── Sparkline ───────────────────────────────────────────────────── */
function renderSparkline(container, history, typicalRange) {
  if (!history || history.length < 2) return;

  const W = 200, H = 48, PAD = 4;
  const svg = container.append("svg")
    .attr("width", W).attr("height", H)
    .style("display", "block").style("margin-top", "6px");

  const x = d3.scaleLinear()
    .domain(d3.extent(history, d => d[0]))
    .range([PAD, W - PAD]);

  const prices = history.map(d => d[1]).concat(typicalRange ?? []);
  const y = d3.scaleLinear()
    .domain([d3.min(prices) * 0.97, d3.max(prices) * 1.03])
    .range([H - PAD, PAD]);

  if (typicalRange?.length === 2) {
    svg.append("rect")
      .attr("x", PAD).attr("width", W - 2 * PAD)
      .attr("y", y(typicalRange[1]))
      .attr("height", Math.max(1, y(typicalRange[0]) - y(typicalRange[1])))
      .attr("fill", "rgba(116,192,252,0.15)");
  }

  svg.append("path")
    .datum(history)
    .attr("d", d3.line().x(d => x(d[0])).y(d => y(d[1])).curve(d3.curveMonotoneX))
    .attr("fill", "none")
    .attr("stroke", "#74c0fc")
    .attr("stroke-width", 1.5);

  const last = history[history.length - 1];
  svg.append("circle")
    .attr("cx", x(last[0])).attr("cy", y(last[1]))
    .attr("r", 3).attr("fill", "#74c0fc");
}

/* ── Tooltip ─────────────────────────────────────────────────────── */
const tooltip = d3.select("#tooltip");

function showTooltip(event, d) {
  const breakdown = d.ticket_type === "two_one_ways" && d.price_outbound != null
    ? `<div class="tt-sub">Out $${d.price_outbound.toLocaleString()} · Ret $${d.price_return.toLocaleString()}</div>`
    : "";
  const linkHint = d.google_flights_url
    ? `<div class="tt-link">↗ Click to open in Google Flights</div>` : "";
  const sparkLabel = d.price_history?.length > 1
    ? `<div class="tt-spark-label">Price history</div><div class="tt-sparkline"></div>` : "";
  const typicalLabel = d.typical_price_range?.length === 2
    ? `<div class="tt-sub">Typical $${d.typical_price_range[0].toLocaleString()}–$${d.typical_price_range[1].toLocaleString()}</div>` : "";

  tooltip.classed("visible", true).html(`
    <div class="tt-route">${d.origin} ↔ ${d.destination}</div>
    <div class="tt-airline">${d.airline}</div>
    <div class="tt-type">${TYPE_LABEL[d.ticket_type] ?? d.ticket_type}</div>
    <div class="tt-price">$${d.price_usd.toLocaleString()}</div>
    ${breakdown}
    ${d.stops != null ? `<div class="tt-meta">${d.stops === 0 ? "Nonstop" : `${d.stops} stop · via ${d.hub ?? "—"}`}</div>` : ""}
    ${d.duration_outbound ? `<div class="tt-meta">${d.duration_outbound}</div>` : ""}
    ${typicalLabel}
    ${sparkLabel}
    ${linkHint}
  `);

  if (d.price_history?.length > 1) {
    renderSparkline(tooltip.select(".tt-sparkline"), d.price_history, d.typical_price_range);
  }

  moveTooltip(event);
}

function moveTooltip(event) {
  tooltip.style("left", `${event.clientX + 14}px`).style("top", `${event.clientY + 14}px`);
}
function hideTooltip() { tooltip.classed("visible", false); }

/* ── Draw one panel ──────────────────────────────────────────────── */
function drawPanel(g, panelData, ticketType, yGlobal) {
  g.append("text")
    .attr("class", "panel-title")
    .attr("x", 0).attr("y", 0)
    .attr("dominant-baseline", "hanging")
    .text(TYPE_LABEL[ticketType] ?? ticketType);

  const chartG = g.append("g").attr("transform", `translate(0, ${TITLE_H})`);

  if (!panelData.length) {
    chartG.append("text").attr("class", "empty-msg")
      .attr("x", INNER_W / 2).attr("y", PANEL_INNER_H / 2)
      .text("No data for this ticket type.");
    return;
  }

  panelData.sort((a, b) => a.price_usd - b.price_usd);

  const x = d3.scaleBand()
    .domain(panelData.map((_, i) => i))
    .range([0, INNER_W])
    .padding(0.28);

  chartG.append("g").attr("class", "grid")
    .call(d3.axisLeft(yGlobal).tickSize(-INNER_W).tickFormat(""));

  chartG.append("g").attr("class", "axis axis--x")
    .attr("transform", `translate(0, ${PANEL_INNER_H})`)
    .call(
      d3.axisBottom(x).tickFormat(i => {
        const row = panelData[i];
        const airline = row.airline.split(" + ")[0].split(" ")[0];
        return `${row.origin} · ${airline}`;
      })
    )
    .selectAll("text")
    .attr("transform", "rotate(-38)")
    .attr("dx", "-0.5em").attr("dy", "0.4em")
    .style("text-anchor", "end");

  chartG.append("g").attr("class", "axis axis--y")
    .call(d3.axisLeft(yGlobal).tickFormat(d => `$${d.toLocaleString()}`).ticks(5));

  chartG.selectAll(".bar")
    .data(panelData)
    .join("rect")
    .attr("class", "bar")
    .attr("x", (_, i) => x(i))
    .attr("width", x.bandwidth())
    .attr("y", PANEL_INNER_H).attr("height", 0)
    .attr("fill", d => ORIGIN_COLOUR(d.origin))
    .attr("rx", 3)
    .on("mouseenter", showTooltip)
    .on("mousemove",  moveTooltip)
    .on("mouseleave", hideTooltip)
    .on("click", (_, d) => { if (d.google_flights_url) window.open(d.google_flights_url, "_blank"); })
    .transition().duration(550).ease(d3.easeCubicOut)
    .attr("y", d => yGlobal(d.price_usd))
    .attr("height", d => PANEL_INNER_H - yGlobal(d.price_usd));

  chartG.selectAll(".bar-label")
    .data(panelData)
    .join("text")
    .attr("class", "bar-label")
    .attr("x", (_, i) => x(i) + x.bandwidth() / 2)
    .attr("y", d => yGlobal(d.price_usd) - 4)
    .attr("text-anchor", "middle")
    .attr("font-size", 10)
    .attr("fill", "#343a40")
    .text(d => `$${d.price_usd.toLocaleString()}`);
}

/* ── Legend ──────────────────────────────────────────────────────── */
function drawLegend(svg, origins) {
  const lg = svg.append("g")
    .attr("transform", `translate(${WIDTH - MARGIN.right + 20}, ${MARGIN.top})`);

  lg.append("text")
    .attr("font-size", 11).attr("font-weight", 600)
    .attr("fill", "#495057").attr("y", 0)
    .text("Origin");

  origins.forEach((o, i) => {
    const row = lg.append("g").attr("transform", `translate(0, ${i * 22 + 16})`);
    row.append("rect").attr("width", 13).attr("height", 13).attr("rx", 3)
      .attr("fill", ORIGIN_COLOUR(o));
    row.append("text").attr("x", 18).attr("y", 10)
      .attr("font-size", 12).attr("fill", "#495057")
      .attr("dominant-baseline", "middle").text(o);
  });
}

/* ── Build a chart section ───────────────────────────────────────── */
function buildChart(data, containerId, ticketTypes) {
  d3.select(`#${containerId}`).selectAll("*").remove();

  const numPanels = ticketTypes.length;
  const svgHeight = MARGIN.top + numPanels * PANEL_H + Math.max(0, numPanels - 1) * PANEL_GAP + MARGIN.bottom;

  const svg = d3.select(`#${containerId}`).append("svg")
    .attr("width", WIDTH).attr("height", svgHeight);

  const yGlobal = d3.scaleLinear()
    .domain([0, (d3.max(data, d => d.price_usd) ?? 0) * 1.15 || 2000])
    .nice()
    .range([PANEL_INNER_H, 0]);

  ticketTypes.forEach((type, idx) => {
    const panelData = data.filter(d => d.ticket_type === type);
    const yOffset   = MARGIN.top + idx * (PANEL_H + PANEL_GAP);
    const g = svg.append("g").attr("transform", `translate(${MARGIN.left}, ${yOffset})`);

    g.append("rect")
      .attr("x", -8).attr("y", -6)
      .attr("width", INNER_W + 16).attr("height", PANEL_H + 4)
      .attr("fill", "#f8f9fa").attr("rx", 6).attr("stroke", "#dee2e6");

    drawPanel(g, panelData, type, yGlobal);
  });

  drawLegend(svg, [...new Set(data.map(d => d.origin))].sort());
}

/* ── Filters ─────────────────────────────────────────────────────── */
function applyFilters(tpeData, grrData) {
  const origin = d3.select("#originSelect").property("value");
  const maxPx  = +d3.select("#maxPrice").property("value") || Infinity;
  const keep   = d => (origin === "all" || d.origin === origin) && d.price_usd <= maxPx;
  buildChart(tpeData.filter(keep), "vis",     TICKET_ORDER);
  buildChart(grrData.filter(keep), "vis-grr", GRR_TICKET_ORDER);
}

function populateSelect(id, values) {
  const sel = d3.select(`#${id}`);
  sel.append("option").attr("value", "all").text("All");
  values.forEach(v => sel.append("option").attr("value", v).text(v));
}

/* ── Bootstrap ───────────────────────────────────────────────────── */
function bootstrap(data) {
  const tpeData = data.filter(d => !d.group || d.group === "tpe");
  const grrData = data.filter(d => d.group === "grr");

  const allOrigins = [...new Set(data.map(d => d.origin))].sort();
  populateSelect("originSelect", allOrigins);

  buildChart(tpeData, "vis",     TICKET_ORDER);
  buildChart(grrData, "vis-grr", GRR_TICKET_ORDER);

  d3.select("#originSelect").on("change", () => applyFilters(tpeData, grrData));
  d3.select("#maxPrice").on("input",      () => applyFilters(tpeData, grrData));
  d3.select("#resetBtn").on("click", () => {
    d3.select("#originSelect").property("value", "all");
    d3.select("#maxPrice").property("value", "");
    buildChart(tpeData, "vis",     TICKET_ORDER);
    buildChart(grrData, "vis-grr", GRR_TICKET_ORDER);
  });
}

d3.json("data/flights.json")
  .then(bootstrap)
  .catch(err => {
    console.warn("Could not load data/flights.json — using sample data.", err);
    bootstrap(SAMPLE);
  });
