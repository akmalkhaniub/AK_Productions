import os
import yt_dlp
import uuid

# Ensure temp directory exists
TEMP_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "temp_videos")
os.makedirs(TEMP_DIR, exist_ok=True)

def download_youtube_video(url: str, max_duration_seconds: int = 0) -> str:
    """
    Downloads a YouTube video at a reasonable resolution (e.g., 480p) to save space and time.
    If max_duration_seconds > 0, it only downloads the first N seconds.
    Returns the absolute path to the downloaded .mp4 file.
    """
    try:
        file_id = str(uuid.uuid4())
        output_template = os.path.join(TEMP_DIR, f"{file_id}.%(ext)s")
        
        ydl_opts = {
            'format': 'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480][ext=mp4]/best',
            'outtmpl': output_template,
            'quiet': False,
            'no_warnings': True,
        }

        if max_duration_seconds > 0:
            ydl_opts['download_ranges'] = lambda info, ydl: [{'start_time': 0, 'end_time': max_duration_seconds}]
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(url, download=True)
            # The actual downloaded file path
            file_path = ydl.prepare_filename(info_dict)
            
            # Since we requested mp4/m4a merge, the final file might end with .mp4
            if not os.path.exists(file_path):
                file_path = file_path.rsplit('.', 1)[0] + '.mp4'
                
            return file_path
            
    except Exception as e:
        raise Exception(f"Failed to download video: {str(e)}")
