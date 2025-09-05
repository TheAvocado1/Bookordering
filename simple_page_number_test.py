#!/usr/bin/env python3
"""
Very simple test to verify page numbers are visible
"""
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

def create_simple_test():
    """Create a PDF with just page numbers to test visibility"""
    filename = "simple_page_numbers.pdf"
    c = canvas.Canvas(filename, pagesize=letter)
    width, height = letter
    
    # Page 1
    c.setFont("Helvetica", 12)
    c.drawCentredString(width/2, 30, "1")
    c.drawString(100, height - 100, "This is page content")
    c.showPage()
    
    # Page 2
    c.setFont("Helvetica", 12)
    c.drawCentredString(width/2, 30, "2") 
    c.drawString(100, height - 100, "This is page 2 content")
    c.showPage()
    
    c.save()
    print(f"Created {filename} - check if you can see page numbers '1' and '2' at the bottom")

if __name__ == "__main__":
    create_simple_test()