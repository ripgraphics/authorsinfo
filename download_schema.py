import os
import subprocess
from datetime import datetime

def download_schema():
    # Create a directory for schemas if it doesn't exist
    schema_dir = "schemas"
    if not os.path.exists(schema_dir):
        os.makedirs(schema_dir)

    # Generate timestamp for the filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = os.path.join(schema_dir, f"schema_{timestamp}.sql")

    try:
        # Run supabase db dump command
        result = subprocess.run(
            ["supabase", "db", "dump", "-f", output_file],
            capture_output=True,
            text=True,
            check=True
        )
        print(f"Schema successfully downloaded to: {output_file}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error downloading schema: {e.stderr}")
        return False
    except FileNotFoundError:
        print("Error: Supabase CLI not found. Please install it first using:")
        print("npm install -g supabase")
        return False

if __name__ == "__main__":
    download_schema() 