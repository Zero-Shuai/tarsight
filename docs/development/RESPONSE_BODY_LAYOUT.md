# 响应信息展示优化

## 更新内容

### 文件：`tarsight-dashboard/components/test-case-detail.tsx`

#### 新的 Response Body 展示结构：

响应信息部分现在分为三个区块展示：

```
┌─────────────────────────────────────────┐
│ 响应信息:                                │
│ ┌─────────────────────────────────────┐ │
│ │ 1. 验证情况                          │ │
│ │    Status Code: 200                 │ │
│ │    Success: true                    │ │
│ │    Code: 200                        │ │
│ │    Message: request success         │ │
│ │    Response Time: 1520ms            │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ 2. Response Headers                 │ │
│ │    {...headers...}                  │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ 3. Response Body      ▶ [可折叠]    │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 详细说明：

#### 1. 验证情况区块
- **显示内容**：关键的验证字段
  - Status Code
  - Success
  - Code
  - Message
  - Response Time
- **布局**：横向排列，每个字段在一行
- **样式**：白色背景，清晰的标签

#### 2. Response Headers 区块
- **显示内容**：完整的 HTTP 响应头
- **布局**：JSON 格式展示
- **样式**：灰色背景，最大高度 40px（可滚动）

#### 3. Response Body 区块（可折叠）
- **默认状态**：折叠，只显示标题和展开箭头（▶）
- **展开状态**：显示完整的 JSON 数据
- **交互**：点击标题栏可切换展开/折叠
- **样式**：灰色背景，最大高度 60（可滚动）

### 代码实现：

```tsx
const [responseExpanded, setResponseExpanded] = React.useState(false)

{/* 1. 验证情况 */}
<div className="p-2 rounded bg-background">
  <p className="text-xs text-muted-foreground mb-2">验证情况:</p>
  <div className="space-y-1 text-xs">
    <div className="flex items-center gap-2">
      <span className="font-medium">Status Code:</span>
      <Badge>{result.response_info['Status Code']}</Badge>
    </div>
    {/* 其他字段... */}
  </div>
</div>

{/* 2. 响应头 */}
{result.response_info.Headers && (
  <div className="p-2 rounded bg-background">
    <p className="text-xs text-muted-foreground mb-1">Response Headers:</p>
    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-40">
      {JSON.stringify(result.response_info.Headers, null, 2)}
    </pre>
  </div>
)}

{/* 3. Response Body - 可折叠 */}
{result.response_info.Data && (
  <div className="p-2 rounded bg-background">
    <div
      className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-1 rounded"
      onClick={() => setResponseExpanded(!responseExpanded)}
    >
      <p className="text-xs text-muted-foreground">Response Body:</p>
      <span className="text-xs text-muted-foreground">
        {responseExpanded ? '▼' : '▶'}
      </span>
    </div>
    {responseExpanded && (
      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-60 mt-2">
        {JSON.stringify(result.response_info.Data, null, 2)}
      </pre>
    )}
  </div>
)}
```

## 用户体验提升

1. **信息分层清晰**：
   - 验证情况：最关键的信息，一目了然
   - Response Headers：技术细节，需要时查看
   - Response Body：大数据，默认折叠避免占用空间

2. **减少滚动**：
   - Response Body 默认折叠，减少页面高度
   - 用户需要时点击展开即可查看完整数据

3. **更好的可读性**：
   - 验证字段横向排列，紧凑且清晰
   - 每个区块独立样式，易于区分

## 使用场景

### 快速查看验证结果：
展开测试用例后，直接看到"验证情况"区块，所有关键信息一目了然。

### 需要查看响应头：
"Response Headers" 区块始终展开，可以直接查看。

### 需要查看完整数据：
点击 "Response Body ▶" 展开查看完整的 JSON 数据。

## 相关文件

- [test-case-detail.tsx](../tarsight-dashboard/components/test-case-detail.tsx) - 测试用例详情组件
