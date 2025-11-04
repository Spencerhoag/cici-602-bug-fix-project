FROM openjdk:21-slim
WORKDIR /work
CMD ["bash", "-c", "javac Main.java && java Main"]
