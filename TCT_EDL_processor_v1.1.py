import os
import re
import sys
import platform
import string
import ctypes

def get_resolve_project_name(resolve):
    project_manager = resolve.GetProjectManager()
    project = project_manager.GetCurrentProject()
    
    if project:
        return project.GetName()
    else:
        print("Error: No project is currently open in DaVinci Resolve.")
        sys.exit(1)

def get_drive_label(drive):
    if platform.system() == "Windows":
        kernel32 = ctypes.windll.kernel32
        volumeNameBuffer = ctypes.create_unicode_buffer(1024)
        fileSystemNameBuffer = ctypes.create_unicode_buffer(1024)
        serial_number = None
        max_component_length = None
        file_system_flags = None

        rc = kernel32.GetVolumeInformationW(
            ctypes.c_wchar_p(drive),
            volumeNameBuffer,
            ctypes.sizeof(volumeNameBuffer),
            serial_number,
            max_component_length,
            file_system_flags,
            fileSystemNameBuffer,
            ctypes.sizeof(fileSystemNameBuffer)
        )

        if rc:
            return volumeNameBuffer.value
    return None

def find_project_folder(project_name):
    print("Searching for project folder...")
    
    if platform.system() == "Windows":
        drives = [f"{d}:\\" for d in string.ascii_uppercase if os.path.exists(f"{d}:\\")]
    else:  # macOS
        drives = [f"/Volumes/{d}" for d in os.listdir("/Volumes")]
    
    print(f"Available drives: {drives}")
    
    for drive in drives:
        print(f"Checking drive: {drive}")
        drive_label = get_drive_label(drive)
        print(f"Drive label: {drive_label}")
        
        # Check if it's a TCT drive
        if not (drive_label and any(tct in drive_label.lower() for tct in ["tct", "tct_2"])):
            print(f"Skipping non-TCT drive: {drive}")
            continue
        
        print(f"Searching in TCT drive: {drive}")
        
        jobs_path = os.path.join(drive, "jobs")
        if not os.path.exists(jobs_path):
            print(f"'jobs' folder not found in {drive}. Searching in root...")
            jobs_path = drive

        for root, dirs, files in os.walk(jobs_path):
            for folder in dirs:
                if project_name.lower() in folder.lower():
                    potential_path = os.path.join(root, folder, "Assets", "Color", "Assets")
                    if os.path.exists(potential_path):
                        print(f"Found matching folder: {folder}")
                        return potential_path
            
            # Limit the depth of the search to avoid excessive recursion
            if root.count(os.path.sep) - jobs_path.count(os.path.sep) > 2:
                dirs[:] = []  # Don't recurse any deeper
    
    print(f"Error: Project folder for '{project_name}' not found in any TCT drives.")
    print("Folders found in the 'jobs' directory of TCT drives:")
    for drive in drives:
        drive_label = get_drive_label(drive)
        if drive_label and any(tct in drive_label.lower() for tct in ["tct", "tct_2"]):
            jobs_path = os.path.join(drive, "jobs")
            if os.path.exists(jobs_path):
                print(f"In {drive} ({drive_label}):")
                for folder in os.listdir(jobs_path):
                    print(f"  - {folder}")
    sys.exit(1)

def remove_m2_lines_from_edl(folder_path):
    edl_files = [f for f in os.listdir(folder_path) if "pp edl" in f.lower() and f.endswith('.edl')]

    if not edl_files:
        print("No EDL files containing 'pp edl' found in the project's Assets folder.")
        return

    for edl_file in edl_files:
        input_path = os.path.join(folder_path, edl_file)
        output_path = os.path.join(folder_path, f"{os.path.splitext(edl_file)[0]}_cleaned.edl")

        with open(input_path, 'r') as file:
            edl_lines = file.readlines()

        filtered_edl = [line for line in edl_lines if not line.startswith("M2")]

        with open(output_path, 'w') as file:
            file.writelines(filtered_edl)

        print(f"Filtered EDL saved to: {output_path}")

def extract_clip_names_from_cleaned_edl(folder_path):
    edl_file = None
    for file in os.listdir(folder_path):
        if "edl_cleaned" in file.lower() and file.endswith(".edl"):
            edl_file = file
            break

    if edl_file:
        with open(os.path.join(folder_path, edl_file), "r") as file:
            edl_content = file.read()

        pattern = r"\*\s+FROM CLIP NAME:\s*(.+)"
        matches = re.findall(pattern, edl_content)

        output_path = os.path.join(folder_path, "clip_names.txt")
        with open(output_path, "w") as output_file:
            for clip_name in matches:
                output_file.write(clip_name + "\n")

        print(f"Clip names extracted and saved to '{output_path}' successfully.")
    else:
        print("No EDL file with 'edl_cleaned' in the filename found.")

def navigate_to_folder_in_media_storage(resolve, folder_path):
    project_manager = resolve.GetProjectManager()
    project = project_manager.GetCurrentProject()
    media_storage = resolve.GetMediaStorage()
    
    if project and media_storage:
        # Convert the folder path to the format expected by DaVinci Resolve
        folder_path = folder_path.replace('\\', '/')
        
        # Set the folder in Media Storage
        media_storage.AddItemListToMediaPool(folder_path)
        
        print(f"Navigated to folder in Media Storage: {folder_path}")
    else:
        print("Error: Unable to access Media Storage.")

def main():
    try:
        import DaVinciResolveScript as dvr_script
    except ImportError:
        print("Error: DaVinciResolveScript module not found. This script must be run within DaVinci Resolve.")
        sys.exit(1)

    resolve = dvr_script.scriptapp("Resolve")
    
    project_name = get_resolve_project_name(resolve)
    print(f"Current project name: {project_name}")
    project_folder = find_project_folder(project_name)
    print(f"Using project folder: {project_folder}")
    remove_m2_lines_from_edl(project_folder)
    extract_clip_names_from_cleaned_edl(project_folder)
    
    # Navigate to the project folder in Media Storage
    navigate_to_folder_in_media_storage(resolve, project_folder)

if __name__ == "__main__":
    main()