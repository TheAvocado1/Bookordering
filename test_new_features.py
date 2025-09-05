#!/usr/bin/env python3
"""
Test the new pages-per-sheet feature
"""
from improved_book_ordering import BookletProcessor

def test_configuration_options():
    """Test that all configuration options are available"""
    processor = BookletProcessor()
    
    print("Testing available configurations...")
    
    for pages_per_sheet in processor.signature_patterns.keys():
        print(f"\nPages per sheet: {pages_per_sheet}")
        signatures = processor.signature_patterns[pages_per_sheet]
        
        for signature_size, pattern in signatures.items():
            print(f"  Signature size {signature_size}: {len(pattern)} positions")
            print(f"    Pattern: {pattern}")

def test_with_4_pages_per_sheet():
    """Test with 4 pages per sheet configuration"""
    processor = BookletProcessor()
    
    # Test with our simple test input
    input_file = "test_input.pdf"
    output_file = "test_4_per_sheet.pdf"
    
    try:
        success = processor.process_pdf(input_file, 4, 4, output_file)  # 4-page sig, 4 per sheet
        if success:
            print(f"\nSuccess! Created {output_file} with 4-pages-per-sheet configuration")
            return True
        else:
            print("Test failed")
            return False
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    test_configuration_options()
    print("\n" + "="*60)
    test_with_4_pages_per_sheet()