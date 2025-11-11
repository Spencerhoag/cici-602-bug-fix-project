# Example with logic error - produces wrong output
# Expected output: "Sum: 150"
def calculate_sum(numbers):
    total = 1  # Bug: should start at 0
    for num in numbers:
        total += num
    return total

numbers = [10, 20, 30, 40, 50]
result = calculate_sum(numbers)
print(f"Sum: {result}")
