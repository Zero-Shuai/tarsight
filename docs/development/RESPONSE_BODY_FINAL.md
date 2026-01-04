# Response Body 展示优化 - 最终版

## 更新内容

### 文件：`tarsight-dashboard/components/test-case-detail.tsx`

#### 实现的改进：

1. **Response Body 默认展开**
   - 初始状态为 `true`，展开时显示 ▼
   - 点击标题可以折叠/展开

2. **显示完整的 response_info**
   - Success（带 Badge 样式）
   - Message
   - Code
   - Data（完整 JSON）

3. **格式化展示**
   - 每个字段独立显示
   - 使用 JSON 格式展示（带引号的键名）
   - 清晰的视觉层次

## 展示效果

### 默认状态（展开）：

```
┌─────────────────────────────────────────┐
│ 响应信息:                                │
│ ┌─────────────────────────────────────┐ │
│ │ 验证情况:                            │ │
│ │ Status Code: 200                    │ │
│ │ Success: true                       │ │
│ │ Code: 200                           │ │
│ │ Message: request success            │ │
│ │ Response Time: 1520ms               │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ Response Headers:                   │ │
│ │ {...headers...}                     │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ Response Body               ▼      │ │
│ │                                     │ │
│ │ "Success":                          │ │
│ │   [true] (绿色 Badge)                │ │
│ │                                     │ │
│ │ "Message":                          │ │
│ │   "request success"                 │ │
│ │                                     │ │
│ │ "Code":                             │ │
│ │   200                               │ │
│ │                                     │ │
│ │ "Data":                             │ │
│ │   {                                 │ │
│ │     "list": [...],                  │ │
│ │     "page": 1,                      │ │
│ │     "pageSize": 10,                 │ │
│ │     "total": 10000                  │ │
│ │   }                                 │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 点击折叠后：

```
┌─────────────────────────────────────┐
│ Response Body               ▶        │  ← 折叠
└─────────────────────────────────────┘
```

## 代码实现

### 状态管理：

```typescript
const [responseExpanded, setResponseExpanded] = React.useState(true) // 默认展开
```

### Response Body 组件结构：

```tsx
<div className="p-2 rounded bg-background">
  {/* 可点击的标题栏 */}
  <div
    className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-1 rounded"
    onClick={() => setResponseExpanded(!responseExpanded)}
  >
    <p className="text-xs text-muted-foreground">Response Body:</p>
    <span className="text-xs text-muted-foreground">
      {responseExpanded ? '▼' : '▶'}
    </span>
  </div>

  {/* 展开时显示内容 */}
  {responseExpanded && (
    <div className="mt-2 space-y-2">
      {/* Success */}
      {result.response_info['Success'] !== undefined && (
        <div className="text-xs bg-muted p-2 rounded">
          <span className="font-mono">"Success": </span>
          <Badge variant={...}>true/false</Badge>
        </div>
      )}

      {/* Message */}
      {result.response_info['Message'] && (
        <div className="text-xs bg-muted p-2 rounded">
          <span className="font-mono">"Message": </span>
          <span>"{...}"</span>
        </div>
      )}

      {/* Code */}
      {result.response_info['Code'] !== undefined && (
        <div className="text-xs bg-muted p-2 rounded">
          <span className="font-mono">"Code": </span>
          <span className="font-mono">200</span>
        </div>
      )}

      {/* Data */}
      {result.response_info.Data && (
        <div className="text-xs bg-muted p-2 rounded">
          <span className="font-mono block mb-2">"Data":</span>
          <pre className="text-xs bg-background p-2 rounded overflow-x-auto max-h-60">
            {JSON.stringify(result.response_info.Data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )}
</div>
```

## 字段说明

| 字段 | 显示格式 | 说明 |
|-----|---------|------|
| Success | `"Success": [Badge]` | 使用 Badge 组件，true 为绿色，false 为红色 |
| Message | `"Message": "文本"` | 显示为带引号的字符串 |
| Code | `"Code": 200` | 使用等宽字体显示 |
| Data | `"Data": {...}` | 完整的 JSON 格式，可滚动 |

## 用户体验提升

1. **默认展开**：用户打开测试详情就能看到关键数据
2. **清晰分层**：每个字段独立显示，易于理解
3. **完整展示**：显示 response_info 的所有重要字段
4. **可选折叠**：需要时可以折叠以节省空间
5. **视觉友好**：使用不同的背景色和样式区分层级

## 与之前版本的对比

### 之前：
- 只显示 `Data` 字段
- 数据未格式化
- 默认折叠

### 现在：
- 显示 `Success`、`Message`、`Code`、`Data` 完整字段
- 每个字段独立格式化展示
- 默认展开
- 更好的视觉层次

## 相关文件

- [test-case-detail.tsx](../tarsight-dashboard/components/test-case-detail.tsx) - 测试用例详情组件
