# 断言系统使用指南

Tarsight 断言系统 v2.0 提供了强大的 API 响应验证功能，支持 6 种断言类型。

## 目录

1. [断言类型](#断言类型)
2. [操作符说明](#操作符说明)
3. [使用示例](#使用示例)
4. [最佳实践](#最佳实践)
5. [常见问题](#常见问题)

---

## 断言类型

### 1. 状态码断言 (Status Code)

验证 HTTP 响应状态码。

**支持的操作符:**
- `equals` - 等于指定值
- `one_of` - 在指定值列表中
- `gt` - 大于指定值
- `lt` - 小于指定值
- `gte` - 大于等于指定值
- `lte` - 小于等于指定值

**示例:**
```json
{
  "type": "status_code",
  "operator": "equals",
  "expectedValue": 200
}
```

### 2. 响应时间断言 (Response Time)

验证 API 响应时间（单位：毫秒）。

**支持的操作符:**
- `lt` - 小于指定时间
- `gt` - 大于指定时间
- `lte` - 小于等于指定时间
- `gte` - 大于等于指定时间

**示例:**
```json
{
  "type": "response_time",
  "operator": "lt",
  "expectedValue": 1000
}
```

### 3. 响应头断言 (Header)

验证响应头的值或存在性。

**支持的操作符:**
- `exists` - Header 存在
- `equals` - 等于指定值
- `contains` - 包含指定字符串
- `regex` - 匹配正则表达式

**示例:**
```json
{
  "type": "header",
  "headerName": "Content-Type",
  "operator": "contains",
  "expectedValue": "application/json"
}
```

### 4. JSON Body 断言 (JSON Body)

使用 JSONPath 验证响应体中的字段。

**支持的操作符:**
- `equals` - 等于
- `not_equals` - 不等于
- `contains` - 包含
- `not_contains` - 不包含
- `gt` - 大于
- `lt` - 小于
- `gte` - 大于等于
- `lte` - 小于等于
- `type` - 类型检查
- `exists` - 字段存在
- `empty` - 为空

**JSONPath 语法:**
- `$.field` - 根字段
- `$.data.user.id` - 嵌套字段
- `$.items[0]` - 数组第一个元素
- `$.items[*]` - 数组所有元素

**示例:**
```json
{
  "type": "json_body",
  "jsonPath": "$.data.user.id",
  "operator": "equals",
  "expectedValue": 123
}
```

### 5. JSON Schema 断言 (JSON Schema)

使用 JSON Schema 完整验证响应结构。

**示例:**
```json
{
  "type": "json_schema",
  "schema": {
    "type": "object",
    "properties": {
      "id": { "type": "integer" },
      "name": { "type": "string", "minLength": 3 },
      "email": { "type": "string", "format": "email" }
    },
    "required": ["id", "name"]
  }
}
```

### 6. JavaScript 断言 (JavaScript)

使用 JavaScript 编写自定义验证逻辑。

**⚠️ 注意:** JavaScript 断言当前版本暂未实现，请使用其他断言类型。

---

## 操作符说明

| 操作符 | 说明 | 适用类型 | 示例 |
|--------|------|----------|------|
| `equals` | 等于 | 所有 | `expectedValue == actualValue` |
| `not_equals` | 不等于 | JSON Body | `expectedValue != actualValue` |
| `contains` | 包含 | Header, JSON Body | `"value" in actualValue` |
| `not_contains` | 不包含 | JSON Body | `"value" not in actualValue` |
| `gt` | 大于 | 所有数值比较 | `actualValue > 10` |
| `lt` | 小于 | 所有数值比较 | `actualValue < 100` |
| `gte` | 大于等于 | 所有数值比较 | `actualValue >= 1` |
| `lte` | 小于等于 | 所有数值比较 | `actualValue <= 10` |
| `type` | 类型检查 | JSON Body | `typeof actualValue === "string"` |
| `exists` | 存在 | Header, JSON Body | `field in response` |
| `empty` | 为空 | JSON Body | `array.length === 0` |
| `regex` | 正则匹配 | Header, JSON Body | `/pattern/.test(actualValue)` |
| `one_of` | 其中一个 | Status Code | `value in [200, 201, 204]` |

---

## 使用示例

### 示例 1: REST API 完整验证

验证用户列表 API：
```json
{
  "version": "2.0",
  "stopOnFailure": true,
  "assertions": [
    {
      "type": "status_code",
      "operator": "equals",
      "expectedValue": 200,
      "enabled": true,
      "critical": true,
      "id": "assert-1"
    },
    {
      "type": "response_time",
      "operator": "lt",
      "expectedValue": 1000,
      "enabled": true,
      "critical": false,
      "id": "assert-2"
    },
    {
      "type": "header",
      "headerName": "Content-Type",
      "operator": "contains",
      "expectedValue": "application/json",
      "enabled": true,
      "critical": true,
      "id": "assert-3"
    },
    {
      "type": "json_body",
      "jsonPath": "$.code",
      "operator": "equals",
      "expectedValue": 200,
      "enabled": true,
      "critical": true,
      "id": "assert-4"
    },
    {
      "type": "json_body",
      "jsonPath": "$.data.users",
      "operator": "type",
      "expectedValue": "array",
      "enabled": true,
      "critical": false,
      "id": "assert-5"
    }
  ]
}
```

### 示例 2: JSON Schema 验证

验证用户对象结构：
```json
{
  "type": "json_schema",
  "schema": {
    "type": "object",
    "properties": {
      "code": { "type": "number", "const": 200 },
      "message": { "type": "string" },
      "data": {
        "type": "object",
        "properties": {
          "user": {
            "type": "object",
            "properties": {
              "id": { "type": "integer" },
              "username": { "type": "string", "minLength": 3, "maxLength": 20 },
              "email": { "type": "string", "format": "email" }
            },
            "required": ["id", "username", "email"]
          }
        }
      }
    },
    "required": ["code", "message", "data"]
  }
}
```

### 示例 3: 复杂 JSONPath 查询

验证订单列表中价格大于 100 的商品数量：
```json
{
  "type": "json_body",
  "jsonPath": "$.data.items[?(@.price > 100)]",
  "operator": "length_gt",
  "expectedValue": 0
}
```

---

## 最佳实践

### 1. 断言顺序

按重要性从高到低排列断言：
1. **状态码** - 最基本，应首先检查
2. **响应头** - Content-Type 等关键头
3. **响应时间** - 性能要求
4. **业务逻辑** - code 字段等
5. **数据验证** - 具体字段值

### 2. 关键断言标记

- 将影响测试结果的断言标记为"关键"（critical）
- 非关键断言（如响应时间）可以取消关键标记
- 关键断言失败会立即停止执行

### 3. JSONPath 使用技巧

- **简单字段**: `$.user.name`
- **数组元素**: `$.items[0]`
- **所有子元素**: `$.items[*].name`
- **过滤**: `$.items[?(@.price > 10)]`

### 4. 性能考虑

- 避免在单个测试用例中添加过多断言（建议 < 10 个）
- 复杂验证使用 JSON Schema 而不是多个 JSONPath 断言
- 响应时间断言根据实际 SLA 设置合理阈值

### 5. 错误处理

- 使用 JSON Schema 验证整体结构
- 为重要字段添加 `exists` 检查
- 使用 `type` 操作符验证字段类型

---

## 常见问题

### Q: 如何验证数组长度？

使用 `length_equals`、`length_gt` 或 `length_lt` 操作符：

```json
{
  "type": "json_body",
  "jsonPath": "$.data.items",
  "operator": "length_gt",
  "expectedValue": 0
}
```

### Q: 如何验证字段类型？

使用 `type` 操作符：

```json
{
  "type": "json_body",
  "jsonPath": "$.data.user.age",
  "operator": "type",
  "expectedValue": "number"
}
```

支持的类型: `string`, `number`, `boolean`, `array`, `object`, `null`

### Q: JSONPath 和 JSON Schema 如何选择？

- **JSONPath**: 适合验证特定字段值
- **JSON Schema**: 适合验证完整响应结构

建议：先用 JSON Schema 验证结构，再用 JSONPath 验证关键字段。

### Q: 如何调试断言？

1. 查看测试执行日志
2. 失败断言会显示实际值和期望值
3. 使用 `exists` 操作符先确认字段存在
4. 临时使用简单操作符（如 `equals`）验证路径

### Q: 旧版验证规则如何迁移？

系统会自动迁移旧的 `validation_rules` 到新的 `assertions` 格式。打开现有测试用例时会自动转换。

---

## 更多资源

- [JSONPath 语法](https://goessner.net/articles/JsonPath/)
- [JSON Schema 规范](https://json-schema.org/learn/)
- [项目文档索引](/docs/)
