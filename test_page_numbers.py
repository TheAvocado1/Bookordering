#!/usr/bin/env python3
"""
Test script to verify page numbering functionality
"""
import sys
import os
from improved_book_ordering import BookletProcessor
from PyPDF2 import PdfReader

def test_page_numbering():
    """Test the page numbering functionality"""
    processor = BookletProcessor()
    
    # Use the test PDF
    input_file = "test_input.pdf"
    
    if not os.path.exists(input_file):
        print(f"Test file {input_file} not found")
        return False
    
    try:
        print("Testing page numbering functionality...")
        
        # Read the original PDF
        reader = PdfReader(input_file)
        original_pages = len(reader.pages)
        print(f"Original PDF has {original_pages} pages")
        
        # Add page numbers
        print("Adding page numbers...")
        numbered_writer = processor.add_page_numbers(reader)
        
        # Save test output
        test_output = "test_numbered.pdf"
        print(f"Saving test output to {test_output}")
        
        with open(test_output, "wb") as f:
            numbered_writer.write(f)
        
        # Verify the output
        test_reader = PdfReader(test_output)
        test_pages = len(test_reader.pages)
        
        print(f"Test output has {test_pages} pages")
        
        if test_pages == original_pages:
            print("Page count matches original")
            print(f"Test complete! Check {test_output} to verify page numbers are visible")
            return True
        else:
            print("Page count mismatch")
            return False
            
    except Exception as e:
        print(f"Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_page_numbering()
    sys.exit(0 if success else 1)