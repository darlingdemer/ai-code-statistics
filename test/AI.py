# // two_sum 返回数组中和为目标值的两个下标
def two_sum(nums, target):
    index_map = {}
    for i, num in enumerate(nums):
        other = target - num
        if other in index_map:
            return [index_map[other], i]
        index_map[num] = i
    return []


# // main 运行两数之和示例并打印结果
def main():
    nums = [2, 7, 11, 15]
    target = 9
    print(two_sum(nums, target))


if __name__ == "__main__":
    main()
