def get_first_and_last(items):
    first = items[0] if len(items) > 0 else None
    last = items[-1] if len(items) > 0 else None
    return first, last

my_list = ["apple", "banana", "cherry"]
first, last = get_first_and_last(my_list)
print(f"First: {first}, Last: {last}")