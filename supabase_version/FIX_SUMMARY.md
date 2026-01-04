# 问题修复总结

## 问题描述

用户执行 TS020 测试用例时发现：
1. HTTP 状态码返回 200，但业务层返回 `success=false`, `code=1001` "User session has expired"
2. 测试被标记为 "passed"，但实际应该是 "failed"
3. 用户在项目管理中配置了有效的 token，但测试似乎没有使用

## 根本原因分析

### 问题 1: 业务状态码判断逻辑错误
在 `utils/test_tarsight.py:252-256` 中，当 API 返回 `success=false` 时，测试只打印警告信息，但没有断言失败。

**错误代码：**
```python
else:
    # 失败响应的额外验证
    print(f"   ⚠️ API返回失败: {data.get('message', '未知错误')}")
    print(f"   🔢 错误代码: {data.get('code', 'N/A')}")
    # 失败响应可能没有data字段，这是正常的
    # ❌ 没有断言失败！
```

### 问题 2: Token 未正确设置到环境变量
在 `execute_test.py:124-147` 中，虽然从 Supabase 读取了用户的 API token，但没有设置到环境变量，导致测试代码仍使用旧 token。

**错误代码：**
```python
if api_token:
    logger.info("✅ 从用户配置读取 API Token")
    # ❌ 没有设置到环境变量！
```

## 修复方案

### 修复 1: 业务状态码判断逻辑
**文件：** `utils/test_tarsight.py:252-260`

```python
else:
    # 失败响应应该导致测试失败
    error_msg = data.get('message', '未知错误')
    error_code = data.get('code', 'N/A')
    print(f"   ⚠️ API返回失败: {error_msg}")
    print(f"   🔢 错误代码: {error_code}")
    # 断言失败，确保测试被标记为 failed
    assert False, f"API返回失败: {error_msg} (code: {error_code})"
```

### 修复 2: Token 环境变量设置
**文件：** `execute_test.py:137-139`

```python
if api_token:
    logger.info("✅ 从用户配置读取 API Token")
    # 关键：设置到环境变量，确保测试代码能使用
    os.environ['API_TOKEN'] = api_token
```

## 验证结果

### 语法检查
```bash
python3 -m py_compile utils/test_tarsight.py
✅ 语法检查通过
```

### 预期行为
1. **业务失败识别**：当 API 返回 `success=false` 时，测试会被正确标记为 "failed"
2. **Token 正确使用**：从项目管理配置的 token 会被正确应用到所有 API 请求
3. **清晰的错误信息**：测试失败时显示具体的错误消息和错误码

## 影响范围
- `utils/test_tarsight.py` - 测试执行逻辑
- `execute_test.py` - 测试执行入口

## 注意事项
- 配置管理器 (`config_manager.py`) 使用 `@property` 装饰器，每次访问 `headers` 都会重新读取环境变量
- 在测试执行前设置 `API_TOKEN` 环境变量可以确保测试使用最新的 token
- 修复后，所有业务层面的错误（如 token 失效、权限不足等）都会导致测试失败

## 相关文件
- [utils/test_tarsight.py](utils/test_tarsight.py)
- [execute_test.py](execute_test.py)
- [utils/config_manager.py](utils/config_manager.py)
- [utils/conftest.py](utils/conftest.py)
