# Example with type error - concatenating string and integer
def format_message(name, age):
    message = "Name: " + name + ", Age: " + age  # Bug: age is int
    return message

user_name = "Bob"
user_age = 30
print(format_message(user_name, user_age))
