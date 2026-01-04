# 基于 validation_rules 的智能标红

## 更新内容

### 文件：`tarsight-dashboard/components/test-case-detail.tsx`

#### 核心改进：

根据测试用例的 `validation_rules` 来智能判断哪些字段应该标红，而不是盲目标红所有可能的字段。

#### 工作原理：

1. **解析 validation_rules**
   ```typescript
   // 从 test_case.validation_rules 中提取验证规则
   {
     "type": "json_path",
     "checks": [
       {
         "path": "$.code",
         "operator": "equals",
         "value": 200
       }
     ]
   }
   ```

2. **提取需要验证的字段**
   ```typescript
   // 提取字段名（去掉 $. 前缀）
   "$.code" → "code"
   "$.Success" → "Success"
   ```

3. **根据验证规则判断是否标红**
   - 只有 `result.status === 'passed'` 时才考虑标红
   - 只有在 `validation_rules.checks` 中定义的字段才会标红
   - 根据实际的 `operator` 和 `value` 判断是否匹配

#### 支持的验证操作符：

| 操作符 | 说明 | 示例 |
|-------|------|------|
| `equals` | 等于 | `code === 200` |
| `contains` | 包含 | `message contains "success"` |
| `gt` | 大于 | `count > 0` |
| `lt` | 小于 | `latency < 1000` |
| `gte` | 大于等于 | `total >= 10` |
| `lte` | 小于等于 | `pageSize <= 100` |

#### 代码实现：

```typescript
// 检查某个字段是否应该标红
const shouldHighlight = (fieldName: string, actualValue: any) => {
  // 1. 如果测试没有通过，不标红
  if (result.status !== 'passed') {
    return false
  }

  // 2. 如果有验证规则，根据验证规则判断
  const fieldValidation = validatedFields[fieldName]
  if (fieldValidation) {
    const { operator, expectedValue } = fieldValidation
    switch (operator) {
      case 'equals':
        return actualValue === expectedValue
      case 'contains':
        return String(actualValue).includes(String(expectedValue))
      case 'gt':
        return actualValue > expectedValue
      case 'lt':
        return actualValue < expectedValue
      case 'gte':
        return actualValue >= expectedValue
      case 'lte':
        return actualValue <= expectedValue
      default:
        return false
    }
  }

  // 3. 如果没有验证规则，不标红（避免盲目标红）
  return false
}
```

## 使用示例

### TS020 测试用例配置：

```json
{
  "case_id": "TS020",
  "test_name": "Creator List",
  "validation_rules": {
    "type": "json_path",
    "checks": [
      {
        "path": "$.code",
        "operator": "equals",
        "value": 200
      }
    ]
  }
}
```

### 显示效果：

**测试通过时（只有 `code` 字段标红）：**
```
┌─────────────────────────────────────────┐
│ 响应信息:                                │
│ ┌─────────────────────────────────────┐ │  ← 默认样式（不标红）
│ │ Status Code: 200                     │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │  ← 默认样式（不标红）
│ │ Success: true                       │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │  ← 默认样式（不标红）
│ │ Message: request success            │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │  ← 红色背景+边框 ✅
│ │ Code: 200                           │ │  在验证规则中定义
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ Response Body: {...}                │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**测试失败时（所有字段都不标红）：**
```
┌─────────────────────────────────────────┐
│ 响应信息:                                │
│ 所有字段都是默认样式                      │
└─────────────────────────────────────────┘
```

## 多个验证规则示例：

```json
{
  "validation_rules": {
    "type": "json_path",
    "checks": [
      {
        "path": "$.code",
        "operator": "equals",
        "value": 200
      },
      {
        "path": "$.Success",
        "operator": "equals",
        "value": true
      },
      {
        "path": "$.Data.total",
        "operator": "gte",
        "value": 100
      }
    ]
  }
}
```

效果：
- `Code: 200` → 标红 ✅
- `Success: true` → 标红 ✅
- `Data.total >= 100` → 标红 ✅
- `Message` → 不标红（没有验证规则）

## 关键优势

1. **精确标红**：只标红在 `validation_rules` 中定义的字段
2. **避免误导**：没有验证规则的字段不会标红，避免混淆
3. **灵活性**：支持多种验证操作符，适应不同的验证需求
4. **可扩展**：可以轻松添加新的验证操作符

## 用户体验提升

- **清晰的验证反馈**：用户可以清楚地看到哪些字段被验证了
- **减少混淆**：不再有"为什么这个字段标红而那个不标红"的疑问
- **更好的调试体验**：失败的测试不会有任何红色高亮，更符合直觉

## 相关文件

- [test-case-detail.tsx](../tarsight-dashboard/components/test-case-detail.tsx) - 测试用例详情组件
- [test_cases.csv](../supabase_version/test_cases.csv) - 测试用例数据
