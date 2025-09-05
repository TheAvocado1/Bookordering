#!/usr/bin/env python3
"""
Test the page ordering for double-sided printing
Creates a visual test PDF to verify the 4-page signature ordering
"""
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from improved_book_ordering import BookletProcessor

def create_visual_test_pdf():
    """Create a test PDF with clear page identifiers"""
    filename = "printing_order_test.pdf"
    c = canvas.Canvas(filename, pagesize=letter)
    width, height = letter
    
    # Create 4 test pages with very clear content
    pages = [
        {"num": 1, "content": "ORIGINAL PAGE 1", "color": "RED"},
        {"num": 2, "content": "ORIGINAL PAGE 2", "color": "BLUE"}, 
        {"num": 3, "content": "ORIGINAL PAGE 3", "color": "GREEN"},
        {"num": 4, "content": "ORIGINAL PAGE 4", "color": "BLACK"}
    ]
    
    for page in pages:
        # Large page number
        c.setFont("Helvetica-Bold", 72)
        c.drawCentredString(width/2, height/2 + 100, str(page["num"]))
        
        # Content description
        c.setFont("Helvetica-Bold", 24)
        c.drawCentredString(width/2, height/2, page["content"])
        
        # Instructions
        c.setFont("Helvetica", 16)
        c.drawCentredString(width/2, height/2 - 100, f"Color: {page['color']}")
        
        c.showPage()
    
    c.save()
    print(f"Created {filename}")
    return filename

def test_page_ordering():
    """Test the page ordering with visual feedback"""
    print("Creating visual test PDF...")
    test_input = create_visual_test_pdf()
    
    print("Processing with BookletProcessor...")
    processor = BookletProcessor()
    
    # Process with 4-page signature
    success = processor.process_pdf(test_input, 4, "printing_order_result.pdf")
    
    if success:
        print("\n" + "="*60)
        print("PRINTING TEST RESULTS")
        print("="*60)
        print("1. Original order: Page 1, Page 2, Page 3, Page 4")
        print("2. Current 4-page pattern: [3, 0, 1, 2]")
        print("3. This means the reordered PDF should have pages in this order:")
        print("   - Position 1: Original Page 4 (3+1)")
        print("   - Position 2: Original Page 1 (0+1)") 
        print("   - Position 3: Original Page 2 (1+1)")
        print("   - Position 4: Original Page 3 (2+1)")
        print("\n4. For double-sided printing (4 pages per sheet, long edge binding):")
        print("   - Sheet front: Page 4, Page 1")
        print("   - Sheet back:  Page 2, Page 3")
        print("\n5. When folded, reading order should be: 1, 2, 3, 4")
        print("\nOpen 'printing_order_result.pdf' to verify this is correct!")
        print("="*60)
        
        return True
    else:
        print("Processing failed!")
        return False

if __name__ == "__main__":
    test_page_ordering()