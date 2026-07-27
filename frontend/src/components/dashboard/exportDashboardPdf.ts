import { jsPDF } from "jspdf";

import type {
  CountryGeneration,
  GenerationHistoryApiPoint,
  GenerationHistoryPoint,
  HistoryPeriod,
} from "@/types/contract";

import {
  aggregateSources,
  formatCompactMw,
  formatMw,
  getSourcePercentages,
  parseHistoryPoints,
} from "./dashboardUtils";
import { pdfColors } from "./pdfColors";

type HistoryByPeriod = Record<HistoryPeriod, GenerationHistoryApiPoint[]>;

export interface DashboardPdfInput {
  data: CountryGeneration;
  countryName: string;
  selectedIso: string;
  updatedAt: string;
  generatedAt: string;
  historyByPeriod: HistoryByPeriod;
}

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 14;
const CONTENT_W = PAGE_W - MARGIN * 2;
const SECTION_GAP = 12;
/** Original history chart card height. */
const HISTORY_CHART_H = 78;
const HISTORY_TITLE_H = 16;
/** Space between the section title and the first chart. */
const HISTORY_TITLE_TO_CHART = 12;
/** Extra gap between the two charts on a history page. */
const HISTORY_CHART_GAP = 18;

function rgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

function periodTitle(period: HistoryPeriod): string {
  if (period === "week") {
    return "Week";
  }
  if (period === "month") {
    return "Month";
  }
  return "Year";
}

/**
 * Builds a vector PDF report (text + drawn charts). No screenshots.
 */
export function downloadDashboardPdf(input: DashboardPdfInput): void {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const builder = new PdfReportBuilder(pdf);
  builder.drawReport(input);

  const safeName = input.countryName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  pdf.save(
    `${input.selectedIso.toLowerCase()}-${safeName || "country"}-dashboard.pdf`
  );
}

class PdfReportBuilder {
  private readonly pdf: jsPDF;
  private y = MARGIN;

  constructor(pdf: jsPDF) {
    this.pdf = pdf;
    this.fillPageBackground();
  }

  drawReport(input: DashboardPdfInput) {
    const { windMw, solarMw } = aggregateSources(input.data.bySource);
    const totalRenewable = windMw + solarMw;
    const shareOfTotal =
      input.data.total > 0
        ? ((totalRenewable / input.data.total) * 100).toFixed(1)
        : "—";
    const { windPct, solarPct } = getSourcePercentages(windMw, solarMw);

    this.drawHeader(input);

    this.drawSectionTitle("Key metrics", 40);
    this.drawKpiRow({
      totalRenewable,
      windMw,
      solarMw,
      shareOfTotal,
      totalMw: input.data.total,
    });
    this.y += SECTION_GAP;

    const mixH = 88;
    this.drawSectionTitle("Capacity mix", mixH + SECTION_GAP);
    const chartTop = this.y;
    this.drawPieChart(MARGIN, chartTop, 88, mixH, windMw, solarMw);
    this.drawBarChart(MARGIN + 98, chartTop, 84, mixH, windMw, solarMw);
    this.y = chartTop + mixH + SECTION_GAP;

    this.drawSectionTitle("Investment snapshot", 44);
    this.drawInvestmentTable(
      windMw,
      solarMw,
      windPct,
      solarPct,
      totalRenewable
    );

    for (const period of ["week", "month", "year"] as HistoryPeriod[]) {
      const points = parseHistoryPoints(input.historyByPeriod[period], period);

      if (points.length === 0) {
        this.beginHistoryPage(20);
        this.drawSectionTitle(
          `Production history — ${periodTitle(period)}`
        );
        this.pdf.setFont("helvetica", "normal");
        this.pdf.setFontSize(10);
        this.setText(pdfColors.muted);
        this.pdf.text(
          "No history data available for this period.",
          MARGIN,
          this.y + 6
        );
        this.y += 20;
        continue;
      }

      this.drawHistoryCharts(period, points);
    }

    this.drawFooter(input);
  }

  /**
   * One history period per page: fixed-size charts with a centered section
   * title near the top and comfortable spacing above/between charts.
   */
  private drawHistoryCharts(
    period: HistoryPeriod,
    points: GenerationHistoryPoint[]
  ) {
    const periodLabel = periodTitle(period);
    const blockH =
      HISTORY_TITLE_H +
      HISTORY_TITLE_TO_CHART +
      HISTORY_CHART_H +
      HISTORY_CHART_GAP +
      HISTORY_CHART_H;
    this.beginHistoryPage(blockH);

    this.pdf.setFont("helvetica", "bold");
    this.pdf.setFontSize(14);
    this.setText(pdfColors.forest);
    this.pdf.text(
      `PRODUCTION HISTORY — ${periodLabel.toUpperCase()}`,
      PAGE_W / 2,
      this.y + 6,
      { align: "center" }
    );
    this.y += HISTORY_TITLE_H + HISTORY_TITLE_TO_CHART;

    this.drawLineChart({
      x: MARGIN,
      y: this.y,
      width: CONTENT_W,
      height: HISTORY_CHART_H,
      title: `Solar and wind production — ${periodLabel}`,
      points,
      series: [
        { key: "windMw", color: pdfColors.wind, label: "Wind" },
        { key: "solarMw", color: pdfColors.solar, label: "Solar" },
      ],
    });
    this.y += HISTORY_CHART_H + HISTORY_CHART_GAP;

    this.drawLineChart({
      x: MARGIN,
      y: this.y,
      width: CONTENT_W,
      height: HISTORY_CHART_H,
      title: `Total energy production — ${periodLabel}`,
      points,
      series: [{ key: "total", color: pdfColors.forest, label: "Total" }],
      fillUnder: true,
    });
    this.y += HISTORY_CHART_H;
  }

  /** Fresh page; keep the history block upper-centered (more top air than bottom). */
  private beginHistoryPage(blockH: number) {
    this.pdf.addPage();
    this.fillPageBackground();
    const usable = PAGE_H - MARGIN * 2;
    const leftover = Math.max(0, usable - blockH);
    // Bias upward: ~35% of leftover above, rest below.
    this.y = MARGIN + leftover * 0.35;
  }

  private fillPageBackground() {
    const [r, g, b] = rgb(pdfColors.pageBg);
    this.pdf.setFillColor(r, g, b);
    this.pdf.rect(0, 0, PAGE_W, PAGE_H, "F");
  }

  private ensureSpace(neededMm: number) {
    if (this.y + neededMm <= PAGE_H - MARGIN) {
      return;
    }
    this.pdf.addPage();
    this.fillPageBackground();
    this.y = MARGIN;
  }

  private setFill(hex: string) {
    const [r, g, b] = rgb(hex);
    this.pdf.setFillColor(r, g, b);
  }

  private setDraw(hex: string) {
    const [r, g, b] = rgb(hex);
    this.pdf.setDrawColor(r, g, b);
  }

  private setText(hex: string) {
    const [r, g, b] = rgb(hex);
    this.pdf.setTextColor(r, g, b);
  }

  private drawCard(x: number, y: number, w: number, h: number) {
    this.setFill(pdfColors.surface);
    this.setDraw(pdfColors.border);
    this.pdf.setLineWidth(0.3);
    this.pdf.roundedRect(x, y, w, h, 2.5, 2.5, "FD");
  }

  private drawHeader(input: DashboardPdfInput) {
    this.ensureSpace(36);
    this.drawCard(MARGIN, this.y, CONTENT_W, 32);

    this.pdf.setFont("helvetica", "bold");
    this.pdf.setFontSize(9);
    this.setText(pdfColors.forest);
    this.pdf.text("GREEN ENERGY MONITOR", MARGIN + 5, this.y + 8);

    this.pdf.setFontSize(18);
    this.setText(pdfColors.ink);
    this.pdf.text(input.countryName, MARGIN + 5, this.y + 17);

    this.pdf.setFont("helvetica", "normal");
    this.pdf.setFontSize(9);
    this.setText(pdfColors.slate);
    this.pdf.text(
      `Country dashboard  ·  Solar & wind snapshot  ·  ISO ${input.selectedIso}`,
      MARGIN + 5,
      this.y + 24
    );

    this.pdf.setFont("helvetica", "bold");
    this.pdf.setFontSize(7);
    this.setText(pdfColors.muted);
    this.pdf.text("DATA UPDATED", PAGE_W - MARGIN - 5, this.y + 9, {
      align: "right",
    });
    this.pdf.setFont("helvetica", "normal");
    this.pdf.setFontSize(9);
    this.setText(pdfColors.ink);
    this.pdf.text(input.updatedAt, PAGE_W - MARGIN - 5, this.y + 14, {
      align: "right",
    });

    this.pdf.setFont("helvetica", "bold");
    this.pdf.setFontSize(7);
    this.setText(pdfColors.muted);
    this.pdf.text("REPORT GENERATED", PAGE_W - MARGIN - 5, this.y + 21, {
      align: "right",
    });
    this.pdf.setFont("helvetica", "normal");
    this.pdf.setFontSize(9);
    this.setText(pdfColors.ink);
    this.pdf.text(input.generatedAt, PAGE_W - MARGIN - 5, this.y + 26, {
      align: "right",
    });

    this.y += 38;
  }

  /** @param keepWithMm Extra space to reserve below the title (avoids orphan titles). */
  private drawSectionTitle(title: string, keepWithMm = 0) {
    this.ensureSpace(12 + keepWithMm);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setFontSize(10);
    this.setText(pdfColors.forest);
    this.pdf.text(title.toUpperCase(), MARGIN, this.y + 5);
    this.y += 10;
  }

  private drawKpiRow(values: {
    totalRenewable: number;
    windMw: number;
    solarMw: number;
    shareOfTotal: string;
    totalMw: number;
  }) {
    this.ensureSpace(40);
    const gap = 3;
    const heroW = 58;
    const otherW = (CONTENT_W - heroW - gap * 3) / 3;
    const h = 36;
    const y = this.y;

    // Hero
    this.setFill(pdfColors.heroFrom);
    this.pdf.roundedRect(MARGIN, y, heroW, h, 2.5, 2.5, "F");
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setFontSize(7);
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.text("WIND + SOLAR TOTAL", MARGIN + 3.5, y + 9);
    this.pdf.setFontSize(15);
    this.pdf.text(
      `${formatMw(values.totalRenewable)} MW`,
      MARGIN + 3.5,
      y + 19
    );
    this.pdf.setFont("helvetica", "normal");
    this.pdf.setFontSize(7);
    this.pdf.text("Combined renewable capacity", MARGIN + 3.5, y + 27);

    const cards = [
      {
        label: "WIND CAPACITY",
        value: `${formatMw(values.windMw)} MW`,
        sub: "Onshore + offshore",
      },
      {
        label: "SOLAR CAPACITY",
        value: `${formatMw(values.solarMw)} MW`,
        sub: "Photovoltaic",
      },
      {
        label: "SHARE OF OUTPUT",
        value: `${values.shareOfTotal}%`,
        sub: `of ${formatMw(values.totalMw)} MW total`,
      },
    ];

    cards.forEach((card, index) => {
      const x = MARGIN + heroW + gap + index * (otherW + gap);
      this.drawCard(x, y, otherW, h);
      this.pdf.setFont("helvetica", "bold");
      this.pdf.setFontSize(6.5);
      this.setText(pdfColors.muted);
      this.pdf.text(card.label, x + 3, y + 9);
      this.pdf.setFontSize(13);
      this.setText(pdfColors.ink);
      this.pdf.text(card.value, x + 3, y + 19);
      this.pdf.setFont("helvetica", "normal");
      this.pdf.setFontSize(7);
      this.setText(pdfColors.muted);
      this.pdf.text(card.sub, x + 3, y + 27);
    });

    this.y += 40;
  }

  private drawPieChart(
    x: number,
    y: number,
    w: number,
    h: number,
    windMw: number,
    solarMw: number
  ) {
    this.drawCard(x, y, w, h);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setFontSize(9);
    this.setText(pdfColors.ink);
    this.pdf.text("Solar vs wind mix", x + 4, y + 7);

    this.drawLegend(x + 4, y + 11, [
      { label: "Wind", color: pdfColors.wind },
      { label: "Solar", color: pdfColors.solar },
    ]);

    const total = windMw + solarMw;
    // Match site PieChart layout: pie left-of-center, callouts on the right.
    const cx = x + w * 0.4;
    const cy = y + h * 0.58;
    const radius = Math.min(26, h * 0.28);

    if (total <= 0) {
      this.pdf.setFont("helvetica", "normal");
      this.pdf.setFontSize(9);
      this.setText(pdfColors.muted);
      this.pdf.text("No capacity data.", x + 4, y + 40);
      return;
    }

    const slices = [
      { value: windMw, color: pdfColors.wind, label: "Wind" },
      { value: solarMw, color: pdfColors.solar, label: "Solar" },
    ].filter((slice) => slice.value > 0);

    // Same as Recharts Pie defaults: startAngle 0 (3 o'clock), CCW.
    const padding = (2 * Math.PI) / 180;
    let angle = 0;

    for (const slice of slices) {
      const sweep = (slice.value / total) * Math.PI * 2;
      const start = angle + padding / 2;
      const end = angle + sweep - padding / 2;
      if (end > start) {
        this.drawPieSlice(cx, cy, radius, start, end, slice.color);
      }

      this.drawPieSliceLabel({
        cx,
        cy,
        radius,
        midAngle: angle + sweep / 2,
        label: slice.label,
        valueMw: slice.value,
        percent: slice.value / total,
        cardRight: x + w - 2.5,
        cardTop: y + 16,
        cardBottom: y + h - 3,
      });
      angle += sweep;
    }
  }

  /**
   * Recharts `polarToCartesian`: angle 0 at 3 o'clock, increasing CCW,
   * with y growing downward (same as PDF).
   */
  private polar(cx: number, cy: number, radius: number, angleRad: number) {
    return {
      x: cx + Math.cos(-angleRad) * radius,
      y: cy + Math.sin(-angleRad) * radius,
    };
  }

  private drawPieSlice(
    cx: number,
    cy: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    color: string
  ) {
    const steps = Math.max(
      24,
      Math.ceil(((endAngle - startAngle) * 64) / Math.PI)
    );
    const points: Array<{ x: number; y: number }> = [{ x: cx, y: cy }];
    for (let i = 0; i <= steps; i += 1) {
      const t = startAngle + ((endAngle - startAngle) * i) / steps;
      points.push(this.polar(cx, cy, radius, t));
    }
    this.fillClosedPolygon(points, color);
  }

  /** Solid filled polygon — avoids the radial-line look of triangle fans. */
  private fillClosedPolygon(
    points: Array<{ x: number; y: number }>,
    color: string
  ) {
    if (points.length < 3) {
      return;
    }
    this.setFill(color);
    const start = points[0];
    const deltas: number[][] = [];
    for (let i = 1; i < points.length; i += 1) {
      deltas.push([
        points[i].x - points[i - 1].x,
        points[i].y - points[i - 1].y,
      ]);
    }
    this.pdf.lines(deltas, start.x, start.y, [1, 1], "F", true);
  }

  private drawPieSliceLabel(options: {
    cx: number;
    cy: number;
    radius: number;
    midAngle: number;
    label: string;
    valueMw: number;
    percent: number;
    cardRight: number;
    cardTop: number;
    cardBottom: number;
  }) {
    const {
      cx,
      cy,
      radius,
      midAngle,
      label,
      valueMw,
      percent,
      cardRight,
      cardTop,
      cardBottom,
    } = options;
    if (percent < 0.04) {
      return;
    }

    const pctText = `${Math.round(percent * 100)}%`;
    const valueText = `${formatCompactMw(valueMw)} MW`;
    // Same trig as SolarWindPieChart / Recharts label helper.
    const cos = Math.cos(-midAngle);

    // Large slices: white labels inside (same hierarchy as the site).
    if (percent >= 0.15) {
      const inner = this.polar(cx, cy, radius * 0.55, midAngle);
      this.pdf.setFont("helvetica", "bold");
      this.pdf.setFontSize(6.5);
      this.pdf.setTextColor(255, 255, 255);
      this.pdf.text(label, inner.x, inner.y - 2.4, { align: "center" });
      this.pdf.setFontSize(8.5);
      this.pdf.text(valueText, inner.x, inner.y + 1.4, { align: "center" });
      this.pdf.setFont("helvetica", "normal");
      this.pdf.setFontSize(6.5);
      this.pdf.setTextColor(255, 255, 255);
      this.pdf.text(pctText, inner.x, inner.y + 5, { align: "center" });
      return;
    }

    // Small slices: elbow leader + callout to the right (site layout).
    const edge = this.polar(cx, cy, radius, midAngle);
    const bend = this.polar(cx, cy, radius + 5, midAngle);
    const placeRight = cos >= 0;
    const endX = placeRight
      ? Math.min(cardRight - 17, Math.max(bend.x + 7, cx + radius + 9))
      : Math.max(cx - radius - 20, bend.x - 7);
    const endY = Math.min(cardBottom - 5, Math.max(cardTop + 6, bend.y));

    this.setDraw(pdfColors.muted);
    this.pdf.setLineWidth(0.4);
    this.pdf.line(edge.x, edge.y, bend.x, bend.y);
    this.pdf.line(bend.x, bend.y, endX, endY);
    this.setFill(pdfColors.muted);
    this.pdf.circle(endX, endY, 0.55, "F");

    const textAnchor = placeRight ? "left" : "right";
    const textX = endX + (placeRight ? 1.8 : -1.8);

    this.pdf.setFont("helvetica", "bold");
    this.pdf.setFontSize(7);
    this.setText(pdfColors.ink);
    this.pdf.text(label, textX, endY - 1.3, { align: textAnchor });
    this.pdf.setFont("helvetica", "normal");
    this.pdf.setFontSize(6.5);
    this.setText(pdfColors.muted);
    this.pdf.text(`${valueText} · ${pctText}`, textX, endY + 2.3, {
      align: textAnchor,
    });
  }

  private drawBarChart(
    x: number,
    y: number,
    w: number,
    h: number,
    windMw: number,
    solarMw: number
  ) {
    this.drawCard(x, y, w, h);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setFontSize(9);
    this.setText(pdfColors.ink);
    this.pdf.text("Capacity by source (MW)", x + 4, y + 7);

    this.drawLegend(x + 4, y + 11, [
      { label: "Wind", color: pdfColors.wind },
      { label: "Solar", color: pdfColors.solar },
    ]);

    const plotX = x + 12;
    const plotY = y + 22;
    const plotW = w - 20;
    const plotH = h - 36;
    const maxValue = Math.max(windMw, solarMw, 1);
    const bars = [
      { label: "Wind", value: windMw, color: pdfColors.wind },
      { label: "Solar", value: solarMw, color: pdfColors.solar },
    ];
    const barW = 18;
    const gap = (plotW - barW * bars.length) / (bars.length + 1);

    // Grid lines
    this.setDraw(pdfColors.track);
    this.pdf.setLineWidth(0.2);
    for (let i = 0; i <= 4; i += 1) {
      const gy = plotY + plotH - (plotH * i) / 4;
      this.pdf.line(plotX, gy, plotX + plotW, gy);
      this.pdf.setFont("helvetica", "normal");
      this.pdf.setFontSize(6.5);
      this.setText(pdfColors.muted);
      this.pdf.text(formatCompactMw((maxValue * i) / 4), plotX - 1, gy + 1.2, {
        align: "right",
      });
    }

    bars.forEach((bar, index) => {
      const bx = plotX + gap + index * (barW + gap);
      const bh = (bar.value / maxValue) * plotH;
      const by = plotY + plotH - bh;
      this.setFill(bar.color);
      this.pdf.roundedRect(bx, by, barW, Math.max(bh, 0.4), 1, 1, "F");

      this.pdf.setFont("helvetica", "bold");
      this.pdf.setFontSize(7);
      this.setText(pdfColors.ink);
      this.pdf.text(formatMw(bar.value), bx + barW / 2, by - 1.5, {
        align: "center",
      });

      this.pdf.setFont("helvetica", "normal");
      this.pdf.setFontSize(7.5);
      this.setText(pdfColors.slate);
      this.pdf.text(bar.label, bx + barW / 2, plotY + plotH + 5, {
        align: "center",
      });
    });
  }

  private drawLegend(
    x: number,
    y: number,
    items: Array<{ label: string; color: string }>
  ) {
    let cursor = x;
    items.forEach((item) => {
      // Squared swatches match .dashboard-chart-legend-dot on the site.
      this.setFill(item.color);
      this.pdf.roundedRect(cursor, y - 2.2, 2.4, 2.4, 0.4, 0.4, "F");
      this.pdf.setFont("helvetica", "bold");
      this.pdf.setFontSize(7);
      this.setText(pdfColors.slate);
      this.pdf.text(item.label, cursor + 4, y);
      cursor += this.pdf.getTextWidth(item.label) + 10;
    });
  }

  private drawInvestmentTable(
    windMw: number,
    solarMw: number,
    windPct: number,
    solarPct: number,
    totalRenewable: number
  ) {
    this.ensureSpace(48);
    const rowH = 10;
    const y0 = this.y;
    const cols = [MARGIN, MARGIN + 92, MARGIN + 140];
    const rows = [
      ["Source", "Capacity (MW)", "Share of wind + solar"],
      ["Wind (onshore + offshore)", formatMw(windMw), `${windPct}%`],
      ["Solar (photovoltaic)", formatMw(solarMw), `${solarPct}%`],
      ["Total", formatMw(totalRenewable), "100%"],
    ];

    rows.forEach((row, rowIndex) => {
      const ry = y0 + rowIndex * rowH;
      if (rowIndex === 0) {
        this.setFill(pdfColors.forestSoft);
      } else if (rowIndex % 2 === 0) {
        this.setFill("#f7faf7");
      } else {
        this.setFill(pdfColors.surface);
      }
      this.pdf.rect(MARGIN, ry, CONTENT_W, rowH, "F");
      this.setDraw(pdfColors.border);
      this.pdf.setLineWidth(0.2);
      this.pdf.rect(MARGIN, ry, CONTENT_W, rowH, "S");

      this.pdf.setFont(
        "helvetica",
        rowIndex === 0 || rowIndex === 3 ? "bold" : "normal"
      );
      this.pdf.setFontSize(8.5);
      this.setText(rowIndex === 0 ? pdfColors.forest : pdfColors.ink);
      row.forEach((cell, colIndex) => {
        this.pdf.text(cell, cols[colIndex] + 2, ry + 6.5);
      });
    });

    this.y += rows.length * rowH + SECTION_GAP;
  }

  private drawLineChart(options: {
    x: number;
    y: number;
    width: number;
    height: number;
    title: string;
    points: GenerationHistoryPoint[];
    series: Array<{
      key: "windMw" | "solarMw" | "total";
      color: string;
      label: string;
    }>;
    fillUnder?: boolean;
  }) {
    const { x, y, width, height, title, points, series, fillUnder } = options;
    this.drawCard(x, y, width, height);

    this.pdf.setFont("helvetica", "bold");
    this.pdf.setFontSize(11);
    this.setText(pdfColors.ink);
    this.pdf.text(title, x + width / 2, y + 8, { align: "center" });

    const legendItems = series.map((item) => ({
      label: item.label,
      color: item.color,
    }));
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setFontSize(7);
    let legendWidth = 0;
    legendItems.forEach((item, index) => {
      legendWidth += 2.4 + 1.6 + this.pdf.getTextWidth(item.label);
      if (index < legendItems.length - 1) {
        legendWidth += 6;
      }
    });
    this.drawLegend(x + (width - legendWidth) / 2, y + 14, legendItems);

    // Extra air between title/legend and the plot.
    const plotX = x + 14;
    const plotY = y + 24;
    const plotW = width - 22;
    const plotH = height - 36;

    const values = points.flatMap((point) =>
      series.map((item) => Number(point[item.key] ?? 0))
    );
    const maxValue = Math.max(...values, 1);

    // Grid + Y labels
    this.setDraw(pdfColors.track);
    this.pdf.setLineWidth(0.2);
    for (let i = 0; i <= 4; i += 1) {
      const gy = plotY + plotH - (plotH * i) / 4;
      this.pdf.line(plotX, gy, plotX + plotW, gy);
      this.pdf.setFont("helvetica", "normal");
      this.pdf.setFontSize(6.5);
      this.setText(pdfColors.muted);
      this.pdf.text(
        formatCompactMw((maxValue * i) / 4),
        plotX - 1.5,
        gy + 1.2,
        { align: "right" }
      );
    }

    const n = points.length;
    const xAt = (index: number) =>
      n <= 1 ? plotX + plotW / 2 : plotX + (plotW * index) / (n - 1);
    const yAt = (value: number) =>
      plotY + plotH - (Math.max(value, 0) / maxValue) * plotH;

    for (const item of series) {
      const coords = points.map((point, index) => ({
        x: xAt(index),
        y: yAt(Number(point[item.key] ?? 0)),
      }));

      if (fillUnder && coords.length > 1) {
        // Light solid under-fill (vector), without raster opacity tricks.
        this.setFill("#cfe3d2");
        for (let i = 0; i < coords.length - 1; i += 1) {
          this.pdf.triangle(
            coords[i].x,
            coords[i].y,
            coords[i + 1].x,
            coords[i + 1].y,
            coords[i + 1].x,
            plotY + plotH,
            "F"
          );
          this.pdf.triangle(
            coords[i].x,
            coords[i].y,
            coords[i + 1].x,
            plotY + plotH,
            coords[i].x,
            plotY + plotH,
            "F"
          );
        }
      }

      this.setDraw(item.color);
      this.pdf.setLineWidth(0.7);
      for (let i = 0; i < coords.length - 1; i += 1) {
        this.pdf.line(
          coords[i].x,
          coords[i].y,
          coords[i + 1].x,
          coords[i + 1].y
        );
      }

      // Vertex markers
      this.setFill(item.color);
      coords.forEach((point) => {
        this.pdf.circle(point.x, point.y, 0.7, "F");
      });
    }

    // X labels (sparse)
    this.pdf.setFont("helvetica", "normal");
    this.pdf.setFontSize(6);
    this.setText(pdfColors.muted);
    const labelStep = Math.max(1, Math.ceil(n / 7));
    points.forEach((point, index) => {
      if (index % labelStep !== 0 && index !== n - 1) {
        return;
      }
      this.pdf.text(point.label, xAt(index), plotY + plotH + 4, {
        align: "center",
      });
    });
  }

  private drawFooter(input: DashboardPdfInput) {
    const footerGap = 12;
    const footerH = 12;
    this.ensureSpace(footerGap + footerH + 2);
    this.y += footerGap;
    this.drawCard(MARGIN, this.y, CONTENT_W, footerH);
    this.pdf.setFont("helvetica", "normal");
    this.pdf.setFontSize(7);
    this.setText(pdfColors.muted);
    this.pdf.text(
      `Green Energy Monitor · ${input.countryName} (${input.selectedIso}) · Energy-Charts.info (CC BY 4.0)`,
      MARGIN + 4,
      this.y + 7
    );
    this.pdf.text(
      "Authenticated user report",
      PAGE_W - MARGIN - 4,
      this.y + 7,
      {
        align: "right",
      }
    );
    this.y += footerH + 2;
  }
}
