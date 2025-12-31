# 测试用例ID过滤功能实现文档

## 概述
本次更新为 run.py 添加了 `--case-ids` 参数支持,允许用户指定要执行的测试用例ID列表,而不是执行所有测试或整个模块的测试。

## 实现细节

### 1. run.py 参数添加
在 run.py 的参数解析器中添加了新参数:
```python
parser.add_argument(
    "--case-ids",
    help="指定要执行的测试用例ID列表(用逗号分隔),例如: API001,API002"
)
```

### 2. 环境变量传递
修改 `run_tests_and_save_to_json` 函数:
- 新增 `case_ids` 参数
- 将 case_ids 通过环境变量 `TARGET_CASE_IDS` 传递给 pytest

```python
def run_tests_and_save_to_json(selected_modules, execution_name, case_ids=None):
    # ...
    if case_ids:
        env['TARGET_CASE_IDS'] = case_ids
```

### 3. 测试过滤逻辑
在 `utils/test_tarsight.py` 中添加用例ID过滤:
```python
# 检查是否需要按用例ID过滤(通过环境变量)
target_case_ids = os.environ.get('TARGET_CASE_IDS')
if target_case_ids:
    target_ids = [cid.strip() for cid in target_case_ids.split(',')]
    if case_id not in target_ids:
        pytest.skip(f"跳过非指定用例ID '{case_id}' 的测试")
```

### 4. 前端API路由更新
更新 `tarsight-dashboard/app/api/test/execute/route.ts`:
- 移除临时的 `--all` 参数使用
- 改用 `--case-ids` 参数执行指定的测试用例

```typescript
const caseIdsStr = testCaseArgs.join(',')
const command = venvExists
  ? `cd /Users/zhangshuai/WorkSpace/Tarsight/supabase_version && ${pythonCmd} run.py --case-ids="${caseIdsStr}" --name="手动执行 - ${new Date().toLocaleString('zh-CN')}"`
  : `cd /Users/zhangshuai/WorkSpace/Tarsight/supabase_version && PYTHONPATH=. python3 run.py --case-ids="${caseIdsStr}" --name="手动执行 - ${new Date().toLocaleString('zh-CN')}"`
```

## 使用方法

### 命令行执行
```bash
# 执行单个测试用例
python run.py --case-ids="API001"

# 执行多个测试用例
python run.py --case-ids="API001,API002,API003"

# 结合其他参数使用
python run.py --case-ids="API001,API002" --name="冒烟测试" --no-import
```

### 前端界面
1. 进入测试用例列表页面
2. 点击单个测试用例的"执行"按钮
3. 系统会自动调用后端API,传递该用例的ID
4. 只执行指定的测试用例

## 技术特点

1. **向后兼容**: 不影响现有的 `--all` 和交互式选择模式
2. **灵活性**: 支持同时指定多个用例ID,用逗号分隔
3. **性能优化**: 只执行指定的用例,跳过不相关的测试,提高执行效率
4. **环境变量传递**: 使用 pytest 的环境变量机制实现过滤

## 测试建议

1. 测试单个用例执行
```bash
python run.py --case-ids="API001"
```

2. 测试多个用例执行
```bash
python run.py --case-ids="API001,API002,API003"
```

3. 测试不存在的用例ID
```bash
python run.py --case-ids="NONEXISTENT"
```

4. 测试前端单个用例执行功能

## 文件修改清单

- [run.py:237-240](run.py#L237-L240) - 添加 --case-ids 参数
- [run.py:119-144](run.py#L119-L144) - 更新 run_tests_and_save_to_json 函数
- [run.py:276-295](run.py#L276-L295) - 更新主函数逻辑
- [utils/test_tarsight.py:59-64](utils/test_tarsight.py#L59-L64) - 添加用例ID过滤逻辑
- [tarsight-dashboard/app/api/test/execute/route.ts:46-59](tarsight-dashboard/app/api/test/execute/route.ts#L46-L59) - 更新API路由

## 注意事项

1. 用例ID必须在数据库中存在,否则该用例会被跳过
2. 用例ID之间使用逗号分隔,不要有空格
3. 当使用 `--case-ids` 参数时,会自动选择所有模块,然后通过用例ID过滤
4. 执行结果会正常记录到 Supabase,与完整测试执行一致
