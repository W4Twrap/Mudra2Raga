import os

def rename_with_fixed_prefix(folder_path, prefix="T3M1R"):
    """
    Renames all image files sequentially with fixed prefix and incrementing 3-digit number.
    
    Args:
        folder_path (str): Path to the folder containing images
        prefix (str): Fixed prefix for filenames (default: "T5M2L")
    """
    # Get all image files with common extensions
    image_extensions = ('.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.webp')
    image_files = [f for f in os.listdir(folder_path) 
                 if f.lower().endswith(image_extensions)]
    
    # Sort files by creation time (oldest first)
    image_files.sort(key=lambda f: os.path.getctime(os.path.join(folder_path, f)))
    
    # Rename files sequentially
    for index, filename in enumerate(image_files, start=1):
        # Get file extension
        ext = os.path.splitext(filename)[1].lower()
        
        # Create new filename with fixed prefix and 3-digit number
        new_name = f"{prefix}{index:03d}{ext}"
        new_path = os.path.join(folder_path, new_name)
        
        # Handle name conflicts by finding next available number
        while os.path.exists(new_path):
            index += 1
            new_name = f"{prefix}{index:03d}{ext}"
            new_path = os.path.join(folder_path, new_name)
        
        # Rename the file
        old_path = os.path.join(folder_path, filename)
        os.rename(old_path, new_path)
        print(f"Renamed: {filename} -> {new_name}")


rename_with_fixed_prefix(r"C:\Users\ASUS\Desktop\Main\Srishti\Sem 6\Mathematical Experiments with Code\A2_Mudra_Detection\Nomenclature_Code\Mudras\Arala\Right", "T3M1R")