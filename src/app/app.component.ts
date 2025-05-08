import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

declare const bootstrap: any; 

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  pdfFile: File | null = null;
  clonedPdfBytes: Uint8Array | null = null;
  cloneReady = false;
  pdfPreviewUrl: SafeResourceUrl | null = null;
  showDownloadSection = false;
  fileName: string = 'cloned-document';
  codeText: string = '';

  constructor(private sanitizer: DomSanitizer) {}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.pdfFile = input.files[0];
      this.cloneReady = false;
      this.showDownloadSection = false;

      const blobUrl = URL.createObjectURL(this.pdfFile);
      this.pdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl);
    }
  }

  async clonePdf() {
    if (!this.pdfFile) return;

    const arrayBuffer = await this.pdfFile.arrayBuffer();
    const originalPdf = await PDFDocument.load(arrayBuffer);
    const newPdf = await PDFDocument.create();

    const pages = await newPdf.copyPages(originalPdf, originalPdf.getPageIndices());
    pages.forEach((page) => newPdf.addPage(page));

    if (this.codeText.trim()) {
      const page = newPdf.addPage([600, 800]);
      const font = await newPdf.embedFont(StandardFonts.Courier);
      const fontSize = 12;
      const margin = 20;

      const lines = this.codeText.split('\n');
      lines.forEach((line, index) => {
        page.drawText(line, {
          x: margin,
          y: page.getHeight() - margin - fontSize * (index + 1),
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
      });
    }

    this.clonedPdfBytes = await newPdf.save();
    this.cloneReady = true;
    this.showDownloadSection = true;
  }

  openRenameModal() {
    const modalElement = document.getElementById('renameModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  confirmDownload() {
    if (!this.clonedPdfBytes) return;

    const safeFileName = this.fileName.trim() || 'document';
    const blob = new Blob([this.clonedPdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeFileName}.pdf`;
    a.click();
    URL.revokeObjectURL(url);

    this.showDownloadSection = false;
    this.pdfPreviewUrl = null;
    this.fileName = 'cloned-document';
  }
}