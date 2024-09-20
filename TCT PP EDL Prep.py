import os
import re

def remove_m2_lines_from_edl():
    """
    This function searches for an EDL file in the current directory
    that contains "pp edl" in its name, removes lines that begin with "M2",
    and saves the filtered content to a new file with a "_cleaned" suffix.
    """
    current_dir = os.getcwd()
    edl_files = [f for f in os.listdir(current_dir) if "pp edl" in f and f.endswith('.edl')]

    if not edl_files:
        print("No EDL files containing 'pp edl' found in the current directory.")
        return

    for edl_file in edl_files:
        input_path = os.path.join(current_dir, edl_file)
        output_path = os.path.join(current_dir, f"{os.path.splitext(edl_file)[0]}_cleaned.edl")

        # Read the contents of the input EDL file
        with open(input_path, 'r') as file:
            edl_lines = file.readlines()

        # Filter out lines that begin with "M2"
        filtered_edl = [line for line in edl_lines if not line.startswith("M2")]

        # Write the filtered EDL to the output file
        with open(output_path, 'w') as file:
            file.writelines(filtered_edl)

        print(f"Filtered EDL saved to: {output_path}")

def extract_clip_names_from_cleaned_edl():
    """
    This function searches for the cleaned EDL file in the current directory,
    extracts clip names from it, and saves them to a text file.
    """
    # Find the EDL file with "edl_cleaned" in the filename
    edl_file = None
    for file in os.listdir("."):
        if "edl_cleaned" in file and file.endswith(".edl"):
            edl_file = file
            break

    if edl_file:
        # Read the EDL file and extract clip names
        with open(edl_file, "r") as file:
            edl_content = file.read()

        # Regular expression pattern to match clip names
        pattern = r"\*\s+FROM CLIP NAME:\s*(.+)"

        # Find all matches using the regular expression
        matches = re.findall(pattern, edl_content)

        # Write the clip names to a text file
        with open("clip_names.txt", "w") as output_file:
            for clip_name in matches:
                output_file.write(clip_name + "\n")

        print("Clip names extracted and saved to 'clip_names.txt' successfully.")
    else:
        print("No EDL file with 'edl_cleaned' in the filename found.")

# Run the functions in sequence
remove_m2_lines_from_edl()
extract_clip_names_from_cleaned_edl()
