#!/usr/bin/env python3
"""
Improved Book Ordering Program
Combines PDF preparation and page reordering for booklet printing.
Supports multiple signature sizes and includes comprehensive error handling.
"""

import os
import sys
from pathlib import Path
from typing import List, Optional, Tuple
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.units import mm
import io


class BookletProcessor:
    def __init__(self):
        # Patterns for different pages-per-sheet configurations
        self.signature_patterns = {
            # For 2 pages per sheet (standard duplex)
            2: {
                4: [3, 0, 1, 2],
                8: [7, 0, 1, 6, 5, 2, 3, 4],
                16: [15, 0, 1, 14, 13, 2, 3, 12, 11, 4, 5, 10, 9, 6, 7, 8],
                32: [31, 0, 1, 30, 29, 2, 3, 28, 27, 4, 5, 26, 25, 6, 7, 24,
                     23, 8, 9, 22, 21, 10, 11, 20, 19, 12, 13, 18, 17, 14, 15, 16]
            },
            # For 4 pages per sheet (with horizontal cutting)
            4: {
                4: [3, 0, 1, 2],
                8: [7, 0, 5, 2, 1, 6, 3, 4],
                16: [15, 0, 13, 2, 1, 14, 3, 12, 11, 4, 9, 6, 5, 10, 7, 8],
                32: [31, 0, 29, 2, 1, 30, 3, 28, 27, 4, 25, 6, 5, 26, 7, 24, 
                     23, 8, 21, 10, 9, 22, 11, 20, 19, 12, 17, 14, 13, 18, 15, 16]
            }
        }
    
    def get_pages_per_sheet(self) -> int:
        """Get user's choice for pages per sheet."""
        available_configs = sorted(self.signature_patterns.keys())
        
        print(f"\nAvailable pages-per-sheet configurations: {available_configs}")
        print("2 = Standard duplex printing (2 pages per sheet)")
        print("4 = Print 4 pages per sheet, then cut horizontally")
        
        while True:
            try:
                pages_per_sheet = int(input("Enter pages per sheet: "))
                if pages_per_sheet in available_configs:
                    return pages_per_sheet
                else:
                    print(f"Error: Unsupported configuration. Available: {available_configs}")
            except ValueError:
                print("Please enter a valid number.")
    
    def display_welcome(self):
        """Display welcome message and program description."""
        print("=" * 60)
        print("IMPROVED BOOK ORDERING PROGRAM")
        print("=" * 60)
        print("This program prepares PDFs for booklet printing by:")
        print("1. Adding page numbers to all pages")
        print("2. Adding blank pages to make total pages divisible by signature size")
        print("3. Reordering pages for proper booklet assembly")
        print("4. Supporting multiple printing configurations:")
        print("   - 2 pages per sheet (standard duplex)")
        print("   - 4 pages per sheet (with horizontal cutting)")
        print("5. Supporting signature sizes: 4, 8, 16, and 32 pages")
        print("=" * 60)
    
    def validate_file_input(self, filename: str) -> Optional[str]:
        """Validate and normalize file input."""
        if not filename.strip():
            return None
        
        # Add .pdf extension if not present
        if not filename.lower().endswith('.pdf'):
            filename += '.pdf'
        
        file_path = Path(filename)
        
        if not file_path.exists():
            print(f"Error: Error: File '{filename}' not found.")
            return None
        
        if not file_path.is_file():
            print(f"Error: Error: '{filename}' is not a file.")
            return None
        
        return str(file_path)
    
    def get_valid_integer(self, prompt: str, min_val: int = 1, max_val: int = None) -> int:
        """Get a valid integer input from user with validation."""
        while True:
            try:
                value = int(input(prompt))
                if value < min_val:
                    print(f"Error: Please enter a number >= {min_val}")
                    continue
                if max_val and value > max_val:
                    print(f"Error: Please enter a number <= {max_val}")
                    continue
                return value
            except ValueError:
                print("Please enter a valid number.")
    
    def get_signature_size(self, total_pages: int, pages_per_sheet: int) -> int:
        """Get signature size from user or suggest optimal size."""
        available_sizes = sorted(self.signature_patterns[pages_per_sheet].keys())
        
        print(f"\nYour PDF has {total_pages} pages.")
        print("Available signature sizes:", ", ".join(map(str, available_sizes)))
        
        # Suggest optimal signature size
        optimal_size = None
        for size in reversed(available_sizes):
            if total_pages >= size:
                optimal_size = size
                break
        
        if optimal_size:
            print(f"Suggested signature size: {optimal_size} pages")
        
        while True:
            try:
                size = int(input("Enter signature size: "))
                if size in available_sizes:
                    return size
                else:
                    print(f"Error: Unsupported signature size. Available: {available_sizes}")
            except ValueError:
                print("Please enter a valid number.")
    
    def add_page_numbers(self, reader: PdfReader) -> PdfWriter:
        """Add page numbers to all pages of the PDF."""
        writer = PdfWriter()
        
        for i, page in enumerate(reader.pages):
            page_num = i + 1
            
            # Create overlay PDF with ReportLab
            packet = io.BytesIO()
            
            # Get page dimensions
            page_box = page.mediabox
            page_width = float(page_box.width)
            page_height = float(page_box.height)
            
            # Create the overlay
            can = canvas.Canvas(packet)
            can.setPageSize((page_width, page_height))
            
            # Make page number visible but professional
            can.setFont("Helvetica", 12)
            can.setFillColorRGB(0, 0, 0)  # Black
            
            # Position page number at bottom center
            y_position = 30  # From bottom
            can.drawCentredString(page_width/2, y_position, str(page_num))
            
            can.save()
            packet.seek(0)
            
            # Read the overlay
            overlay_pdf = PdfReader(packet)
            overlay_page = overlay_pdf.pages[0]
            
            # Try merging overlay on TOP of the original page
            overlay_page.merge_page(page)
            writer.add_page(overlay_page)
            
        return writer

    def add_blank_pages(self, numbered_writer: PdfWriter, signature_size: int) -> Tuple[PdfWriter, int]:
        """Add blank pages to make total pages divisible by signature size."""
        writer = PdfWriter()
        
        # Copy all pages from the numbered writer
        for page in numbered_writer.pages:
            writer.add_page(page)
        
        # Calculate how many blank pages needed
        current_pages = len(numbered_writer.pages)
        pages_needed = signature_size - (current_pages % signature_size)
        
        if pages_needed == signature_size:
            pages_needed = 0
        
        # Add blank pages (A4 size: 210x297mm)
        for _ in range(pages_needed):
            writer.add_blank_page(210, 297)
        
        return writer, pages_needed
    
    def reorder_pages(self, writer: PdfWriter, signature_size: int, pages_per_sheet: int) -> PdfWriter:
        """Reorder pages according to signature pattern."""
        pages = writer.pages
        total_pages = len(pages)
        reordered_writer = PdfWriter()
        
        pattern = self.signature_patterns[pages_per_sheet][signature_size]
        signatures_count = total_pages // signature_size
        
        print(f"\n Processing {signatures_count} signature(s) of {signature_size} pages each...")
        
        for sig_num in range(signatures_count):
            print(f"   Processing signature {sig_num + 1}/{signatures_count}...", end=" ")
            
            base_page = sig_num * signature_size
            
            for page_offset in pattern:
                page_index = base_page + page_offset
                if page_index < total_pages:
                    reordered_writer.add_page(pages[page_index])
            
            print("OK")
        
        return reordered_writer
    
    def get_output_filename(self, input_filename: str) -> str:
        """Generate output filename with user input validation."""
        input_path = Path(input_filename)
        base_name = input_path.stem
        
        suggested_name = f"{base_name}_booklet.pdf"
        print(f"\n Suggested output filename: {suggested_name}")
        
        while True:
            filename = input("Enter output filename (or press Enter for suggestion): ").strip()
            
            if not filename:
                filename = suggested_name
            
            if not filename.lower().endswith('.pdf'):
                filename += '.pdf'
            
            output_path = Path(filename)
            
            # Check if file exists and ask for confirmation
            if output_path.exists():
                overwrite = input(f"Warning:  File '{filename}' exists. Overwrite? (y/N): ").lower()
                if overwrite != 'y':
                    continue
            
            return filename
    
    def process_pdf(self, input_file: str, signature_size: int, pages_per_sheet: int, output_file: str) -> bool:
        """Main processing function."""
        try:
            print(f"\n Reading PDF: {input_file}")
            reader = PdfReader(input_file)
            
            original_pages = len(reader.pages)
            print(f" Original pages: {original_pages}")
            
            # Add page numbers first
            print(" Adding page numbers...")
            numbered_writer = self.add_page_numbers(reader)
            print("OK Page numbers added")
            
            # Add blank pages if needed
            writer, blank_pages_added = self.add_blank_pages(numbered_writer, signature_size)
            
            if blank_pages_added > 0:
                print(f" Added {blank_pages_added} blank page(s)")
            else:
                print("OK No blank pages needed")
            
            # Reorder pages
            final_writer = self.reorder_pages(writer, signature_size, pages_per_sheet)
            
            # Save the result
            print(f"\n Saving to: {output_file}")
            with open(output_file, "wb") as output_fp:
                final_writer.write(output_fp)
            
            print(f"OK Success! Booklet saved as '{output_file}'")
            print(f" Total pages in booklet: {len(final_writer.pages)}")
            
            return True
            
        except Exception as e:
            print(f"Error: Error processing PDF: {str(e)}")
            return False
    
    def run(self):
        """Main program loop."""
        self.display_welcome()
        
        while True:
            try:
                # Get input file
                print("\n" + "-" * 40)
                filename = input(" Enter PDF filename (without .pdf): ").strip()
                
                if not filename:
                    print(" Goodbye!")
                    break
                
                input_file = self.validate_file_input(filename)
                if not input_file:
                    continue
                
                # Read PDF to get page count
                try:
                    reader = PdfReader(input_file)
                    total_pages = len(reader.pages)
                except Exception as e:
                    print(f"Error: Error reading PDF: {str(e)}")
                    continue
                
                # Get pages per sheet configuration
                pages_per_sheet = self.get_pages_per_sheet()
                
                # Get signature size
                signature_size = self.get_signature_size(total_pages, pages_per_sheet)
                
                # Get output filename
                output_file = self.get_output_filename(input_file)
                
                # Process the PDF
                success = self.process_pdf(input_file, signature_size, pages_per_sheet, output_file)
                
                if success:
                    # Ask if user wants to process another file
                    another = input("\n Process another file? (y/N): ").lower()
                    if another != 'y':
                        print(" Goodbye!")
                        break
                else:
                    retry = input("\n Try again? (y/N): ").lower()
                    if retry != 'y':
                        print(" Goodbye!")
                        break
                        
            except KeyboardInterrupt:
                print("\n\n Program interrupted. Goodbye!")
                break
            except Exception as e:
                print(f"\nError: Unexpected error: {str(e)}")
                print("Please try again or contact support.")


def main():
    """Entry point of the program."""
    processor = BookletProcessor()
    processor.run()


if __name__ == "__main__":
    main()