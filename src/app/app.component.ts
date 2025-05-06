import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';


(pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
  fileName: string = 'cloned-document'; // valor inicial

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