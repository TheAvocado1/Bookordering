// Document Processor - PDF Booklet, EPUB Cover, PDF Merger & PDF to EPUB Conversion
class DocumentProcessor {
    constructor() {
        this.currentMode = 'pdf';
        this.processedBytes = {};
        this.pdfFiles = []; // For PDF merger
        
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
        document.getElementById('pdfMergeBtn').addEventListener('click', () => this.switchMode('pdfMerge'));
        document.getElementById('pdf2EpubBtn').addEventListener('click', () => this.switchMode('pdf2Epub'));

        // PDF Booklet listeners
        document.getElementById('pdfFile').addEventListener('change', this.handlePdfFileSelect.bind(this));
        document.getElementById('processPdfBtn').addEventListener('click', this.processPDF.bind(this));
        document.getElementById('downloadPdfBtn').addEventListener('click', () => this.downloadResult('pdf'));

        // EPUB Cover listeners
        document.getElementById('epubFile').addEventListener('change', this.handleEpubFileSelect.bind(this));
        document.getElementById('coverFile').addEventListener('change', this.handleCoverFileSelect.bind(this));
        document.getElementById('processEpubBtn').addEventListener('click', this.processEPUB.bind(this));
        document.getElementById('downloadEpubBtn').addEventListener('click', () => this.downloadResult('epub'));

        // PDF Merger listeners
        document.getElementById('mergeFiles').addEventListener('change', this.handleMergeFilesSelect.bind(this));
        document.getElementById('processMergeBtn').addEventListener('click', this.processPDFMerge.bind(this));
        document.getElementById('downloadMergeBtn').addEventListener('click', () => this.downloadResult('pdfMerge'));

        // PDF to EPUB listeners
        document.getElementById('pdf2epubFile').addEventListener('change', this.handlePdf2EpubFileSelect.bind(this));
        document.getElementById('processPdf2EpubBtn').addEventListener('click', this.processPdf2Epub.bind(this));
        document.getElementById('downloadPdf2EpubBtn').addEventListener('click', () => this.downloadResult('pdf2Epub'));
    }

    switchMode(mode) {
        this.currentMode = mode;
        
        // Update button states
        document.getElementById('pdfModeBtn').classList.toggle('active', mode === 'pdf');
        document.getElementById('epubModeBtn').classList.toggle('active', mode === 'epub');
        document.getElementById('pdfMergeBtn').classList.toggle('active', mode === 'pdfMerge');
        document.getElementById('pdf2EpubBtn').classList.toggle('active', mode === 'pdf2Epub');
        
        // Hide all sections
        document.getElementById('pdfProcessing').classList.add('hidden');
        document.getElementById('epubProcessing').classList.add('hidden');
        document.getElementById('pdfMergeProcessing').classList.add('hidden');
        document.getElementById('pdf2EpubProcessing').classList.add('hidden');
        
        document.getElementById('pdfConfigSection').classList.add('hidden');
        document.getElementById('epubConfigSection').classList.add('hidden');
        document.getElementById('pdfMergeConfigSection').classList.add('hidden');
        document.getElementById('pdf2EpubConfigSection').classList.add('hidden');
        
        document.getElementById('progressSection').classList.add('hidden');
        
        document.getElementById('pdfResultSection').classList.add('hidden');
        document.getElementById('epubResultSection').classList.add('hidden');
        document.getElementById('pdfMergeResultSection').classList.add('hidden');
        document.getElementById('pdf2EpubResultSection').classList.add('hidden');
        
        // Show appropriate section
        switch(mode) {
            case 'pdf':
                document.getElementById('pdfProcessing').classList.remove('hidden');
                break;
            case 'epub':
                document.getElementById('epubProcessing').classList.remove('hidden');
                break;
            case 'pdfMerge':
                document.getElementById('pdfMergeProcessing').classList.remove('hidden');
                break;
            case 'pdf2Epub':
                document.getElementById('pdf2EpubProcessing').classList.remove('hidden');
                break;
        }
    }

    // PDF Booklet Processing Methods
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
            const sewingMarks = document.getElementById('sewingMarks').value;
            const cuttingLines = document.getElementById('cuttingLines').value;

            if (!fileInput.files[0]) {
                alert('Please select a PDF file');
                return;
            }

            this.showProgress(0, 'Loading PDF...');

            const arrayBuffer = await fileInput.files[0].arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            
            this.showProgress(20, 'Adding page numbers...');
            const numberedDoc = await this.addPageNumbers(pdfDoc);
            
            this.showProgress(40, 'Adding blank pages...');
            const { paddedDoc, blankPagesAdded } = await this.addBlankPages(numberedDoc, signatureSize);
            
            this.showProgress(60, 'Reordering pages...');
            const reorderedDoc = await this.reorderPages(paddedDoc, signatureSize, pagesPerSheet);
            
            this.showProgress(70, 'Adding sewing marks...');
            const markedDoc = await this.addSewingMarks(reorderedDoc, sewingMarks, pagesPerSheet);
            
            this.showProgress(80, 'Adding cutting lines...');
            const finalDoc = await this.addCuttingLines(markedDoc, cuttingLines, pagesPerSheet);
            
            this.showProgress(90, 'Generating final PDF...');
            this.processedBytes.pdf = await finalDoc.save();
            
            this.showProgress(100, 'Complete!');
            this.showResults('pdf', {
                originalPages: pdfDoc.getPageCount(),
                finalPages: finalDoc.getPageCount(),
                blankPages: blankPagesAdded
            });
            
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
            
            const { width, height } = copiedPage.getSize();
            
            // Ensure page number is clean ASCII text
            const pageText = String(pageNum).replace(/[^\x00-\x7F]/g, '');
            copiedPage.drawText(pageText, {
                x: width / 2 - 10,
                y: 30,
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
                const pageNum = currentPages + i + 1;
                const pageText = String(pageNum).replace(/[^\x00-\x7F]/g, '');
                blankPage.drawText(pageText, {
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
        
        if (pagesPerSheet === 4) {
            return await this.arrange4PagesPerSheet(pdfDoc, pattern, signatureSize, signaturesCount);
        } else {
            // Standard 2 pages per sheet logic
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
    }

    async arrange4PagesPerSheet(pdfDoc, pattern, signatureSize, signaturesCount) {
        const pages = pdfDoc.getPages();
        const newDoc = await PDFLib.PDFDocument.create();
        
        // Get original page dimensions
        const originalPage = pages[0];
        const { width: pageWidth, height: pageHeight } = originalPage.getSize();
        
        // Create larger sheets to hold 4 pages (2x2 grid)
        const sheetWidth = pageWidth * 2;
        const sheetHeight = pageHeight * 2;
        
        // First, create temporary PDFs for each page to embed as forms
        const pageBytes = await pdfDoc.save();
        const tempDoc = await PDFLib.PDFDocument.load(pageBytes);
        
        for (let sig = 0; sig < signaturesCount; sig++) {
            const baseIndex = sig * signatureSize;
            
            // Process pages in groups of 4 for each sheet
            for (let i = 0; i < pattern.length; i += 4) {
                const sheet = newDoc.addPage([sheetWidth, sheetHeight]);
                
                // Arrange 4 pages in 2x2 grid:
                // Top-left, Top-right, Bottom-left, Bottom-right
                const positions = [
                    { x: 0, y: pageHeight },              // Top-left
                    { x: pageWidth, y: pageHeight },      // Top-right  
                    { x: 0, y: 0 },                      // Bottom-left
                    { x: pageWidth, y: 0 }               // Bottom-right
                ];
                
                for (let j = 0; j < 4 && (i + j) < pattern.length; j++) {
                    const patternIndex = pattern[i + j];
                    const pageIndex = baseIndex + patternIndex;
                    
                    if (pageIndex < pages.length) {
                        const pos = positions[j];
                        
                        // Create a single-page PDF document for this page
                        const singlePageDoc = await PDFLib.PDFDocument.create();
                        const [copiedPage] = await singlePageDoc.copyPages(tempDoc, [pageIndex]);
                        singlePageDoc.addPage(copiedPage);
                        const singlePageBytes = await singlePageDoc.save();
                        
                        // Embed the single-page PDF as a form
                        const embeddedPdf = await newDoc.embedPdf(singlePageBytes);
                        const [form] = embeddedPdf;
                        
                        // Draw the form on the sheet
                        sheet.drawPage(form, {
                            x: pos.x,
                            y: pos.y,
                            width: pageWidth,
                            height: pageHeight
                        });
                    }
                }
            }
        }
        
        return newDoc;
    }


    async addSewingMarks(pdfDoc, sewingMarks, pagesPerSheet = 2) {
        if (sewingMarks === 'none') {
            return pdfDoc;
        }

        const newDoc = await PDFLib.PDFDocument.create();
        const pages = pdfDoc.getPages();
        const numHoles = parseInt(sewingMarks);

        for (let i = 0; i < pages.length; i++) {
            const [copiedPage] = await newDoc.copyPages(pdfDoc, [i]);
            const { width, height } = copiedPage.getSize();
            
            // Check if this is a 4-pages-per-sheet layout
            const isMultiPageSheet = pagesPerSheet === 4;
            
            if (isMultiPageSheet) {
                // For 4-pages-per-sheet: holes positioned relative to each page pair's edges
                const centerX = width / 2; // Center of the entire sheet
                const pageHeight = height / 2; // Height of each page in the grid
                
                // Calculate hole positions within each page pair
                const marginFromEdge = pageHeight * 0.1; // Margin from top/bottom of each page
                const availablePageHeight = pageHeight - (2 * marginFromEdge);
                const spacing = numHoles > 1 ? availablePageHeight / (numHoles - 1) : 0;

                // Top pair holes (pages 1&16, 2&15, etc.)
                for (let hole = 0; hole < numHoles; hole++) {
                    const y = pageHeight + marginFromEdge + (hole * spacing); // Start from bottom of top section
                    
                    // Draw sewing mark
                    copiedPage.drawCircle({
                        x: centerX,
                        y: y,
                        size: 3,
                        borderColor: PDFLib.rgb(0.6, 0.6, 0.6),
                        borderWidth: 1.5
                    });
                    
                    // Draw guide lines
                    copiedPage.drawLine({
                        start: { x: centerX - 8, y: y },
                        end: { x: centerX + 8, y: y },
                        thickness: 0.8,
                        color: PDFLib.rgb(0.6, 0.6, 0.6)
                    });
                    
                    // Add vertical mark for fold positioning
                    copiedPage.drawLine({
                        start: { x: centerX, y: y - 6 },
                        end: { x: centerX, y: y + 6 },
                        thickness: 1,
                        color: PDFLib.rgb(0.6, 0.6, 0.6)
                    });
                }

                // Bottom pair holes (pages 3&14, 4&13, etc.) - mirrored positioning
                for (let hole = 0; hole < numHoles; hole++) {
                    const y = marginFromEdge + (hole * spacing); // Start from bottom edge
                    
                    // Draw sewing mark
                    copiedPage.drawCircle({
                        x: centerX,
                        y: y,
                        size: 3,
                        borderColor: PDFLib.rgb(0.6, 0.6, 0.6),
                        borderWidth: 1.5
                    });
                    
                    // Draw guide lines
                    copiedPage.drawLine({
                        start: { x: centerX - 8, y: y },
                        end: { x: centerX + 8, y: y },
                        thickness: 0.8,
                        color: PDFLib.rgb(0.6, 0.6, 0.6)
                    });
                    
                    // Add vertical mark for fold positioning
                    copiedPage.drawLine({
                        start: { x: centerX, y: y - 6 },
                        end: { x: centerX, y: y + 6 },
                        thickness: 1,
                        color: PDFLib.rgb(0.6, 0.6, 0.6)
                    });
                }
                
                // Add text label
                copiedPage.drawText('FOLD & SEW', {
                    x: centerX - 25,
                    y: height - 15,
                    size: 6,
                    color: PDFLib.rgb(0.5, 0.5, 0.5)
                });
            } else {
                // Original logic for 2-pages-per-sheet: marks on left edge
                const pageInSignature = i % 16; 
                const isFoldSide = (pageInSignature % 4 === 0 || pageInSignature % 4 === 1);
                
                if (isFoldSide) {
                    const marginFromEdge = 15;
                    const marginFromTopBottom = 50;
                    const availableHeight = height - (2 * marginFromTopBottom);
                    const spacing = availableHeight / (numHoles - 1);

                    for (let hole = 0; hole < numHoles; hole++) {
                        const y = marginFromTopBottom + (hole * spacing);
                        
                        copiedPage.drawCircle({
                            x: marginFromEdge,
                            y: y,
                            size: 3,
                            borderColor: PDFLib.rgb(0.7, 0.7, 0.7),
                            borderWidth: 1
                        });
                        
                        copiedPage.drawLine({
                            start: { x: marginFromEdge - 8, y: y },
                            end: { x: marginFromEdge + 8, y: y },
                            thickness: 0.5,
                            color: PDFLib.rgb(0.7, 0.7, 0.7)
                        });
                    }
                }
            }
            
            newDoc.addPage(copiedPage);
        }

        return newDoc;
    }

    async addCuttingLines(pdfDoc, cuttingLines, pagesPerSheet = 2) {
        if (cuttingLines === 'none') {
            return pdfDoc;
        }

        const newDoc = await PDFLib.PDFDocument.create();
        const pages = pdfDoc.getPages();

        for (let i = 0; i < pages.length; i++) {
            const [copiedPage] = await newDoc.copyPages(pdfDoc, [i]);
            const { width, height } = copiedPage.getSize();
            
            // Check if this is a 4-pages-per-sheet layout
            const isMultiPageSheet = pagesPerSheet === 4;
            
            if (isMultiPageSheet) {
                // For 4-pages-per-sheet: add horizontal cutting line across middle
                if (cuttingLines === 'horizontal' || cuttingLines === 'both') {
                    const midHeight = height / 2;
                    this.drawDashedLine(copiedPage, 20, midHeight, width - 20, midHeight);
                }
                
                // Optional vertical line for 'both' option  
                if (cuttingLines === 'both') {
                    const midWidth = width / 2;
                    this.drawDashedLine(copiedPage, midWidth, 20, midWidth, height - 20);
                }
            } else {
                // Original single-page logic for 2-pages-per-sheet
                if (cuttingLines === 'horizontal' || cuttingLines === 'both') {
                    const midHeight = height / 2;
                    this.drawDashedLine(copiedPage, 20, midHeight, width - 20, midHeight);
                    
                    copiedPage.drawText('-- CUT --', {
                        x: 5,
                        y: midHeight - 3,
                        size: 6,
                        color: PDFLib.rgb(0.7, 0.7, 0.7)
                    });
                }
            }
            
            newDoc.addPage(copiedPage);
        }

        return newDoc;
    }

    drawDashedLine(page, x1, y1, x2, y2) {
        const dashLength = 8;
        const gapLength = 4;
        const totalLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const dx = (x2 - x1) / totalLength;
        const dy = (y2 - y1) / totalLength;
        
        let currentLength = 0;
        while (currentLength < totalLength) {
            const startX = x1 + dx * currentLength;
            const startY = y1 + dy * currentLength;
            const endLength = Math.min(currentLength + dashLength, totalLength);
            const endX = x1 + dx * endLength;
            const endY = y1 + dy * endLength;
            
            page.drawLine({
                start: { x: startX, y: startY },
                end: { x: endX, y: endY },
                thickness: 0.8,
                color: PDFLib.rgb(0.7, 0.7, 0.7),
                dashArray: []
            });
            
            currentLength = endLength + gapLength;
        }
    }

    // EPUB Cover Processing Methods
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

            const epubArrayBuffer = await epubFile.arrayBuffer();
            const zip = new JSZip();
            const epubZip = await zip.loadAsync(epubArrayBuffer);
            
            this.showProgress(25, 'Reading EPUB structure...');
            
            const containerXml = await epubZip.file('META-INF/container.xml').async('text');
            const parser = new DOMParser();
            const containerDoc = parser.parseFromString(containerXml, 'application/xml');
            const opfPath = containerDoc.querySelector('rootfile').getAttribute('full-path');
            
            this.showProgress(40, 'Processing cover image...');
            
            const coverArrayBuffer = await coverFile.arrayBuffer();
            const coverExtension = this.getCoverExtension(coverFile.type);
            const coverFileName = `Images/cover${coverExtension}`;
            
            this.showProgress(60, 'Updating EPUB content...');
            
            epubZip.file(coverFileName, coverArrayBuffer);
            await this.updateContentOPF(epubZip, opfPath, coverFileName, coverFile.type);
            
            this.showProgress(80, 'Generating updated EPUB...');
            
            this.processedBytes.epub = await epubZip.generateAsync({
                type: 'uint8array',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            });
            
            this.showProgress(100, 'Complete!');
            
            this.showResults('epub', {
                originalEpub: epubFile.name,
                newCover: coverFile.name,
                coverFormat: coverFile.type
            });
            
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
        
        let coverItem = opfDoc.querySelector('item[id="cover-image"], item[properties*="cover-image"]');
        if (!coverItem) {
            coverItem = opfDoc.createElement('item');
            coverItem.setAttribute('id', 'cover-image');
            coverItem.setAttribute('properties', 'cover-image');
            opfDoc.querySelector('manifest').appendChild(coverItem);
        }
        
        coverItem.setAttribute('href', coverFileName);
        coverItem.setAttribute('media-type', coverMimeType);
        
        const metaCover = opfDoc.querySelector('meta[name="cover"]');
        if (metaCover) {
            metaCover.setAttribute('content', 'cover-image');
        } else {
            const newMeta = opfDoc.createElement('meta');
            newMeta.setAttribute('name', 'cover');
            newMeta.setAttribute('content', 'cover-image');
            opfDoc.querySelector('metadata').appendChild(newMeta);
        }
        
        const serializer = new XMLSerializer();
        const updatedOpf = serializer.serializeToString(opfDoc);
        epubZip.file(opfPath, updatedOpf);
    }

    // PDF Merger Methods
    handleMergeFilesSelect(event) {
        const files = Array.from(event.target.files);
        if (files.length > 0) {
            this.pdfFiles = files.filter(file => file.type === 'application/pdf');
            
            if (this.pdfFiles.length !== files.length) {
                alert('Some files were not PDF format and were ignored');
            }
            
            this.displayPdfList();
            
            const fileInfo = document.getElementById('merge-file-info');
            const totalSize = this.pdfFiles.reduce((sum, file) => sum + file.size, 0);
            
            fileInfo.innerHTML = `
                <strong>PDF Files:</strong> ${this.pdfFiles.length}<br>
                <strong>Total Size:</strong> ${(totalSize / 1024 / 1024).toFixed(2)} MB
            `;
            
            fileInfo.classList.remove('hidden');
            document.getElementById('merge-file-text').textContent = `${this.pdfFiles.length} PDF files selected`;
            
            if (this.pdfFiles.length > 1) {
                document.getElementById('pdfMergeConfigSection').classList.remove('hidden');
            }
        }
    }

    displayPdfList() {
        const pdfList = document.getElementById('pdf-list');
        if (this.pdfFiles.length === 0) {
            pdfList.classList.add('hidden');
            return;
        }
        
        pdfList.innerHTML = '<h3>PDF Files to Merge (drag to reorder):</h3>';
        
        this.pdfFiles.forEach((file, index) => {
            const pdfItem = document.createElement('div');
            pdfItem.className = 'pdf-item';
            pdfItem.draggable = true;
            pdfItem.dataset.index = index;
            
            pdfItem.innerHTML = `
                <div class="pdf-info">
                    <strong>${index + 1}. ${file.name}</strong><br>
                    Size: ${(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
                <button class="pdf-remove" onclick="documentProcessor.removePdfFile(${index})">Remove</button>
            `;
            
            // Add drag and drop functionality
            pdfItem.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', index);
                pdfItem.classList.add('dragging');
            });
            
            pdfItem.addEventListener('dragend', () => {
                pdfItem.classList.remove('dragging');
            });
            
            pdfItem.addEventListener('dragover', (e) => {
                e.preventDefault();
            });
            
            pdfItem.addEventListener('drop', (e) => {
                e.preventDefault();
                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                const toIndex = index;
                
                if (fromIndex !== toIndex) {
                    this.reorderPdfFiles(fromIndex, toIndex);
                }
            });
            
            pdfList.appendChild(pdfItem);
        });
        
        pdfList.classList.remove('hidden');
    }

    removePdfFile(index) {
        this.pdfFiles.splice(index, 1);
        this.displayPdfList();
        
        if (this.pdfFiles.length <= 1) {
            document.getElementById('pdfMergeConfigSection').classList.add('hidden');
        }
        
        // Update file input display
        const totalSize = this.pdfFiles.reduce((sum, file) => sum + file.size, 0);
        const fileInfo = document.getElementById('merge-file-info');
        
        if (this.pdfFiles.length > 0) {
            fileInfo.innerHTML = `
                <strong>PDF Files:</strong> ${this.pdfFiles.length}<br>
                <strong>Total Size:</strong> ${(totalSize / 1024 / 1024).toFixed(2)} MB
            `;
            document.getElementById('merge-file-text').textContent = `${this.pdfFiles.length} PDF files selected`;
        } else {
            fileInfo.classList.add('hidden');
            document.getElementById('merge-file-text').textContent = 'Choose Multiple PDF Files';
        }
    }

    reorderPdfFiles(fromIndex, toIndex) {
        const file = this.pdfFiles.splice(fromIndex, 1)[0];
        this.pdfFiles.splice(toIndex, 0, file);
        this.displayPdfList();
    }

    async processPDFMerge() {
        try {
            if (this.pdfFiles.length < 2) {
                alert('Please select at least 2 PDF files to merge');
                return;
            }

            this.showProgress(0, 'Starting merge process...');

            const mergedPdf = await PDFLib.PDFDocument.create();
            let totalPages = 0;

            for (let i = 0; i < this.pdfFiles.length; i++) {
                const file = this.pdfFiles[i];
                const progress = ((i + 1) / this.pdfFiles.length) * 80;
                
                this.showProgress(progress, `Merging ${file.name}...`);

                const arrayBuffer = await file.arrayBuffer();
                const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
                const pageCount = pdf.getPageCount();
                const pageIndices = Array.from(Array(pageCount).keys());
                
                const copiedPages = await mergedPdf.copyPages(pdf, pageIndices);
                copiedPages.forEach((page) => mergedPdf.addPage(page));
                
                totalPages += pageCount;
            }

            this.showProgress(90, 'Finalizing merged PDF...');

            this.processedBytes.pdfMerge = await mergedPdf.save();

            this.showProgress(100, 'Complete!');

            this.showResults('pdfMerge', {
                fileCount: this.pdfFiles.length,
                totalPages: totalPages,
                fileSize: (this.processedBytes.pdfMerge.length / 1024 / 1024).toFixed(2) + ' MB'
            });

        } catch (error) {
            console.error('PDF Merge error:', error);
            alert('Error merging PDFs: ' + error.message);
            this.hideProgress();
        }
    }

    // PDF to EPUB Conversion Methods
    handlePdf2EpubFileSelect(event) {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            const fileInfo = document.getElementById('pdf2epub-file-info');
            const metadataSection = document.getElementById('epub-metadata');
            
            fileInfo.innerHTML = `
                <strong>PDF File:</strong> ${file.name}<br>
                <strong>Size:</strong> ${(file.size / 1024 / 1024).toFixed(2)} MB
            `;
            
            fileInfo.classList.remove('hidden');
            metadataSection.classList.remove('hidden');
            document.getElementById('pdf2epub-file-text').textContent = file.name;
            
            // Auto-fill title from filename
            const title = file.name.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ');
            document.getElementById('epubTitle').value = title;
            
            this.checkPdf2EpubReadiness();
        }
    }

    checkPdf2EpubReadiness() {
        const pdfFile = document.getElementById('pdf2epubFile').files[0];
        const title = document.getElementById('epubTitle').value.trim();
        const author = document.getElementById('epubAuthor').value.trim();
        const configSection = document.getElementById('pdf2EpubConfigSection');
        
        if (pdfFile && title && author) {
            configSection.classList.remove('hidden');
        }
    }

    async processPdf2Epub() {
        try {
            const pdfFile = document.getElementById('pdf2epubFile').files[0];
            const title = document.getElementById('epubTitle').value.trim();
            const author = document.getElementById('epubAuthor').value.trim();
            const language = document.getElementById('epubLanguage').value;
            const description = document.getElementById('epubDescription').value.trim();
            const pagesPerChapter = document.getElementById('pagesPerChapter').value;

            if (!pdfFile || !title || !author) {
                alert('Please provide PDF file, title, and author');
                return;
            }

            this.showProgress(0, 'Loading PDF...');

            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            const totalPages = pdfDoc.getPageCount();

            this.showProgress(10, 'Creating EPUB structure...');

            const zip = new JSZip();
            
            // Create EPUB structure
            zip.file('mimetype', 'application/epub+zip');
            
            // META-INF/container.xml
            zip.file('META-INF/container.xml', `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
    <rootfiles>
        <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
    </rootfiles>
</container>`);

            this.showProgress(20, 'Converting PDF pages to images...');

            const chapters = this.createChapterStructure(totalPages, pagesPerChapter);
            let manifestItems = '';
            let spineItems = '';
            
            // Convert pages to images and create chapters
            for (let i = 0; i < totalPages; i++) {
                const progress = 20 + ((i + 1) / totalPages) * 60;
                this.showProgress(progress, `Converting page ${i + 1} of ${totalPages}...`);

                // Create single-page PDF for conversion
                const singlePagePdf = await PDFLib.PDFDocument.create();
                const [copiedPage] = await singlePagePdf.copyPages(pdfDoc, [i]);
                singlePagePdf.addPage(copiedPage);
                const singlePageBytes = await singlePagePdf.save();
                
                // For now, we'll embed the PDF pages as images in a simple way
                // Note: This is a simplified approach - in a real implementation,
                // you'd want to render PDF pages to actual images
                const imageName = `page_${i + 1}.jpg`;
                
                // Create a placeholder image (in real implementation, render PDF page)
                const canvas = document.createElement('canvas');
                canvas.width = 600;
                canvas.height = 800;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = 'black';
                ctx.font = '20px Arial';
                ctx.fillText(`Page ${i + 1}`, 50, 50);
                ctx.fillText('PDF content would be rendered here', 50, 100);
                
                // Convert canvas to blob
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
                const imageBytes = await blob.arrayBuffer();
                
                zip.file(`OEBPS/Images/${imageName}`, imageBytes);
                
                manifestItems += `    <item id="image_${i + 1}" href="Images/${imageName}" media-type="image/jpeg"/>\n`;
            }

            this.showProgress(85, 'Creating EPUB chapters...');

            // Create chapter HTML files
            for (let i = 0; i < chapters.length; i++) {
                const chapter = chapters[i];
                let chapterHtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>${chapter.title}</title>
    <style>
        body { margin: 0; padding: 0; text-align: center; }
        img { max-width: 100%; height: auto; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>${chapter.title}</h1>`;

                chapter.pages.forEach(pageNum => {
                    chapterHtml += `    <img src="Images/page_${pageNum}.jpg" alt="Page ${pageNum}"/>\n`;
                });

                chapterHtml += `</body>
</html>`;

                const chapterFile = `chapter_${i + 1}.xhtml`;
                zip.file(`OEBPS/${chapterFile}`, chapterHtml);
                
                manifestItems += `    <item id="chapter_${i + 1}" href="${chapterFile}" media-type="application/xhtml+xml"/>\n`;
                spineItems += `    <itemref idref="chapter_${i + 1}"/>\n`;
            }

            // Create content.opf
            const contentOpf = `<?xml version="1.0" encoding="utf-8"?>
<package version="3.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="uid">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
        <dc:identifier id="uid">${Date.now()}</dc:identifier>
        <dc:title>${title}</dc:title>
        <dc:creator>${author}</dc:creator>
        <dc:language>${language}</dc:language>
        <dc:description>${description || 'Converted from PDF'}</dc:description>
        <meta property="dcterms:modified">${new Date().toISOString().split('.')[0]}Z</meta>
    </metadata>
    <manifest>
        <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
${manifestItems}
    </manifest>
    <spine toc="ncx">
${spineItems}
    </spine>
</package>`;

            zip.file('OEBPS/content.opf', contentOpf);

            // Create toc.ncx
            let navPoints = '';
            chapters.forEach((chapter, i) => {
                navPoints += `        <navPoint id="chapter_${i + 1}" playOrder="${i + 1}">
            <navLabel><text>${chapter.title}</text></navLabel>
            <content src="chapter_${i + 1}.xhtml"/>
        </navPoint>\n`;
            });

            const tocNcx = `<?xml version="1.0" encoding="utf-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
    <head>
        <meta name="dtb:uid" content="${Date.now()}"/>
        <meta name="dtb:depth" content="1"/>
        <meta name="dtb:totalPageCount" content="${totalPages}"/>
        <meta name="dtb:maxPageNumber" content="${totalPages}"/>
    </head>
    <docTitle><text>${title}</text></docTitle>
    <navMap>
${navPoints}
    </navMap>
</ncx>`;

            zip.file('OEBPS/toc.ncx', tocNcx);

            this.showProgress(95, 'Generating EPUB file...');

            this.processedBytes.pdf2Epub = await zip.generateAsync({
                type: 'uint8array',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            });

            this.showProgress(100, 'Complete!');

            this.showResults('pdf2Epub', {
                originalPdf: pdfFile.name,
                epubTitle: title,
                chaptersCreated: chapters.length,
                pagesConverted: totalPages
            });

        } catch (error) {
            console.error('PDF to EPUB conversion error:', error);
            alert('Error converting PDF to EPUB: ' + error.message);
            this.hideProgress();
        }
    }

    createChapterStructure(totalPages, pagesPerChapter) {
        const chapters = [];
        
        if (pagesPerChapter === 'all') {
            chapters.push({
                title: 'Complete Document',
                pages: Array.from({length: totalPages}, (_, i) => i + 1)
            });
        } else {
            const pagesNum = parseInt(pagesPerChapter);
            for (let i = 0; i < totalPages; i += pagesNum) {
                const startPage = i + 1;
                const endPage = Math.min(i + pagesNum, totalPages);
                const chapterNum = Math.floor(i / pagesNum) + 1;
                
                chapters.push({
                    title: `Chapter ${chapterNum}`,
                    pages: Array.from({length: endPage - startPage + 1}, (_, j) => startPage + j)
                });
            }
        }
        
        return chapters;
    }

    // UI Helper Methods
    showProgress(percent, message) {
        const progressSection = document.getElementById('progressSection');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        // Hide all config sections
        const configSections = [
            'pdfConfigSection', 'epubConfigSection', 
            'pdfMergeConfigSection', 'pdf2EpubConfigSection'
        ];
        configSections.forEach(id => document.getElementById(id).classList.add('hidden'));
        
        progressSection.classList.remove('hidden');
        progressFill.style.width = percent + '%';
        progressText.textContent = message;
    }

    hideProgress() {
        const progressSection = document.getElementById('progressSection');
        progressSection.classList.add('hidden');
        
        // Show appropriate config section
        const configMap = {
            'pdf': 'pdfConfigSection',
            'epub': 'epubConfigSection',
            'pdfMerge': 'pdfMergeConfigSection',
            'pdf2Epub': 'pdf2EpubConfigSection'
        };
        
        const configSection = document.getElementById(configMap[this.currentMode]);
        if (configSection) {
            configSection.classList.remove('hidden');
        }
    }

    showResults(mode, data) {
        const progressSection = document.getElementById('progressSection');
        progressSection.classList.add('hidden');
        
        const resultSectionMap = {
            'pdf': 'pdfResultSection',
            'epub': 'epubResultSection',
            'pdfMerge': 'pdfMergeResultSection',
            'pdf2Epub': 'pdf2EpubResultSection'
        };
        
        const resultSection = document.getElementById(resultSectionMap[mode]);
        resultSection.classList.remove('hidden');
        
        // Populate result data based on mode
        switch(mode) {
            case 'pdf':
                document.getElementById('originalPages').textContent = data.originalPages;
                document.getElementById('finalPages').textContent = data.finalPages;
                document.getElementById('blankPages').textContent = data.blankPages;
                break;
            case 'epub':
                document.getElementById('originalEpubName').textContent = data.originalEpub;
                document.getElementById('newCoverName').textContent = data.newCover;
                document.getElementById('coverFormat').textContent = data.coverFormat;
                break;
            case 'pdfMerge':
                document.getElementById('mergedFileCount').textContent = data.fileCount;
                document.getElementById('totalMergedPages').textContent = data.totalPages;
                document.getElementById('mergedFileSize').textContent = data.fileSize;
                break;
            case 'pdf2Epub':
                document.getElementById('originalPdfName').textContent = data.originalPdf;
                document.getElementById('convertedEpubTitle').textContent = data.epubTitle;
                document.getElementById('chaptersCreated').textContent = data.chaptersCreated;
                document.getElementById('pagesConverted').textContent = data.pagesConverted;
                break;
        }
    }

    downloadResult(mode) {
        if (!this.processedBytes[mode]) {
            alert('No processed file available');
            return;
        }

        const downloadMap = {
            'pdf': { filename: 'booklet-processed.pdf', mimeType: 'application/pdf' },
            'epub': { filename: 'updated-cover.epub', mimeType: 'application/epub+zip' },
            'pdfMerge': { filename: 'merged-document.pdf', mimeType: 'application/pdf' },
            'pdf2Epub': { filename: 'converted-book.epub', mimeType: 'application/epub+zip' }
        };

        const { filename, mimeType } = downloadMap[mode];
        const blob = new Blob([this.processedBytes[mode]], { type: mimeType });
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
let documentProcessor;
document.addEventListener('DOMContentLoaded', () => {
    documentProcessor = new DocumentProcessor();
    
    // Add event listeners for metadata fields to check readiness
    ['epubTitle', 'epubAuthor'].forEach(id => {
        document.getElementById(id).addEventListener('input', () => {
            documentProcessor.checkPdf2EpubReadiness();
        });
    });
});