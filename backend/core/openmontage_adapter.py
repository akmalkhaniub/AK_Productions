import os
import sys
import json
import tempfile
import subprocess
from pathlib import Path
from typing import Any, Dict

# The absolute path to the OpenMontage clone directory.
# This can be overridden by setting the OPEN_MONTAGE_PATH environment variable.
OPEN_MONTAGE_DEFAULT_PATH = "g:/ReplitProjects/OpenMontage"
OPEN_MONTAGE_PATH = os.getenv("OPEN_MONTAGE_PATH", OPEN_MONTAGE_DEFAULT_PATH)


def execute_openmontage_tool(tool_name: str, inputs: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executes a specific OpenMontage tool programmatically via subprocess.
    
    Args:
        tool_name: The name of the registered OpenMontage tool (e.g. 'transcriber', 'piper_tts')
        inputs: A dictionary of inputs conforming to the tool's input_schema
        
    Returns:
        A dictionary containing the ToolResult fields:
        {
            "success": bool,
            "data": dict,
            "artifacts": list,
            "error": str or None,
            "cost_usd": float,
            "duration_seconds": float,
            "model": str or None
        }
    """
    om_path = Path(OPEN_MONTAGE_PATH)
    cli_script = om_path / "openmontage_cli.py"
    
    # Quick sanity checks
    if not om_path.exists():
        return {
            "success": False,
            "error": f"OpenMontage folder not found at: {OPEN_MONTAGE_PATH}. Set OPEN_MONTAGE_PATH environment variable."
        }
    if not cli_script.exists():
        return {
            "success": False,
            "error": f"openmontage_cli.py runner script not found in: {OPEN_MONTAGE_PATH}."
        }

    # 1. Create a temporary JSON file for inputs (safer than passing huge JSON strings over shell)
    temp_json_path = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False, encoding="utf-8") as temp_file:
            json.dump(inputs, temp_file, indent=2)
            temp_json_path = temp_file.name

        # 2. Build the subprocess command.
        # Run using the same python interpreter that is running FastAPI
        python_exe = sys.executable or "python"
        cmd = [
            python_exe,
            str(cli_script),
            "--tool", tool_name,
            "--inputs", f"@{temp_json_path}"
        ]

        # Add the User scripts directory to PATH so that piper.exe can be discovered by OpenMontage
        user_scripts = os.path.abspath(os.path.expandvars(r"%APPDATA%\Python\Python314\Scripts"))
        env = os.environ.copy()
        if os.path.exists(user_scripts):
            env["PATH"] = user_scripts + os.pathsep + env.get("PATH", "")

        # 3. Run the subprocess.
        result = subprocess.run(
            cmd,
            cwd=str(om_path),
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="ignore",
            env=env
        )
        
        # 4. Parse the output.
        stdout_content = result.stdout.strip()
        if not stdout_content:
            return {
                "success": False,
                "error": f"OpenMontage returned empty stdout. Stderr: {result.stderr.strip()}"
            }
            
        try:
            output_data = json.loads(stdout_content)
            return output_data
        except json.JSONDecodeError:
            return {
                "success": False,
                "error": f"Failed to parse OpenMontage output as JSON: {stdout_content[:500]}...",
                "stderr": result.stderr.strip()
            }

    except Exception as e:
        return {
            "success": False,
            "error": f"Exception occurred while calling OpenMontage tool '{tool_name}': {str(e)}"
        }
        
    finally:
        # 5. Cleanup temporary file
        if temp_json_path and os.path.exists(temp_json_path):
            try:
                os.remove(temp_json_path)
            except Exception:
                pass
