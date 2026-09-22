export async function exportNotesPdf(pageEls: HTMLElement[], title: string) {
  const { toJpeg } = await import("html-to-image");
  const { jsPDF } = await import("jspdf");

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: "a4",
    hotfixes: ["px_scaling"],
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);

  for (let i = 0; i < pageEls.length; i += 1) {
    const dataUrl = await toJpeg(pageEls[i], {
      quality: 0.93,
      backgroundColor: "#fbf8f1",
      pixelRatio: 2,
    });
    if (i > 0) pdf.addPage();
    pdf.addImage(dataUrl, "JPEG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
  }

  pdf.save(`${slug || "handwritten-notes"}.pdf`);
}
