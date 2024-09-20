import DaVinciResolveScript as dvr_script
import os
import subprocess

def main():
    resolve = dvr_script.scriptapp("Resolve")
    if resolve is None:
        print("DaVinci Resolve not found!")
        return

    project_manager = resolve.GetProjectManager()
    current_project = project_manager.GetCurrentProject()
    if current_project is None:
        print("No project is currently open!")
        return

    media_pool = current_project.GetMediaPool()

    # Create the "Timelines" bin
    timelines_bin = media_pool.AddSubFolder(media_pool.GetRootFolder(), "Timelines")
    if timelines_bin is None:
        print("Failed to create 'Timelines' bin!")
        return

    # Create the "Media" bin
    media_bin = media_pool.AddSubFolder(media_pool.GetRootFolder(), "Media")
    if media_bin is None:
        print("Failed to create 'Media' bin!")
        return

    # Move all clips to the "Media" bin
    root_folder = media_pool.GetRootFolder()
    clips = root_folder.GetClipList()
    if not clips:
        print("No clips found in the root folder.")
        return

    media_pool.MoveClips(clips, media_bin)

    # Open the "Media" bin
    media_pool.SetCurrentFolder(media_bin)
    print("'Media' bin is now open!")

    # Add "clip name" to the description metadata of the first clip in the "Media" bin
    clips = media_bin.GetClipList()
    if clips:
        first_clip = clips[0]
        description = first_clip.GetMetadata("Description") or ""
        new_description = f"{description} clip name"
        first_clip.SetMetadata("Description", new_description)

        # Get the file path of the first clip
        first_clip_path = first_clip.GetClipProperty("File Path")
        export_dir = os.path.dirname(first_clip_path)
        export_file_path = os.path.join(export_dir, "metadata.csv")
    else:
        print("No clips found in the 'Media' bin.")
        return

    # Export metadata to a CSV file
    success = media_pool.ExportMetadata(export_file_path, clips)
    if success:
        print(f"Metadata exported successfully to {export_file_path}")
        
        # Open the metadata.csv file with the default application
        try:
            if os.name == 'nt':  # For Windows
                os.startfile(export_file_path)
            elif os.name == 'posix':  # For macOS and Linux
                opener = 'open' if os.uname().sysname == 'Darwin' else 'xdg-open'
                subprocess.call([opener, export_file_path])
            print(f"Opened {export_file_path} with the default application.")
        except Exception as e:
            print(f"Failed to open {export_file_path}: {e}")
    else:
        print("Failed to export metadata.")

if __name__ == "__main__":
    main()