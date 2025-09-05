#!/usr/bin/env python3
"""
Create a simple test PDF to verify page numbering
"""
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

def create_test_pdf():
    """Create a simple 3-page PDF for testing"""
    filename = "test_input.pdf"
    c = canvas.Canvas(filename, pagesize=letter)
    width, height = letter
    
    # Page 1
    c.drawString(100, height - 100, "This is Page 1")
    c.drawString(100, height - 150, "Content goes here...")
    c.showPage()
    
    # Page 2
    c.drawString(100, height - 100, "This is Page 2") 
    c.drawString(100, height - 150, "More content here...")
    c.showPage()
    
    # Page 3
    c.drawString(100, height - 100, "This is Page 3")
    c.drawString(100, height - 150, "Final page content...")
    c.showPage()
    
    c.save()
    print(f"Created test PDF: {filename}")

if __name__ == "__main__":
    create_test_pdf()