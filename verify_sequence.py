#!/usr/bin/env python3
"""
Verify the exact sequence for 16-page booklet with cutting
"""

def analyze_cutting_pattern():
    """Analyze the pattern with horizontal cutting in mind"""
    # Your sequence: 16, 1, 14, 3, 2, 15, 4, 13, etc.
    desired_sequence = [16, 1, 14, 3, 2, 15, 4, 13, 12, 5, 10, 7, 6, 11, 8, 9]
    
    print("DESIRED SEQUENCE:", desired_sequence)
    print("\nWith 4-per-sheet printing and horizontal cutting:")
    
    for i in range(0, 16, 4):
        sheet_num = (i // 4) + 1
        top_left = desired_sequence[i]
        top_right = desired_sequence[i+1] 
        bottom_left = desired_sequence[i+2]
        bottom_right = desired_sequence[i+3]
        
        print(f"\nPhysical Sheet {sheet_num}:")
        print(f"  [{top_left:2d}] [{top_right:2d}]")  
        print(f"  [{bottom_left:2d}] [{bottom_right:2d}]")
        print(f"After cutting:")
        print(f"  Top booklet sheet: {top_left}, {top_right}")
        print(f"  Bottom booklet sheet: {bottom_left}, {bottom_right}")

if __name__ == "__main__":
    analyze_cutting_pattern()