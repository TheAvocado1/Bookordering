// Document Processor - PDF Booklet & EPUB Cover Processing
class DocumentProcessor {
    constructor() {
        this.currentMode = 'pdf';
        this.processedPdfBytes = null;
        this.processedEpubBytes = null;
        
        // PDF signature patterns
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
        // Mode switching
        document.getElementById('pdfModeBtn').addEventListener('click', () => this.switchMode('pdf'));
        document.getElementById('epubModeBtn').addEventListener('click', () => this.switchMode('epub'));

        // PDF event listeners
        document.getElementById('pdfFile').addEventListener('change', this.handlePdfFileSelect.bind(this));
        document.getElementById('processPdfBtn').addEventListener('click', this.processPDF.bind(this));
        document.getElementById('downloadPdfBtn').addEventListener('click', () => this.downloadResult('pdf'));

        // EPUB event listeners
        document.getElementById('epubFile').addEventListener('change', this.handleEpubFileSelect.bind(this));
        document.getElementById('coverFile').addEventListener('change', this.handleCoverFileSelect.bind(this));
        document.getElementById('processEpubBtn').addEventListener('click', this.processEPUB.bind(this));
        document.getElementById('downloadEpubBtn').addEventListener('click', () => this.downloadResult('epub'));
    }

    switchMode(mode) {
        this.currentMode = mode;
        
        // Update button states
        document.getElementById('pdfModeBtn').classList.toggle('active', mode === 'pdf');
        document.getElementById('epubModeBtn').classList.toggle('active', mode === 'epub');
        
        // Show/hide appropriate sections
        document.getElementById('pdfProcessing').classList.toggle('hidden', mode !== 'pdf');
        document.getElementById('epubProcessing').classList.toggle('hidden', mode !== 'epub');
        document.getElementById('pdfConfigSection').classList.add('hidden');
        document.getElementById('epubConfigSection').classList.add('hidden');
        document.getElementById('progressSection').classList.add('hidden');
        document.getElementById('pdfResultSection').classList.add('hidden');
        document.getElementById('epubResultSection').classList.add('hidden');
    }

    // PDF Processing Methods
    handlePdfFileSelect(event) {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            const fileInfo = document.getElementById('file-info');
            const configSection = document.getElementById('pdfConfigSection');
            
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
            this.showPdfResults(pdfDoc.getPageCount(), finalDoc.getPageCount(), blankPagesAdded);
            
        } catch (error) {
            console.error('PDF Processing error:', error);
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

    // EPUB Processing Methods
    handleEpubFileSelect(event) {
        const file = event.target.files[0];
        if (file && (file.name.endsWith('.epub') || file.type === 'application/epub+zip')) {
            const fileInfo = document.getElementById('epub-file-info');
            
            fileInfo.innerHTML = `
                <strong>EPUB File:</strong> ${file.name}<br>
                <strong>Size:</strong> ${(file.size / 1024 / 1024).toFixed(2)} MB
            `;
            
            fileInfo.classList.remove('hidden');
            document.getElementById('epub-file-text').textContent = file.name;
            
            this.checkEpubReadiness();
        }
    }

    handleCoverFileSelect(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const preview = document.getElementById('cover-preview');
            const reader = new FileReader();
            
            reader.onload = (e) => {
                preview.innerHTML = `
                    <img src="${e.target.result}" alt="Cover preview">
                    <p><strong>New Cover:</strong> ${file.name} (${file.type})</p>
                `;
                preview.classList.remove('hidden');
            };
            
            reader.readAsDataURL(file);
            document.getElementById('cover-file-text').textContent = file.name;
            
            this.checkEpubReadiness();
        }
    }

    checkEpubReadiness() {
        const epubFile = document.getElementById('epubFile').files[0];
        const coverFile = document.getElementById('coverFile').files[0];
        const configSection = document.getElementById('epubConfigSection');
        
        if (epubFile && coverFile) {
            configSection.classList.remove('hidden');
        }
    }

    async processEPUB() {
        try {
            const epubFile = document.getElementById('epubFile').files[0];
            const coverFile = document.getElementById('coverFile').files[0];

            if (!epubFile || !coverFile) {
                alert('Please select both EPUB and cover image files');
                return;
            }

            this.showProgress(0, 'Loading EPUB file...');

            // Read EPUB file
            const epubArrayBuffer = await epubFile.arrayBuffer();
            const zip = new JSZip();
            const epubZip = await zip.loadAsync(epubArrayBuffer);
            
            this.showProgress(25, 'Reading EPUB structure...');
            
            // Read container.xml to find content.opf path
            const containerXml = await epubZip.file('META-INF/container.xml').async('text');
            const parser = new DOMParser();
            const containerDoc = parser.parseFromString(containerXml, 'application/xml');
            const opfPath = containerDoc.querySelector('rootfile').getAttribute('full-path');
            
            this.showProgress(40, 'Processing cover image...');
            
            // Read and process cover image
            const coverArrayBuffer = await coverFile.arrayBuffer();
            const coverExtension = this.getCoverExtension(coverFile.type);
            const coverFileName = `Images/cover${coverExtension}`;
            
            this.showProgress(60, 'Updating EPUB content...');
            
            // Add/replace cover image in EPUB
            epubZip.file(coverFileName, coverArrayBuffer);
            
            // Update content.opf to reference new cover
            await this.updateContentOPF(epubZip, opfPath, coverFileName, coverFile.type);
            
            this.showProgress(80, 'Generating updated EPUB...');
            
            // Generate new EPUB
            this.processedEpubBytes = await epubZip.generateAsync({
                type: 'uint8array',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            });
            
            this.showProgress(100, 'Complete!');
            
            // Show results
            this.showEpubResults(epubFile.name, coverFile.name, coverFile.type);
            
        } catch (error) {
            console.error('EPUB Processing error:', error);
            alert('Error processing EPUB: ' + error.message);
            this.hideProgress();
        }
    }

    getCoverExtension(mimeType) {
        switch (mimeType) {
            case 'image/jpeg':
            case 'image/jpg':
                return '.jpg';
            case 'image/png':
                return '.png';
            case 'image/gif':
                return '.gif';
            case 'image/webp':
                return '.webp';
            default:
                return '.jpg';
        }
    }

    async updateContentOPF(epubZip, opfPath, coverFileName, coverMimeType) {
        const opfContent = await epubZip.file(opfPath).async('text');
        const parser = new DOMParser();
        const opfDoc = parser.parseFromString(opfContent, 'application/xml');
        
        // Find or create cover image item in manifest
        let coverItem = opfDoc.querySelector('item[id="cover-image"], item[properties*="cover-image"]');
        if (!coverItem) {
            // Create new cover item
            coverItem = opfDoc.createElement('item');
            coverItem.setAttribute('id', 'cover-image');
            coverItem.setAttribute('properties', 'cover-image');
            opfDoc.querySelector('manifest').appendChild(coverItem);
        }
        
        // Update cover item attributes
        coverItem.setAttribute('href', coverFileName);
        coverItem.setAttribute('media-type', coverMimeType);
        
        // Update metadata if exists
        const metaCover = opfDoc.querySelector('meta[name="cover"]');
        if (metaCover) {
            metaCover.setAttribute('content', 'cover-image');
        } else {
            // Create meta cover if it doesn't exist
            const newMeta = opfDoc.createElement('meta');
            newMeta.setAttribute('name', 'cover');
            newMeta.setAttribute('content', 'cover-image');
            opfDoc.querySelector('metadata').appendChild(newMeta);
        }
        
        // Serialize and save updated OPF
        const serializer = new XMLSerializer();
        const updatedOpf = serializer.serializeToString(opfDoc);
        epubZip.file(opfPath, updatedOpf);
    }

    // UI Helper Methods
    showProgress(percent, message) {
        const progressSection = document.getElementById('progressSection');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const configSections = [
            document.getElementById('pdfConfigSection'),
            document.getElementById('epubConfigSection')
        ];
        
        configSections.forEach(section => section.classList.add('hidden'));
        progressSection.classList.remove('hidden');
        
        progressFill.style.width = percent + '%';
        progressText.textContent = message;
    }

    hideProgress() {
        const progressSection = document.getElementById('progressSection');
        const configSection = this.currentMode === 'pdf' 
            ? document.getElementById('pdfConfigSection')
            : document.getElementById('epubConfigSection');
        
        progressSection.classList.add('hidden');
        configSection.classList.remove('hidden');
    }

    showPdfResults(originalPages, finalPages, blankPages) {
        const resultSection = document.getElementById('pdfResultSection');
        const progressSection = document.getElementById('progressSection');
        
        progressSection.classList.add('hidden');
        resultSection.classList.remove('hidden');
        
        document.getElementById('originalPages').textContent = originalPages;
        document.getElementById('finalPages').textContent = finalPages;
        document.getElementById('blankPages').textContent = blankPages;
    }

    showEpubResults(epubName, coverName, coverType) {
        const resultSection = document.getElementById('epubResultSection');
        const progressSection = document.getElementById('progressSection');
        
        progressSection.classList.add('hidden');
        resultSection.classList.remove('hidden');
        
        document.getElementById('originalEpubName').textContent = epubName;
        document.getElementById('newCoverName').textContent = coverName;
        document.getElementById('coverFormat').textContent = coverType;
    }

    downloadResult(type) {
        let bytes, filename, mimeType;
        
        if (type === 'pdf') {
            if (!this.processedPdfBytes) {
                alert('No processed PDF available');
                return;
            }
            bytes = this.processedPdfBytes;
            filename = 'booklet-processed.pdf';
            mimeType = 'application/pdf';
        } else if (type === 'epub') {
            if (!this.processedEpubBytes) {
                alert('No processed EPUB available');
                return;
            }
            bytes = this.processedEpubBytes;
            filename = 'updated-cover.epub';
            mimeType = 'application/epub+zip';
        }
        
        const blob = new Blob([bytes], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }
}

// Initialize the application when page loads
document.addEventListener('DOMContentLoaded', () => {
    new DocumentProcessor();
});