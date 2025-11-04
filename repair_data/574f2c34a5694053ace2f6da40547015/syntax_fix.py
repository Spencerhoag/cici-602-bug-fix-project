from docker.errors import MountError

try:
    # Code that might raise a MountError
except MountError as e:
    print(f"docker: Error response from daemon: {e}")
    exit(125)