#!/usr/bin/env python3
"""
Test the 16-page signature ordering for double-sided printing
"""
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from improved_book_ordering import BookletProcessor

def create_16_page_test():
    """Create a test PDF with 16 clearly marked pages"""
    filename = "test_16_pages.pdf"
    c = canvas.Canvas(filename, pagesize=letter)
    width, height = letter
    
    for page_num in range(1, 17):  # Pages 1-16
        # Large page number
        c.setFont("Helvetica-Bold", 72)
        c.drawCentredString(width/2, height/2 + 50, str(page_num))
        
        # Page description
        c.setFont("Helvetica-Bold", 24)
        c.drawCentredString(width/2, height/2 - 50, f"ORIGINAL PAGE {page_num}")
        
        c.showPage()
    
    c.save()
    print(f"Created {filename} with pages 1-16")
    return filename

def analyze_16_page_pattern():
    """Analyze the 16-page pattern"""
    processor = BookletProcessor()
    pattern = processor.signature_patterns[16]
    
    print("\n" + "="*60)
    print("16-PAGE SIGNATURE PATTERN ANALYSIS")
    print("="*60)
    print(f"Current pattern: {pattern}")
    print(f"Length: {len(pattern)} pages")
    
    print("\nPage mapping (position -> original page):")
    for pos, original_page_index in enumerate(pattern):
        original_page = original_page_index + 1  # Convert from 0-based to 1-based
        print(f"Position {pos+1:2d}: Original Page {original_page:2d}")
    
    print("\nFor 16-page signature (4 sheets, double-sided, long edge):")
    print("Sheet 1 front: Positions 1,2   ->", f"Pages {pattern[0]+1}, {pattern[1]+1}")
    print("Sheet 1 back:  Positions 3,4   ->", f"Pages {pattern[2]+1}, {pattern[3]+1}")
    print("Sheet 2 front: Positions 5,6   ->", f"Pages {pattern[4]+1}, {pattern[5]+1}")  
    print("Sheet 2 back:  Positions 7,8   ->", f"Pages {pattern[6]+1}, {pattern[7]+1}")
    print("Sheet 3 front: Positions 9,10  ->", f"Pages {pattern[8]+1}, {pattern[9]+1}")
    print("Sheet 3 back:  Positions 11,12 ->", f"Pages {pattern[10]+1}, {pattern[11]+1}")
    print("Sheet 4 front: Positions 13,14 ->", f"Pages {pattern[12]+1}, {pattern[13]+1}")
    print("Sheet 4 back:  Positions 15,16 ->", f"Pages {pattern[14]+1}, {pattern[15]+1}")
    
    print("\nWhen stacked and folded, reading order should be: 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16")
    print("="*60)

def test_16_page_ordering():
    """Test 16-page ordering"""
    print("Creating 16-page test PDF...")
    test_input = create_16_page_test()
    
    analyze_16_page_pattern()
    
    print("\nProcessing with BookletProcessor...")
    processor = BookletProcessor()
    
    success = processor.process_pdf(test_input, 16, "test_16_result.pdf")
    
    if success:
        print("\nCreated 'test_16_result.pdf'")
        print("Open this file to verify the page ordering is correct for your printer!")
        return True
    else:
        print("Processing failed!")
        return False

if __name__ == "__main__":
    test_16_page_ordering()