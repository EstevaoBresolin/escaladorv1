import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface EventPdfData {
  event: any;
  ministry: any;
  slots: any[];
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
