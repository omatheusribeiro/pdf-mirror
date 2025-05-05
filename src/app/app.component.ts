import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { PDFDocument } from 'pdf-lib';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
})
export class AppComponent {
  pdfFile: File | null = null;
  clonedPdfBytes: Uint8Array | null = null;
  cloneReady = false;

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.pdfFile = input.files[0];
      this.cloneReady = false;
    }
  }

  async clonePdf() {
    if (!this.pdfFile) return;

    const arrayBuffer = await this.pdfFile.arrayBuffer();
    const originalPdf = await PDFDocument.load(arrayBuffer);
    const newPdf = await PDFDocument.create();

    const pages = await newPdf.copyPages(originalPdf, originalPdf.getPageIndices());
    pages.forEach((page) => newPdf.addPage(page));

    this.clonedPdfBytes = await newPdf.save();
    this.cloneReady = true;
  }

  downloadPdf() {
    if (!this.clonedPdfBytes) return;

    const blob = new Blob([this.clonedPdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cloned-document.pdf';
    a.click();
    URL.revokeObjectURL(url);
  }
}
