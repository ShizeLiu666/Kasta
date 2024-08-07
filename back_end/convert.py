import sys
import openpyxl
import pandas as pd
import json
import io

print("Using openpyxl version:", openpyxl.__version__, file=sys.stderr)
print("Using pandas version:", pd.__version__, file=sys.stderr)

# 保持调试信息仅在错误时打印
def extract_text_from_sheet(sheet_df):
    text_list = []
    for value in sheet_df.values.flatten():
        if pd.notna(value) and isinstance(value, str):
            value = value.replace('\uff08', '(').replace('\uff09', ')').replace('\uff1a', ':')
            value = value.replace("AK", "").replace("ES", "")
            text_list.extend([text.strip() for text in value.split('\n') if text.strip()])
    return text_list

def process_excel_to_json(file_content):
    try:
        xl = pd.ExcelFile(io.BytesIO(file_content), engine='openpyxl')  # 使用openpyxl引擎
        all_text_data = {}
        for sheet_name in xl.sheet_names:
            if "Programming Details" in sheet_name: 
                df = xl.parse(sheet_name, engine='openpyxl')  # 确保使用openpyxl引擎
                all_text_data["programming details"] = extract_text_from_sheet(df)
        if not all_text_data:
            return None
        return all_text_data
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return None

def process_devices(split_data):
    devices_content = split_data.get("devices", [])
    devices_data = []
    current_device = None
    for line in devices_content:
        if "(" in line and ")" in line:
            continue
        if line.startswith("QTY:"):
            continue 
        if line == "NAME:":
            continue
        if line in ["KBSKTDIM", "KBSKTREL", "S2400IB2", "C300IBH", "H1RSMB", "H2RSMB", "H3RSMB", "H4RSMB", "H6RSMB", "6INPUT", "4OUTPUT"]:
            current_device = line
        elif current_device:
            devices_data.append({
                "appearanceShortname": current_device,
                "deviceName": line
            })
    return {"devices": devices_data}

def process_groups(split_data):
    groups_content = split_data.get("groups", [])
    groups_data = []
    for line in groups_content:
        if line.startswith("TOTAL"):
            continue
        if "SCENE" in line:
            continue
        if line.startswith("DEVICE CONTROL"):
            continue
        if line.startswith("BLIND GROUP"):
            continue
        if line and not line.startswith("BUTTON") and not any(keyword in line for keyword in ["ON", "OFF", "+"]):
            groups_data.append({
                "groupName": line,
                "devices": []
            })
    return {"groups": groups_data}

def process_remote_controls(split_data):
    remote_controls_content = split_data.get("remoteControls", [])
    remote_controls_data = []
    current_remote = None
    current_links = []
    remote_control_keywords = ["6IN", "4OUT", "S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09", "S10", "S11", "S12", "S13"]
    for line in remote_controls_content:
        if line.startswith("TOTAL"):
            continue
        if line.strip() in remote_control_keywords:
            if current_remote:
                remote_controls_data.append({
                    "remoteName": current_remote,
                    "links": current_links
                })
            current_remote = line.strip()
            current_links = []
        elif line.startswith("BUTTON"):
            parts = line.split(":")
            button_index = int(parts[0].replace("BUTTON", "").strip()) - 1
            button_name = parts[1].strip()
            if "SCENE" in button_name:
                link_type = 2
            elif "DND" in button_name:
                link_type = 3
            elif "GROUP" in button_name:
                link_type = 1
            else:
                link_type = 0
            for prefix in ["SCENE ", "DEVICE ", "GROUP "]:
                if button_name.startswith(prefix):
                    button_name = button_name[len(prefix):].strip()
            current_links.append({
                "linkIndex": button_index,
                "linkType": link_type,
                "linkName": button_name
            })
    if current_remote:
        remote_controls_data.append({
            "remoteName": current_remote,
            "links": current_links
        })
    return {"remoteControls": remote_controls_data}

def parse_scene_content(content_lines):
    contents = []
    for line in content_lines:
        parts = line.split()
        if len(parts) < 2:
            continue
        name = parts[0]
        status = parts[1]
        level = 100 if status == "ON" else 0
        if len(parts) > 2 and '+' in parts:
            try:
                level_index = parts.index('+') + 1
                level = int(parts[level_index].replace("%", ""))
            except (ValueError, IndexError):
                pass
        contents.append({
            "name": name,
            "status": status,
            "statusConditions": {
                "level": level
            }
        })
    return contents

def process_scenes(split_data):
    scenes_content = split_data.get("scenes", [])
    scenes_data = []
    current_scene = None
    current_controls = []
    remote_control_keywords = [
        "BRIGHT",
        "OFF",
        "SOFT",
        "BATH ON",
        "BATH OFF",
        "BATH MOOD",
        "WELCOME",
        "OCCUPIED",
        "SMALL BATH ON",
        "SMALL BATH OFF",
        "SMALL BATH MOOD",
        "BED BRIGHT",
        "BED OFF",
        "BED SOFT",
        "DINING BRIGHT",
        "DINING OFF",
        "DINING SOFT",
        "LIVING BRIGHT",
        "LIVING OFF",
        "LIVING SOFT"
    ]

    for line in scenes_content:
        if line.startswith("TOTAL"):
            continue
        if line in remote_control_keywords:
            if current_scene:
                scenes_data.append({
                    "sceneName": current_scene,
                    "contents": parse_scene_content(current_controls)
                })
            current_scene = line
            current_controls = []
        else:
            current_controls.append(line)
    
    if current_scene:
        scenes_data.append({
            "sceneName": current_scene,
            "contents": parse_scene_content(current_controls)
        })

    return {"scenes": scenes_data}

def split_json_file(input_data):
    content = input_data.get("programming details", [])
    split_keywords = {
        "devices": "KASTA DEVICE",
        "groups": "KASTA GROUP",
        "scenes": "KASTA SCENE",
        "remoteControls": "REMOTE CONTROL LINK"
    }
    split_data = {
        "devices": [],
        "groups": [],
        "scenes": [],
        "remoteControls": []
    }
    current_key = None
    for line in content:
        if line in split_keywords.values():
            current_key = next(key for key, value in split_keywords.items() if value == line)
            continue
        if current_key:
            split_data[current_key].append(line)
    result = {}
    result.update(process_devices(split_data))
    result.update(process_groups(split_data))
    result.update(process_scenes(split_data))
    result.update(process_remote_controls(split_data))
    return result

def main():
    try:
        file_content = sys.stdin.buffer.read()
        all_text_data = process_excel_to_json(file_content)
        if all_text_data:
            result = split_json_file(all_text_data)
            json_output = json.dumps(result)
            print(json_output)
        else:
            print(json.dumps({"error": "No matching worksheets found"}))
    except Exception as e:
        error_message = f"Error: {e}"
        print(json.dumps({"error": error_message}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()