import { jsPDF } from "jspdf";
import { LOGO_BASE64 } from "./logoBase64";

interface ReportData {
  clientName: string;
  month: string;
  totalScans: number;
  totalReviews: number;
  avgRating: string | number;
  completionRate: number;
  scanTraffic: { month: string; scans: number }[];
  comment?: string;
}

const MONTH_LABELS: Record<string, string> = {
  "01": "Janvier", "02": "Février", "03": "Mars", "04": "Avril",
  "05": "Mai", "06": "Juin", "07": "Juillet", "08": "Août",
  "09": "Septembre", "10": "Octobre", "11": "Novembre", "12": "Décembre",
};

function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  return `${MONTH_LABELS[m] ?? m} ${year}`;
}

export function generateMonthlyPDF(data: ReportData): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const margin = 20;
  const contentW = pageW - margin * 2;

  // ─── Header background ────────────────────────────────────────────────────
  doc.setFillColor(26, 58, 107); // #1a3a6b
  doc.rect(0, 0, pageW, 45, "F");

  // ─── Header : texte gauche + logo droite ──────────────────────────────────
  // Titre en haut à gauche (gras)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Rapport mensuel de performance", margin, 16);

  // Nom du client
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`${data.clientName}  —  ${formatMonth(data.month)}`, margin, 25);

  // Date de génération
  doc.setTextColor(192, 207, 232);
  doc.setFontSize(8);
  doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, margin, 33);

  // Logo Visigold — à droite, fond blanc arrondi
  const logoW = 48;
  const logoH = 16;
  const logoX = pageW - margin - logoW;
  const logoY = 5;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(logoX - 3, logoY - 2, logoW + 6, logoH + 4, 2, 2, "F");
  try {
    doc.addImage(LOGO_BASE64, "PNG", logoX, logoY, logoW, logoH);
  } catch {
    doc.setTextColor(26, 58, 107);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("VISIGOLD", logoX + 4, logoY + 11);
  }

  // ─── Generated date ───────────────────────────────────────────────────────
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(8);
  doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, pageW - margin, 39, { align: "right" });

  // ─── KPI Cards ────────────────────────────────────────────────────────────
  const kpis = [
    { label: "Scans QR code", value: String(data.totalScans), color: [26, 58, 107] as [number, number, number] },
    { label: "Avis Google générés", value: String(data.totalReviews), color: [242, 101, 34] as [number, number, number] },
    { label: "Note moyenne", value: `${data.avgRating} ★`, color: [34, 197, 94] as [number, number, number] },
    { label: "Taux complétion quiz", value: `${data.completionRate}%`, color: [168, 85, 247] as [number, number, number] },
  ];

  const cardW = (contentW - 15) / 4;
  const cardY = 55;

  kpis.forEach((kpi, i) => {
    const x = margin + i * (cardW + 5);
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(x, cardY, cardW, 28, 3, 3, "F");
    doc.setDrawColor(230, 230, 230);
    doc.roundedRect(x, cardY, cardW, 28, 3, 3, "S");

    doc.setFillColor(...kpi.color);
    doc.roundedRect(x, cardY, cardW, 3, 1, 1, "F");

    doc.setTextColor(...kpi.color);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(kpi.value, x + cardW / 2, cardY + 16, { align: "center" });

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(kpi.label, x + cardW / 2, cardY + 23, { align: "center" });
  });

  // ─── Scan Traffic Chart (simple bar chart) ────────────────────────────────
  const chartY = 95;
  doc.setTextColor(26, 58, 107);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Trafic de scans mensuel", margin, chartY);

  if (data.scanTraffic.length > 0) {
    const chartH = 40;
    const chartAreaY = chartY + 5;
    const maxScans = Math.max(...data.scanTraffic.map((d) => d.scans), 1);
    const barW = Math.min(contentW / data.scanTraffic.length - 4, 20);

    data.scanTraffic.forEach((d, i) => {
      const barH = (d.scans / maxScans) * chartH;
      const x = margin + i * (barW + 4);
      const y = chartAreaY + chartH - barH;

      doc.setFillColor(26, 58, 107);
      doc.rect(x, y, barW, barH, "F");

      doc.setTextColor(80, 80, 80);
      doc.setFontSize(6);
      doc.text(d.month.slice(5), x + barW / 2, chartAreaY + chartH + 5, { align: "center" });

      if (d.scans > 0) {
        doc.setTextColor(26, 58, 107);
        doc.setFontSize(6);
        doc.setFont("helvetica", "bold");
        doc.text(String(d.scans), x + barW / 2, y - 1, { align: "center" });
      }
    });
  } else {
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Aucune donnée de scan pour cette période.", margin, chartY + 20);
  }

  // ─── Summary section ──────────────────────────────────────────────────────
  const summaryY = 155;
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(margin, summaryY, contentW, 50, 3, 3, "F");
  doc.setDrawColor(230, 230, 230);
  doc.roundedRect(margin, summaryY, contentW, 50, 3, 3, "S");

  doc.setTextColor(26, 58, 107);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Résumé du mois", margin + 5, summaryY + 10);

  const summaryLines = [
    `• Ce mois-ci, ${data.totalScans} scan(s) QR code ont été enregistrés pour ${data.clientName}.`,
    `• ${data.totalReviews} avis Google ont été générés, avec une note moyenne de ${data.avgRating}/5.`,
    `• Le taux de complétion du quiz s'établit à ${data.completionRate}%.`,
    data.totalReviews > 0
      ? `• Résultat positif : les clients sont actifs et engagés avec votre établissement.`
      : `• Aucun avis généré ce mois. Pensez à vérifier l'emplacement de vos QR codes.`,
  ];

  doc.setTextColor(60, 60, 60);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  summaryLines.forEach((line, i) => {
    doc.text(line, margin + 5, summaryY + 20 + i * 7);
  });

  // ─── Commentaire personnalisé ────────────────────────────────────────────
  if (data.comment && data.comment.trim()) {
    const commentY = 210;
    doc.setFillColor(255, 247, 237); // orange très clair
    doc.roundedRect(margin, commentY, contentW, 30, 3, 3, "F");
    doc.setDrawColor(242, 101, 34);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, commentY, contentW, 30, 3, 3, "S");
    // Barre orange gauche
    doc.setFillColor(242, 101, 34);
    doc.roundedRect(margin, commentY, 3, 30, 1, 1, "F");
    // Titre
    doc.setTextColor(242, 101, 34);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("💬 Message de votre conseiller Visigold", margin + 7, commentY + 8);
    // Texte du commentaire
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(data.comment, contentW - 14);
    doc.text(lines.slice(0, 2), margin + 7, commentY + 16);
  }

  // ─── Footer ───────────────────────────────────────────────────────────────
  doc.setFillColor(26, 58, 107);
  doc.rect(0, 277, pageW, 20, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("VISIGOLD — Gestion de réputation locale", margin, 289);
  doc.text(`Rapport confidentiel — ${data.clientName}`, pageW - margin, 289, { align: "right" });

  // ─── Download ─────────────────────────────────────────────────────────────
  const filename = `rapport-visigold-${data.clientName.toLowerCase().replace(/\s+/g, "-")}-${data.month}.pdf`;
  doc.save(filename);
}
