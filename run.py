#!/usr/bin/env python3
import os
import subprocess
import sys
import shutil
import platform
import time
import signal

# Configuration
NODE_VERSION = "20"
PORT = 3000
FRONTEND_PORT = 5173

def run_command(command, cwd=None, shell=True, check=True):
    print(f"[*] Running: {command}")
    try:
        subprocess.run(command, cwd=cwd, shell=shell, check=check)
    except subprocess.CalledProcessError as e:
        print(f"[!] Error running command: {e}")
        if check:
            sys.exit(1)

def install_nodejs():
    print("[*] Checking for Node.js...")
    try:
        version = subprocess.check_output(["node", "--version"]).decode().strip()
        print(f"[*] Found Node.js {version}")
        return
    except (FileNotFoundError, subprocess.CalledProcessError):
        print("[!] Node.js not found. Starting installation...")

    if platform.system() != "Linux":
        print("[!] This script is designed for Linux (Debian/Ubuntu). Please install Node.js manually.")
        sys.exit(1)

    print("[*] Installing Node.js using NodeSource...")
    run_command("sudo apt-get update")
    run_command("sudo apt-get install -y ca-certificates curl gnupg")
    run_command("sudo mkdir -p /etc/apt/keyrings")
    run_command("curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg")
    run_command(f'echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_{NODE_VERSION}.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list')
    run_command("sudo apt-get update")
    run_command("sudo apt-get install nodejs -y")

def install_ngrok():
    print("[*] Checking for Ngrok...")
    try:
        subprocess.check_output(["ngrok", "--version"])
        print("[*] Found Ngrok.")
        return
    except (FileNotFoundError, subprocess.CalledProcessError):
        print("[!] Ngrok not found. Starting installation...")

    if platform.system() != "Linux":
        print("[!] Automated Ngrok installation only supported on Linux.")
        return

    print("[*] Installing Ngrok via APT...")
    run_command("curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null")
    run_command('echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list')
    run_command("sudo apt-get update")
    run_command("sudo apt-get install ngrok -y")

def setup_environment():
    print("[*] Setting up environment...")
    if not os.path.exists(".env"):
        print("[!] .env file not found. Creating a default one...")
        with open(".env", "w") as f:
            f.write(f"PORT={PORT}\n")
            f.write("JWT_SECRET=super_secret_generated_at_runtime_123\n")
            f.write("VITE_ALLOWED_HOST=localhost\n")
            f.write("# NGROK_DOMAIN=your-static-domain.ngrok-free.dev\n")

def install_dependencies():
    print("[*] Installing project dependencies...")
    if os.path.exists("server"):
        run_command("npm install", cwd="server")
    if os.path.exists("client"):
        run_command("npm install", cwd="client")

def get_env_var(key):
    if not os.path.exists(".env"): return None
    with open(".env", "r") as f:
        for line in f:
            if line.strip().startswith(f"{key}="):
                return line.split("=")[1].strip().replace('"', '').replace("'", "")
    return None

def start_app():
    print("[*] Starting CTF Platform...")
    processes = []
    
    def cleanup(signum, frame):
        print("\n[*] Shutting down all processes...")
        for p in processes:
            p.terminate()
        sys.exit(0)

    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    try:
        # 1. Start backend
        print("[*] Starting Backend...")
        backend = subprocess.Popen(["node", "index.js"], cwd="server")
        processes.append(backend)

        # 2. Start Ngrok
        static_domain = get_env_var("NGROK_DOMAIN")
        ngrok_cmd = ["ngrok", "http", str(FRONTEND_PORT)]
        if static_domain:
            print(f"[*] Using Ngrok static domain: {static_domain}")
            ngrok_cmd.append(f"--domain={static_domain}")
        
        print("[*] Starting Ngrok Tunnel...")
        try:
            ngrok = subprocess.Popen(ngrok_cmd, stdout=subprocess.DEVNULL)
            processes.append(ngrok)
        except Exception as e:
            print(f"[!] Failed to start Ngrok: {e}")

        # 3. Start Frontend
        print("[*] Starting Frontend (Vite)...")
        # Pass the domain to Vite if needed (matching start-dev.js logic)
        env = os.environ.copy()
        if static_domain:
            env["VITE_ALLOWED_HOST"] = static_domain
        
        frontend = subprocess.Popen(["npm", "run", "dev"], cwd="client", env=env)
        processes.append(frontend)

        print("\n" + "="*50)
        print(" PLATFORM IS RUNNING")
        if static_domain:
            print(f" Public URL: https://{static_domain}")
        print(" Press Ctrl+C to stop")
        print("="*50 + "\n")

        # Keep main thread alive
        while True:
            time.sleep(1)
            if backend.poll() is not None or frontend.poll() is not None:
                print("[!] One of the processes exited unexpectedly.")
                cleanup(None, None)

    except Exception as e:
        print(f"[!] Startup error: {e}")
        cleanup(None, None)

def main():
    if platform.system() == "Windows":
        print("[!] WARNING: This script target is Linux. Windows support is experimental.")
        confirm = input("[?] Proceed anyway? (y/N): ")
        if confirm.lower() != 'y': sys.exit(0)

    install_nodejs()
    install_ngrok()
    setup_environment()
    install_dependencies()
    start_app()

if __name__ == "__main__":
    main()
