import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface EventPdfData {
  event: any;
  ministry: any;
  slots: any[];
}

interface ChurchMemberReportItem {
  name: string;
  email: string;
  role: string;
  hasMinistry: boolean;
  ministryCount: number;
  ministries: string[];
}

interface ChurchMembersPdfData {
  churchName: string;
  members: ChurchMemberReportItem[];
}

interface MinistryMonthlyScheduleReportItem {
  volunteerName: string;
  volunteerEmail: string;
  eventTitle: string;
  eventDate: string;
  eventStartTime?: string | null;
  eventLocation?: string | null;
}

interface MinistryMonthlySchedulesPdfData {
  ministryName: string;
  monthLabel: string;
  items: MinistryMonthlyScheduleReportItem[];
}

export function generateEventPdf({ event, ministry, slots }: EventPdfData) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text(event.title, 14, 20);
  doc.setFontSize(12);
  doc.text(`Data: ${event.date}`, 14, 30);
  if (event.location) doc.text(`Local: ${event.location}`, 14, 38);
  if (ministry) doc.text(`Ministério: ${ministry.name}`, 14, 46);

  const tableData = slots.map((slot: any, idx: number) => [
    idx + 1,
    slot.profiles?.name || "-",
    slot.profiles?.email || "-",
    slot.ministry_functions?.name || "-",
  ]);

  autoTable(doc, {
    head: [["#", "Nome", "Email", "Função"]],
    body: tableData,
    startY: 55,
  });

  doc.save(
    `${event.title.replace(/\s+/g, "_")}_${ministry ? ministry.name.replace(/\s+/g, "_") : ""}.pdf`,
  );
}

export function generateChurchMembersPdf({
  churchName,
  members,
}: ChurchMembersPdfData) {
  const doc = new jsPDF();

  const membersWithoutMinistry = members.filter((member) => !member.hasMinistry);
  const sortedMembers = [...members].sort((a, b) => {
    if (a.hasMinistry !== b.hasMinistry) {
      return a.hasMinistry ? -1 : 1;
    }

    return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
  });

  doc.setFontSize(18);
  doc.text(`Relatorio de membros - ${churchName}`, 14, 20);
  doc.setFontSize(11);
  doc.text(`Total de membros: ${members.length}`, 14, 30);
  doc.text(
    `Sem ministerio: ${membersWithoutMinistry.length}`,
    14,
    37,
  );

  const tableData = sortedMembers.map((member, idx) => [
    idx + 1,
    member.name || "Usuario sem nome",
    member.email || "-",
    member.role,
    member.ministries.length > 0 ? member.ministries.join(", ") : "-",
    member.hasMinistry
      ? `${member.ministryCount} ministerio(s)`
      : "Sem ministerio",
  ]);

  autoTable(doc, {
    head: [["#", "Nome", "Email", "Papel", "Ministerios", "Status"]],
    body: tableData,
    startY: 45,
    didParseCell: (data) => {
      const statusColumnIndex = 5;
      if (
        data.section === "body" &&
        data.column.index === statusColumnIndex &&
        data.cell.raw === "Sem ministerio"
      ) {
        data.cell.styles.fillColor = [254, 242, 242];
        data.cell.styles.textColor = [153, 27, 27];
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  doc.save(`relatorio_membros_${churchName.replace(/\s+/g, "_")}.pdf`);
}

export function generateMinistryMonthlySchedulesPdf({
  ministryName,
  monthLabel,
  items,
}: MinistryMonthlySchedulesPdfData) {
  const doc = new jsPDF();

  const sortedItems = [...items].sort((a, b) => {
    const byDate = (a.eventDate || "").localeCompare(b.eventDate || "");
    if (byDate !== 0) {
      return byDate;
    }

    const byTime = (a.eventStartTime || "").localeCompare(b.eventStartTime || "");
    if (byTime !== 0) {
      return byTime;
    }

    return a.volunteerName.localeCompare(b.volunteerName, "pt-BR", {
      sensitivity: "base",
    });
  });

  doc.setFontSize(18);
  doc.text("Relatorio de escalas por ministerio", 14, 20);
  doc.setFontSize(11);
  doc.text(`Ministerio: ${ministryName}`, 14, 30);
  doc.text(`Periodo: ${monthLabel}`, 14, 37);
  doc.text(`Total de escalas: ${items.length}`, 14, 44);

  const tableData = sortedItems.map((item) => {
    const formattedDate = item.eventDate
      ? new Date(`${item.eventDate}T12:00:00`).toLocaleDateString("pt-BR")
      : "-";

    return [
      item.volunteerName || "-",
      item.volunteerEmail || "-",
      item.eventTitle || "-",
      formattedDate,
      item.eventStartTime ? item.eventStartTime.slice(0, 5) : "-",
      item.eventLocation || "-",
    ];
  });

  autoTable(doc, {
    head: [["Voluntario", "Email", "Evento", "Data", "Hora", "Local"]],
    body: tableData,
    startY: 52,
    styles: {
      fontSize: 9,
      cellPadding: 2,
      overflow: "linebreak",
    },
    columnStyles: {
      0: { cellWidth: 34 },
      1: { cellWidth: 44 },
      2: { cellWidth: 36 },
      3: { cellWidth: 20 },
      4: { cellWidth: 14 },
      5: { cellWidth: 38 },
    },
  });

  const safeMinistry = ministryName.replace(/\s+/g, "_");
  const safeMonth = monthLabel.replace(/[\s/]+/g, "_");
  doc.save(`relatorio_escalas_${safeMinistry}_${safeMonth}.pdf`);
}
