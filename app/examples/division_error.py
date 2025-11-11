# Example with runtime error - division by zero
def calculate_average(numbers):
    total = sum(numbers)
    count = 0  # Bug: should be len(numbers)
    return total / count

numbers = [10, 20, 30, 40, 50]
result = calculate_average(numbers)
print(f"Average: {result}")
