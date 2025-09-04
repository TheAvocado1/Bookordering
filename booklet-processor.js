// Booklet Processor JavaScript Implementation
class BookletProcessor {
    constructor() {
        this.signaturePatterns = {
            // For 2 pages per sheet (standard duplex)
            2: {
                4: [3, 0, 1, 2],
                8: [7, 0, 1, 6, 5, 2, 3, 4],
                16: [15, 0, 1, 14, 13, 2, 3, 12, 11, 4, 5, 10, 9, 6, 7, 8],
                32: [31, 0, 1, 30, 29, 2, 3, 28, 27, 4, 5, 26, 25, 6, 7, 24,
                     23, 8, 9, 22, 21, 10, 11, 20, 19, 12, 13, 18, 17, 14, 15, 16]
            },
            // For 4 pages per sheet (with horizontal cutting)
            4: {
                4: [3, 0, 1, 2],
                8: [7, 0, 5, 2, 1, 6, 3, 4],
                16: [15, 0, 13, 2, 1, 14, 3, 12, 11, 4, 9, 6, 5, 10, 7, 8],
                32: [31, 0, 29, 2, 1, 30, 3, 28, 27, 4, 25, 6, 5, 26, 7, 24, 
                     23, 8, 21, 10, 9, 22, 11, 20, 19, 12, 17, 14, 13, 18, 15, 16]
            }
        };
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        const pdfFile = document.getElementById('pdfFile');
        const processBtn = document.getElementById('processBtn');
        const downloadBtn = document.getElementById('downloadBtn');

        pdfFile.addEventListener('change', this.handleFileSelect.bind(this));
        processBtn.addEventListener('click', this.processPDF.bind(this));
        downloadBtn.addEventListener('click', this.downloadResult.bind(this));
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            const fileInfo = document.getElementById('file-info');
            const configSection = document.getElementById('configSection');
            
            fileInfo.innerHTML = `
                <strong>File:</strong> ${file.name}<br>
                <strong>Size:</strong> ${(file.size / 1024 / 1024).toFixed(2)} MB
            `;
            
            fileInfo.classList.remove('hidden');
            configSection.classList.remove('hidden');
            
            document.getElementById('file-text').textContent = file.name;
        }
    }

    async processPDF() {
        try {
            const fileInput = document.getElementById('pdfFile');
            const pagesPerSheet = parseInt(document.getElementById('pagesPerSheet').value);
            const signatureSize = parseInt(document.getElementById('signatureSize').value);

            if (!fileInput.files[0]) {
                alert('Please select a PDF file');
                return;
            }

            // Show progress
            this.showProgress(0, 'Loading PDF...');

            // Load PDF
            const arrayBuffer = await fileInput.files[0].arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            
            this.showProgress(20, 'Adding page numbers...');
            
            // Add page numbers
            const numberedDoc = await this.addPageNumbers(pdfDoc);
            
            this.showProgress(40, 'Adding blank pages...');
            
            // Add blank pages
            const { paddedDoc, blankPagesAdded } = await this.addBlankPages(numberedDoc, signatureSize);
            
            this.showProgress(60, 'Reordering pages...');
            
            // Reorder pages
            const finalDoc = await this.reorderPages(paddedDoc, signatureSize, pagesPerSheet);
            
            this.showProgress(80, 'Generating final PDF...');
            
            // Generate final PDF
            this.processedPdfBytes = await finalDoc.save();
            
            this.showProgress(100, 'Complete!');
            
            // Show results
            this.showResults(pdfDoc.getPageCount(), finalDoc.getPageCount(), blankPagesAdded);
            
        } catch (error) {
            console.error('Processing error:', error);
            alert('Error processing PDF: ' + error.message);
            this.hideProgress();
        }
    }

    async addPageNumbers(pdfDoc) {
        const newDoc = await PDFLib.PDFDocument.create();
        const pages = pdfDoc.getPages();
        
        for (let i = 0; i < pages.length; i++) {
            const pageNum = i + 1;
            const [copiedPage] = await newDoc.copyPages(pdfDoc, [i]);
            
            // Get page dimensions
            const { width, height } = copiedPage.getSize();
            
            // Add page number
            copiedPage.drawText(pageNum.toString(), {
                x: width / 2 - 10, // Rough centering
                y: 30, // Bottom margin
                size: 12,
                color: PDFLib.rgb(0, 0, 0)
            });
            
            newDoc.addPage(copiedPage);
        }
        
        return newDoc;
    }

    async addBlankPages(pdfDoc, signatureSize) {
        const currentPages = pdfDoc.getPageCount();
        const pagesNeeded = signatureSize - (currentPages % signatureSize);
        const blankPagesAdded = pagesNeeded === signatureSize ? 0 : pagesNeeded;
        
        if (blankPagesAdded > 0) {
            const firstPage = pdfDoc.getPages()[0];
            const { width, height } = firstPage.getSize();
            
            for (let i = 0; i < blankPagesAdded; i++) {
                const blankPage = pdfDoc.addPage([width, height]);
                // Optionally add page number to blank page
                const pageNum = currentPages + i + 1;
                blankPage.drawText(pageNum.toString(), {
                    x: width / 2 - 10,
                    y: 30,
                    size: 12,
                    color: PDFLib.rgb(0, 0, 0)
                });
            }
        }
        
        return { paddedDoc: pdfDoc, blankPagesAdded };
    }

    async reorderPages(pdfDoc, signatureSize, pagesPerSheet) {
        const pattern = this.signaturePatterns[pagesPerSheet][signatureSize];
        const pages = pdfDoc.getPages();
        const totalPages = pages.length;
        const signaturesCount = Math.floor(totalPages / signatureSize);
        
        const newDoc = await PDFLib.PDFDocument.create();
        
        for (let sig = 0; sig < signaturesCount; sig++) {
            const baseIndex = sig * signatureSize;
            
            for (let patternIndex of pattern) {
                const pageIndex = baseIndex + patternIndex;
                if (pageIndex < totalPages) {
                    const [copiedPage] = await newDoc.copyPages(pdfDoc, [pageIndex]);
                    newDoc.addPage(copiedPage);
                }
            }
        }
        
        return newDoc;
    }

    showProgress(percent, message) {
        const progressSection = document.getElementById('progressSection');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const configSection = document.getElementById('configSection');
        
        configSection.classList.add('hidden');
        progressSection.classList.remove('hidden');
        
        progressFill.style.width = percent + '%';
        progressText.textContent = message;
    }

    hideProgress() {
        const progressSection = document.getElementById('progressSection');
        const configSection = document.getElementById('configSection');
        
        progressSection.classList.add('hidden');
        configSection.classList.remove('hidden');
    }

    showResults(originalPages, finalPages, blankPages) {
        const resultSection = document.getElementById('resultSection');
        const progressSection = document.getElementById('progressSection');
        
        progressSection.classList.add('hidden');
        resultSection.classList.remove('hidden');
        
        document.getElementById('originalPages').textContent = originalPages;
        document.getElementById('finalPages').textContent = finalPages;
        document.getElementById('blankPages').textContent = blankPages;
    }

    downloadResult() {
        if (!this.processedPdfBytes) {
            alert('No processed PDF available');
            return;
        }
        
        const blob = new Blob([this.processedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = 'booklet-processed.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }
}

// Initialize the application when page loads
document.addEventListener('DOMContentLoaded', () => {
    new BookletProcessor();
});