# Example with index error - accessing out of range index
def get_first_and_last(items):
    first = items[0]
    last = items[10]  # Bug: assumes list has at least 11 items
    return first, last

my_list = ["apple", "banana", "cherry"]
first, last = get_first_and_last(my_list)
print(f"First: {first}, Last: {last}")
