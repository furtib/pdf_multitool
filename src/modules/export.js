import { state, pdfFiles } from './state.js';
import { showLoader, hideLoader } from './utils.js';

export async function exportPDF() {
  const btn = document.getElementById("download-btn");
  if (btn) {
    btn.disabled = true;
    btn.innerText = "Generating...";
  }
  showLoader("Stitching and burning drawings...");

  try {
    const mergedPdf = await PDFLib.PDFDocument.create();

    for (const item of state.selectedPages) {
      const docMeta = state.docs.find(d => d.id === item.docId);
      const nativePageCount = docMeta ? docMeta.pageCount : 0;
      
      const srcBytes = pdfFiles[item.docId];
      const srcDoc = await PDFLib.PDFDocument.load(srcBytes);
      
      let embeddedPage;

      if (item.pageNum <= nativePageCount) {
        const [copiedPage] = await mergedPdf.copyPages(srcDoc, [
          item.pageNum - 1,
        ]);
        embeddedPage = mergedPdf.addPage(copiedPage);
      } else {
        // Blank page - match size of page 1 of source doc
        const firstPage = srcDoc.getPage(0);
        const { width, height } = firstPage.getSize();
        embeddedPage = mergedPdf.addPage([width, height]);
      }

      const drawKey = `${item.docId}-${item.pageNum}`;
      if (state.drawings[drawKey] && state.drawings[drawKey].length > 0) {
        const { width, height } = embeddedPage.getSize();
        const tempCanvas = document.createElement("canvas");
        const scale = 2;
        tempCanvas.width = width * scale;
        tempCanvas.height = height * scale;
        const ctx = tempCanvas.getContext("2d");
        ctx.scale(scale, scale);

        ctx.lineWidth = 2;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        state.drawings[drawKey].forEach((pathData) => {
          if (pathData.type === "text") {
            const fontSize = pathData.size * height;
            ctx.font = `${fontSize}px Arial`;
            ctx.fillStyle = pathData.color || "#000000";
            ctx.textBaseline = "top";
            const lines = pathData.text.split("\n");
            lines.forEach((line, index) => {
              ctx.fillText(
                line,
                pathData.x * width,
                pathData.y * height + index * fontSize * 1.2,
              );
            });
          } else {
            const points = pathData.points;
            if (!points || points.length < 1) return;
            ctx.strokeStyle = pathData.color || "#ef4444";
            ctx.beginPath();
            ctx.moveTo(points[0].x * width, points[0].y * height);
            for (let i = 1; i < points.length; i++) {
              ctx.lineTo(points[i].x * width, points[i].y * height);
            }
            ctx.stroke();
          }
        });

        const pngUrl = tempCanvas.toDataURL("image/png");
        const pngImageBytes = await fetch(pngUrl).then((res) => res.arrayBuffer());
        const embeddedImage = await mergedPdf.embedPng(pngImageBytes);

        embeddedPage.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: width,
          height: height,
        });
      }
    }

    const pdfBytes = await mergedPdf.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "stitched_pro.pdf";
    a.click();
  } catch (e) {
    console.error(e);
    alert("Export failed: " + e.message);
  } finally {
    hideLoader();
    if (btn) {
      btn.disabled = false;
      btn.innerText = "Download Merged PDF";
    }
  }
}
