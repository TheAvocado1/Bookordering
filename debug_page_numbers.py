#!/usr/bin/env python3
"""
Debug page numbering - create a simple overlay test
"""
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from PyPDF2 import PdfReader, PdfWriter
import io

def create_simple_page_number_test():
    """Create a test PDF with just page numbers to see if they're visible"""
    print("Creating test page number overlay...")
    
    # Create a simple page with just a page number
    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=letter)
    width, height = letter
    
    # Make the page number more prominent for testing
    can.setFont("Helvetica-Bold", 24)  # Bigger font
    can.setFillColorRGB(1, 0, 0)  # Red color
    
    # Try multiple positions
    can.drawCentredString(width/2, 50, "Page 1 - BOTTOM CENTER")
    can.drawCentredString(width/2, height-50, "Page 1 - TOP CENTER") 
    can.drawString(50, height/2, "Page 1 - LEFT MIDDLE")
    can.drawRightString(width-50, height/2, "Page 1 - RIGHT MIDDLE")
    
    can.save()
    packet.seek(0)
    
    # Save as standalone PDF
    with open("page_number_test.pdf", "wb") as f:
        f.write(packet.getvalue())
    
    print("Created page_number_test.pdf - check if you can see the page numbers")

def test_overlay_on_existing_pdf():
    """Test overlaying page numbers on the test PDF"""
    print("Testing overlay on existing PDF...")
    
    # Read the test input PDF
    reader = PdfReader("test_input.pdf")
    writer = PdfWriter()
    
    for i, page in enumerate(reader.pages):
        page_num = i + 1
        
        # Create overlay with very visible page number
        packet = io.BytesIO()
        can = canvas.Canvas(packet)
        
        # Get page dimensions
        page_box = page.mediabox
        page_width = float(page_box.width)
        page_height = float(page_box.height)
        
        # Set canvas size to match page
        can.setPageSize((page_width, page_height))
        
        # Make it very visible
        can.setFont("Helvetica-Bold", 36)
        can.setFillColorRGB(1, 0, 0)  # Bright red
        
        # Try multiple positions
        can.drawCentredString(page_width/2, 100, f"PAGE {page_num}")
        can.drawCentredString(page_width/2, page_height-100, f"TOP: PAGE {page_num}")
        
        can.save()
        packet.seek(0)
        
        # Create overlay page
        overlay_reader = PdfReader(packet)
        overlay_page = overlay_reader.pages[0]
        
        # Try merging in different ways
        try:
            # Method 1: merge_page
            page.merge_page(overlay_page)
            writer.add_page(page)
        except Exception as e:
            print(f"merge_page failed: {e}")
            # Method 2: just add overlay on top
            writer.add_page(overlay_page)
    
    # Save result
    with open("overlay_test.pdf", "wb") as f:
        writer.write(f)
    
    print("Created overlay_test.pdf - check if you can see the overlaid page numbers")

if __name__ == "__main__":
    create_simple_page_number_test()
    test_overlay_on_existing_pdf()