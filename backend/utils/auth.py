"""
用户认证模块

功能：
1. 用户注册
2. 用户登录
3. 用户登出
4. 获取当前用户信息
5. 刷新访问令牌
"""

import os
import json
import requests
from typing import Optional, Dict, Any
from pathlib import Path
from utils.logger import get_logger

logger = get_logger(__name__)


class AuthClient:
    """Supabase 认证客户端"""

    def __init__(self):
        """初始化认证客户端"""
        from utils.env_config import get_env_config
        env_config = get_env_config()

        self.supabase_url = env_config.supabase_url
        self.supabase_key = env_config.supabase_anon_key
        self.auth_url = f"{self.supabase_url}/auth/v1"

        # Token 存储路径
        self.token_dir = Path.home() / '.tarsight'
        self.token_dir.mkdir(exist_ok=True)
        self.token_file = self.token_dir / 'auth_tokens.json'

    def _save_tokens(self, tokens: Dict[str, str]) -> None:
        """保存 tokens 到本地文件"""
        try:
            with open(self.token_file, 'w') as f:
                json.dump(tokens, f, indent=2)
            logger.debug("✅ Tokens 已保存到本地")
        except Exception as e:
            logger.error(f"❌ 保存 tokens 失败: {str(e)}")

    def _load_tokens(self) -> Optional[Dict[str, str]]:
        """从本地文件加载 tokens"""
        try:
            if self.token_file.exists():
                with open(self.token_file, 'r') as f:
                    tokens = json.load(f)
                logger.debug("✅ Tokens 已从本地加载")
                return tokens
        except Exception as e:
            logger.error(f"❌ 加载 tokens 失败: {str(e)}")
        return None

    def _clear_tokens(self) -> None:
        """清除本地 tokens"""
        try:
            if self.token_file.exists():
                self.token_file.unlink()
                logger.debug("✅ 本地 tokens 已清除")
        except Exception as e:
            logger.error(f"❌ 清除 tokens 失败: {str(e)}")

    def sign_up(self, email: str, password: str, user_metadata: Optional[Dict] = None) -> Dict[str, Any]:
        """
        用户注册

        Args:
            email: 邮箱地址
            password: 密码（至少 6 个字符）
            user_metadata: 用户元数据（可选）

        Returns:
            包含用户信息和 token 的字典
        """
        logger.info(f"📝 注册用户: {email}")

        url = f"{self.auth_url}/signup"
        payload = {
            "email": email,
            "password": password,
            "options": {
                "data": user_metadata or {}
            }
        }

        try:
            response = requests.post(url, json=payload, headers={
                "apikey": self.supabase_key,
                "Content-Type": "application/json"
            })

            data = response.json()

            if response.status_code in [200, 201]:
                logger.info(f"✅ 用户注册成功: {email}")

                # 保存 tokens
                if 'access_token' in data:
                    self._save_tokens({
                        'access_token': data['access_token'],
                        'refresh_token': data.get('refresh_token', ''),
                        'user_id': data.get('user', {}).get('id', '')
                    })

                return {
                    'success': True,
                    'user': data.get('user'),
                    'access_token': data.get('access_token'),
                    'refresh_token': data.get('refresh_token')
                }
            else:
                error_msg = data.get('msg', data.get('error_description', '注册失败'))
                logger.error(f"❌ 注册失败: {error_msg}")
                return {
                    'success': False,
                    'error': error_msg
                }

        except Exception as e:
            logger.error(f"❌ 注册异常: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

    def sign_in(self, email: str, password: str) -> Dict[str, Any]:
        """
        用户登录

        Args:
            email: 邮箱地址
            password: 密码

        Returns:
            包含用户信息和 token 的字典
        """
        logger.info(f"🔐 用户登录: {email}")

        url = f"{self.auth_url}/token?grant_type=password"
        payload = {
            "email": email,
            "password": password
        }

        try:
            response = requests.post(url, json=payload, headers={
                "apikey": self.supabase_key,
                "Content-Type": "application/json"
            })

            data = response.json()

            if response.status_code == 200:
                logger.info(f"✅ 用户登录成功: {email}")

                # 保存 tokens
                self._save_tokens({
                    'access_token': data['access_token'],
                    'refresh_token': data['refresh_token'],
                    'user_id': data.get('user', {}).get('id', '')
                })

                return {
                    'success': True,
                    'user': data.get('user'),
                    'access_token': data['access_token'],
                    'refresh_token': data['refresh_token']
                }
            else:
                error_msg = data.get('error_description', '登录失败')
                logger.error(f"❌ 登录失败: {error_msg}")
                return {
                    'success': False,
                    'error': error_msg
                }

        except Exception as e:
            logger.error(f"❌ 登录异常: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

    def sign_out(self, access_token: str) -> Dict[str, Any]:
        """
        用户登出

        Args:
            access_token: 访问令牌

        Returns:
            登出结果
        """
        logger.info("🚪 用户登出")

        url = f"{self.auth_url}/logout"

        try:
            response = requests.post(url, headers={
                "apikey": self.supabase_key,
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            })

            # 清除本地 tokens
            self._clear_tokens()

            if response.status_code == 204:
                logger.info("✅ 用户登出成功")
                return {'success': True}
            else:
                logger.warning("⚠️  登出请求失败（已清除本地 tokens）")
                return {'success': True}

        except Exception as e:
            logger.error(f"❌ 登出异常: {str(e)}")
            # 即使异常也清除本地 tokens
            self._clear_tokens()
            return {'success': False, 'error': str(e)}

    def get_user(self, access_token: str) -> Optional[Dict[str, Any]]:
        """
        获取当前用户信息

        Args:
            access_token: 访问令牌

        Returns:
            用户信息字典
        """
        url = f"{self.auth_url}/user"

        try:
            response = requests.get(url, headers={
                "apikey": self.supabase_key,
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            })

            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"❌ 获取用户信息失败: {response.status_code}")
                return None

        except Exception as e:
            logger.error(f"❌ 获取用户信息异常: {str(e)}")
            return None

    def refresh_access_token(self, refresh_token: str) -> Optional[str]:
        """
        刷新访问令牌

        Args:
            refresh_token: 刷新令牌

        Returns:
            新的访问令牌
        """
        logger.info("🔄 刷新访问令牌")

        url = f"{self.auth_url}/token?grant_type=refresh_token"
        payload = {"refresh_token": refresh_token}

        try:
            response = requests.post(url, json=payload, headers={
                "apikey": self.supabase_key,
                "Content-Type": "application/json"
            })

            if response.status_code == 200:
                data = response.json()
                new_access_token = data.get('access_token')

                # 更新本地 tokens
                tokens = self._load_tokens()
                if tokens:
                    tokens['access_token'] = new_access_token
                    if 'refresh_token' in data:
                        tokens['refresh_token'] = data['refresh_token']
                    self._save_tokens(tokens)

                logger.info("✅ 访问令牌刷新成功")
                return new_access_token
            else:
                logger.error(f"❌ 刷新令牌失败: {response.status_code}")
                return None

        except Exception as e:
            logger.error(f"❌ 刷新令牌异常: {str(e)}")
            return None

    def get_current_token(self) -> Optional[str]:
        """
        从本地获取当前的访问令牌

        Returns:
            访问令牌
        """
        tokens = self._load_tokens()
        if tokens:
            return tokens.get('access_token')
        return None


# 全局认证客户端实例
_auth_client: Optional[AuthClient] = None


def get_auth_client() -> AuthClient:
    """获取认证客户端实例"""
    global _auth_client
    if _auth_client is None:
        _auth_client = AuthClient()
    return _auth_client


def require_auth(func):
    """
    装饰器：要求用户已登录

    用法：
    @require_auth
    def some_function():
        pass
    """
    def wrapper(*args, **kwargs):
        auth_client = get_auth_client()
        access_token = auth_client.get_current_token()

        if not access_token:
            logger.error("❌ 用户未登录，请先执行登录操作")
            logger.info("💡 使用命令: python -m utils.cli login")
            return None

        return func(*args, **kwargs)

    return wrapper
