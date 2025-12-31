#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
API Token 验证器
验证 token 是否有效，过期则提示更新
"""

import os
import requests
import logging
from typing import Optional, Tuple
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# 加载环境变量
load_dotenv()


class TokenValidator:
    """Token 验证器"""

    # 用于验证 token 的 API 端点（使用一个简单的接口）
    VALIDATION_URL = "https://t-stream-iq.tarsv.com/api/rank/popular_trend/list"

    def __init__(self):
        """初始化验证器"""
        self.base_url = os.getenv('BASE_URL')
        self.api_token = os.getenv('API_TOKEN')

    def validate_token(self) -> Tuple[bool, Optional[str]]:
        """
        验证 token 是否有效

        Returns:
            Tuple[bool, Optional[str]]: (是否有效, 错误消息)
        """
        if not self.api_token:
            return False, "未配置 API_TOKEN"

        try:
            # 尝试使用 token 调用 API
            response = requests.post(
                self.VALIDATION_URL,
                headers={
                    'Authorization': self.api_token,
                    'Accept-Language': 'en',
                    'Content-Type': 'application/json'
                },
                json={
                    "limit": 1,
                    "action": "sound",
                    "period": 7,
                    "sort_by": "popular"
                },
                timeout=10
            )

            # 检查响应
            if response.status_code == 200:
                data = response.json()

                # 检查返回的数据中的 code/message
                # 如果 code 是 1001 或 message 包含 "expired"，则 token 过期
                if isinstance(data, dict):
                    code = data.get('code')
                    message = data.get('message', '').lower()

                    if code == 1001 or 'expired' in message or 'logged out' in message:
                        return False, f"Token 已过期: {data.get('message', 'User session has expired or been logged out')}"

                    # 如果 success 为 False，也可能是 token 问题
                    if not data.get('success', True):
                        return False, f"API 返回失败: {data.get('message', 'Unknown error')}"

                # Token 有效
                return True, None

            elif response.status_code == 401:
                return False, "Token 无效或已过期 (401 Unauthorized)"

            elif response.status_code == 403:
                return False, "Token 无权限 (403 Forbidden)"

            else:
                return False, f"Token 验证失败，HTTP {response.status_code}: {response.text[:100]}"

        except requests.exceptions.Timeout:
            return False, "请求超时，请检查网络连接"
        except requests.exceptions.ConnectionError:
            return False, "网络连接失败，请检查网络或 API 地址"
        except Exception as e:
            logger.error(f"Token 验证异常: {e}")
            return False, f"Token 验证异常: {str(e)}"

    def prompt_for_new_token(self) -> Optional[str]:
        """
        提示用户输入新的 token

        Returns:
            Optional[str]: 新的 token，如果用户取消则返回 None
        """
        print("\n" + "="*60)
        print("⚠️  API Token 已过期或无效")
        print("="*60)
        print()
        print("请从浏览器中获取新的 API Token:")
        print("1. 打开 Tarsight 网站")
        print("2. 登录后按 F12 打开开发者工具")
        print("3. 切换到 Network 标签")
        print("4. 刷新页面，找到任意 API 请求")
        print("5. 在请求头中找到 'authorization' 字段")
        print("6. 复制 'Bearer ' 后面的完整 token")
        print()
        print("提示: 新 token 格式类似: eyJ0eXAiOiJKV1QiLCJhbGc...")
        print()

        while True:
            new_token = input("请输入新的 API Token (留空跳过): ").strip()

            if not new_token:
                print("❌ 跳过 token 更新，测试可能无法执行")
                return None

            # 确保格式正确
            if not new_token.startswith('Bearer '):
                new_token = 'Bearer ' + new_token

            # 验证新 token
            print("\n🔍 验证新 token...")
            old_token = self.api_token
            self.api_token = new_token

            is_valid, error_msg = self.validate_token()

            if is_valid:
                print("✅ Token 验证成功!")

                # 询问是否保存到 .env 文件
                save_choice = input("\n是否将新 token 保存到 .env 文件? (y/n): ").strip().lower()
                if save_choice == 'y':
                    self._save_token_to_env(new_token)
                    print("✅ Token 已保存到 .env 文件")

                return new_token
            else:
                print(f"❌ Token 验证失败: {error_msg}")
                print("请重新输入")
                self.api_token = old_token

    def _save_token_to_env(self, new_token: str):
        """保存 token 到 .env 文件"""
        try:
            env_file = '.env'

            # 读取现有内容
            lines = []
            if os.path.exists(env_file):
                with open(env_file, 'r', encoding='utf-8') as f:
                    lines = f.readlines()

            # 查找并替换 API_TOKEN 行
            found = False
            for i, line in enumerate(lines):
                if line.startswith('API_TOKEN='):
                    lines[i] = f'API_TOKEN={new_token}\n'
                    found = True
                    break

            # 如果没找到，添加新行
            if not found:
                lines.append(f'API_TOKEN={new_token}\n')

            # 写回文件
            with open(env_file, 'w', encoding='utf-8') as f:
                f.writelines(lines)

        except Exception as e:
            logger.error(f"保存 token 到 .env 失败: {e}")
            print(f"⚠️  保存 token 失败: {e}")

    def ensure_valid_token(self) -> bool:
        """
        确保 token 有效，如果无效则提示用户更新

        Returns:
            bool: token 是否有效
        """
        print("🔍 验证 API Token...")
        is_valid, error_msg = self.validate_token()

        if is_valid:
            print("✅ Token 有效")
            return True
        else:
            print(f"❌ {error_msg}")
            new_token = self.prompt_for_new_token()

            if new_token:
                # 更新环境变量
                os.environ['API_TOKEN'] = new_token
                self.api_token = new_token
                return True
            else:
                return False


def get_token_validator() -> TokenValidator:
    """获取 Token 验证实例"""
    return TokenValidator()


def validate_token_before_test() -> bool:
    """
    在测试前验证 token 的便捷函数

    Returns:
        bool: token 是否有效，如果无效且用户取消更新则返回 False
    """
    validator = get_token_validator()
    return validator.ensure_valid_token()


if __name__ == '__main__':
    """测试 token 验证器"""
    validator = get_token_validator()
    is_valid = validator.ensure_valid_token()

    if is_valid:
        print("\n✅ Token 验证完成，可以执行测试")
    else:
        print("\n❌ Token 无效，无法执行测试")
