#!/usr/bin/env python3
"""
Test with the real Project Hail Mary PDF
"""
import sys
import os
from improved_book_ordering import BookletProcessor

def test_real_pdf():
    """Test with the real PDF"""
    processor = BookletProcessor()
    
    input_file = "Projecthailmary.pdf"
    output_file = "Projecthailmary_booklet.pdf"
    signature_size = 16  # Standard signature size
    
    try:
        print("Testing with real PDF...")
        success = processor.process_pdf(input_file, signature_size, output_file)
        
        if success:
            print(f"Success! Check {output_file} for the complete result")
            return True
        else:
            print("Test failed")
            return False
            
    except Exception as e:
        print(f"Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_real_pdf()
    sys.exit(0 if success else 1)