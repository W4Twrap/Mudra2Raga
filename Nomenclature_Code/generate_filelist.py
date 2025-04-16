import os
import json

image_folder = r'C:\Users\ASUS\Desktop\Main\Srishti\Sem 6\Mathematical Experiments with Code\A2_Mudra_Detection\Nomenclature_Code\new-images'

filenames = [f for f in os.listdir(image_folder) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]

filenames.sort()

output_path = os.path.join(image_folder, 'fileList.json')

with open(output_path, 'w') as f:
    json.dump(filenames, f, indent=2)

print(f'fileList.json generated with {len(filenames)} files.')
