# Example with name error - undefined variable
def print_user_info():
    name = "Alice"
    age = 25
    print(f"Name: {name}")
    print(f"Age: {age}")
    print(f"Email: {email}")  # Bug: email is not defined

print_user_info()
