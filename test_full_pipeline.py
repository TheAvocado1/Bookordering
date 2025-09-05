#!/usr/bin/env python3
"""
Test the full pipeline: page numbering + blank pages + reordering
"""
import sys
import os
from improved_book_ordering import BookletProcessor

def test_full_pipeline():
    """Test the complete functionality"""
    processor = BookletProcessor()
    
    input_file = "test_input.pdf"
    output_file = "test_full_output.pdf"
    signature_size = 4  # Small signature for testing
    
    try:
        print("Testing full pipeline...")
        success = processor.process_pdf(input_file, signature_size, output_file)
        
        if success:
            print(f"Success! Check {output_file} for the complete result")
            return True
        else:
            print("Pipeline test failed")
            return False
            
    except Exception as e:
        print(f"Pipeline test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_full_pipeline()
    sys.exit(0 if success else 1)