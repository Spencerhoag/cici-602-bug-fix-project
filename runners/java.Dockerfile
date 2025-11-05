FROM openjdk:17-slim

# Directory where we will copy code into
WORKDIR /work

# Default command (will get overridden by docker create)
CMD ["java"]
