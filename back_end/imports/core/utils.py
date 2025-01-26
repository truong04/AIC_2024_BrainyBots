import glob
import os
import re


def find_all_files(root_dir, extensions=[".txt"]):
    files = []
    for dirpath, _, filenames in os.walk(root_dir):
        for filename in filenames:
            if any(filename.lower().endswith(ext) for ext in extensions):
                files.append(os.path.join(dirpath, filename))
    return files


def get_video_id(file_path):
    pattern = r"/([A-Z0-9]+)_extra/([A-Z0-9]+)"
    match = re.search(pattern, file_path)
    if match:
        return f"{match.group(1)}_{match.group(2)}"
    else:
        print("No match found: " + file_path)
        return None


def get_keyframes_by_video_id(key_frame_dir, video_id):
    splits = video_id.split('_')
    folder_id = splits[0]
    sub_video_id = splits[1]

    return sorted(glob.glob(f"{key_frame_dir}/{folder_id}_extra/{sub_video_id}/*.jpg"))


def get_video_id_and_frame_id(file_path):
    pattern = r"/([A-Z0-9]+)_extra/([A-Z0-9]+)/(\d+)\.*"
    match = re.search(pattern, file_path)
    if match:
        video_id = f"{match.group(1)}_{match.group(2)}"
        frame_id = match.group(3)
        return video_id, frame_id
    else:
        print("No match found: " + file_path)
        return None, None