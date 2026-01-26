#!/usr/bin/env python3
"""
Generate "after" demo images with background removed using rembg
Then composite on white background
"""

import os
from pathlib import Path
from rembg import remove
from PIL import Image
import io

# Get the demo directory
script_dir = Path(__file__).parent
demo_dir = script_dir.parent / "public" / "demo"

def process_image(input_file, output_file):
    print(f"Processing {input_file}...")
    
    input_path = demo_dir / input_file
    output_path = demo_dir / output_file
    
    # Read the input image
    with open(input_path, 'rb') as f:
        input_data = f.read()
    
    # Remove background
    print("  Removing background...")
    output_data = remove(input_data)
    
    # Open the result (PNG with transparency)
    img_with_transparency = Image.open(io.BytesIO(output_data))
    
    # Create a white background
    print("  Compositing on white background...")
    white_bg = Image.new('RGBA', img_with_transparency.size, (255, 255, 255, 255))
    
    # Composite the transparent image onto white background
    white_bg.paste(img_with_transparency, (0, 0), img_with_transparency)
    
    # Convert to RGB (no alpha channel needed for final PNG)
    final = white_bg.convert('RGB')
    
    # Save as PNG
    final.save(output_path, 'PNG', quality=95)
    print(f"  Saved to {output_file}")

def main():
    print("Generating demo 'after' images...\n")
    
    for i in range(1, 5):
        try:
            process_image(f"before-{i}.jpg", f"after-{i}.png")
            print()
        except Exception as e:
            print(f"Error processing before-{i}.jpg: {e}")
            print()
    
    print("Done!")

if __name__ == "__main__":
    main()
