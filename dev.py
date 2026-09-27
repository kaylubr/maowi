import subprocess

procs = [
    subprocess.Popen(["npm", "--prefix", "src/ui", "run", "dev"]),
    subprocess.Popen(["uv", "run", "fastapi", "dev", "src/server/main.py"]),
]

try:
    for p in procs:
        p.wait()
except KeyboardInterrupt:
    for p in procs:
        p.terminate()
    for p in procs:
        p.wait()