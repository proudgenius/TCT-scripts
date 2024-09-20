#!/usr/bin/env python

import DaVinciResolveScript as dvr_script
import re

def change_clip_colors():
    # Initialize Resolve script
    resolve = dvr_script.scriptapp("Resolve")
    pm = resolve.GetProjectManager()
    project = pm.GetCurrentProject()
    mp = project.GetMediaPool()
    media_folder = mp.GetCurrentFolder()
    
    # Get list of clips in the active bin
    clips = media_folder.GetClipList()
    
    # Define the color mappings
    color_mappings = {
        "yellow": lambda desc: desc.startswith("A") and desc[1:5].isdigit() and "0000" <= desc[1:5] <= "9999" or
                                desc.startswith("B") and desc[1:5].isdigit() and "0000" <= desc[1:5] <= "9999",
        "olive": lambda desc: "DJI" in desc,
        "lime": lambda desc: True  # All other cases
    }

    # Additional color mapping for violet and blue
    violet_descriptions = ["TCT_Slate_BG", "Map Animation", "LIU Blue", "TCT CREDITS_v2"]
    blue_description_pattern = re.compile(r"nested sequence.*", re.IGNORECASE)
    
    # Loop through each clip and change the color based on the description
    for clip in clips:
        description = clip.GetMetadata("Description")
        
        if description:
            # Check for violet descriptions first
            if any(violet_desc in description for violet_desc in violet_descriptions):
                clip.SetClipColor("Violet")
            # Check for blue description pattern
            elif blue_description_pattern.match(description):
                clip.SetClipColor("Blue")
            else:
                for color, condition in color_mappings.items():
                    if condition(description):
                        clip.SetClipColor(color.capitalize())
                        break
    
    print("Task completed successfully.")

if __name__ == "__main__":
    change_clip_colors()
