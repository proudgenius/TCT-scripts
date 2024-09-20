# The College Tour - DaVinci Resolve Automation Scripts

These Python scripts streamline the ingest and conforming process for **The College Tour** TV show on Amazon Prime using **DaVinci Resolve**.

**Created by: Cristian Omar Jimenez - [My Website](https://www.cristianjimenez.com/) | [IMDb Page](https://www.imdb.com/name/nm10694722/)**

**Where to Watch:**
- [The College Tour Website](https://www.thecollegetour.com/)
- [Watch on Amazon Prime](https://www.amazon.com/The-College-Tour/dp/B08QMDXR7Z)

## Installation

**Location for Scripts:**
- **Windows**: `C:\Users\YOURNAME\AppData\Roaming\Blackmagic Design\DaVinci Resolve\Support\Fusion\Scripts`

## Script Descriptions

### 1. **TCT_EDL_processor_v1.1.py**
Cleans up the EDL file from Adobe Premiere Pro for seamless import into DaVinci Resolve's Scene Cut Detection tool. It also generates a `clip_names.txt` file for easy copy-paste into the metadata CSV export from DaVinci. Additionally, it navigates to the media storage location automatically, avoiding unnecessary folder navigation.

**Features:**
- Looks for specific drive names ("TCT" or "TCT_2").
- Searches for the correct EDL file using "pp edl" in the filename (e.g., `TCT pp edl.edl`).

---

### 2. **TCT_PP_EDL_Prep.py**
Similar to the above, but works without DaVinci Resolve. Place the script in the same folder as the EDL and run it directly to create a cleaned EDL and `clip_names.txt`. Ensure the EDL file is named correctly (e.g., `TCT pp edl.edl`).

---

### 3. **TCT_Prep_1(Folders_and_Metadata)_v1.1.py**
Organizes Scene Cut Detector clips into bins, adds placeholder text to the metadata description column, and exports a `metadata.csv` file to the media folder. The CSV is automatically opened in your default spreadsheet program.

**Note:** Empty metadata columns are excluded from the CSV, so placeholder text is added by default.

---

### 4. **LibreOffice_Calc_Import_Macro (Save and Quit).txt**
Macro script for LibreOffice Calc that imports clip names from `clip_names.txt` into the metadata CSV's description column. It then saves and closes automatically. Assign to a hotkey (e.g., F3) for quick import and closure.

---

### 5. **LibreOffice_Calc_Import_Macro (No Save and Quit).txt**
Same as the above but doesn't automatically save and close, allowing for manual verification of data.

---

### 6. **TCT_Prep_2(Clip_Color)_v1.py**
After importing the metadata CSV and populating description names, this script assigns clip colors based on the descriptions.

---

These scripts are designed to speed up and automate tasks, ensuring a smoother workflow for **The College Tour** production.

--- 

Let me know if you'd like to make any further adjustments!
