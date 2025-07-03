#Python
from time import perf_counter

def sumupto(num):
    s = 0
    i = 0
    while i < num:
        i += 1
        s += i
    return s


def timeit(func, val):
    t = perf_counter()
    r = func(val)
    return [perf_counter()-t, r]
print(timeit(sumupto,10**6))
print(timeit(sumupto,10**7))
print(timeit(sumupto,10**8))
print(timeit(sumupto,10**9))