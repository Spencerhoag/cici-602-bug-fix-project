import docker

client = docker.from_env()
try:
    image = client.images.pull('python-runner-image:latest')
except docker.errors.APIError as e:
    print(e)
print("Hello World")