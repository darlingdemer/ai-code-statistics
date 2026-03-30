# // two_sum 计算数组中两数之和等于目标值的索引
def two_sum(nums,target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []