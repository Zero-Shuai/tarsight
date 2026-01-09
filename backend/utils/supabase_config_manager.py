#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Supabase 配置管理器
支持数据库配置和本地配置的混合使用
"""

import os
import asyncio
from typing import Optional, Union, Dict, Any, List
from dotenv import load_dotenv
from pathlib import Path

from .config_manager import ConfigManager
from .supabase_client import get_supabase_client


class SupabaseConfigManager:
    """Supabase 配置管理器"""

    def __init__(self, env_file: str = ".env", project_id: Optional[str] = None):
        """
        初始化配置管理器

        Args:
            env_file: .env 文件路径
            project_id: Supabase 项目ID
        """
        self.env_file = Path(env_file)
        self.local_config = ConfigManager(env_file)
        self.project_id = project_id
        self.supabase_client = None

        # 如果提供了项目ID，初始化 Supabase 客户端
        if project_id:
            self.supabase_client = get_supabase_client()

        self.load_env()

    def load_env(self):
        """加载环境变量"""
        if self.env_file.exists():
            load_dotenv(self.env_file)

    async def get(self, key: str, default: Optional[str] = None,
                 cast_type: type = str, use_database: bool = True) -> Union[str, int, bool, float]:
        """
        获取配置项，优先从数据库获取

        Args:
            key: 配置键名
            default: 默认值
            cast_type: 类型转换
            use_database: 是否使用数据库配置

        Returns:
            配置值
        """
        # 如果启用数据库且项目ID存在，尝试从数据库获取
        if use_database and self.project_id and self.supabase_client:
            try:
                # 首先尝试项目级配置
                value = await self.supabase_client.get_project_config(self.project_id, key)
                if value is not None:
                    return self._cast_value(value, cast_type)

                # 然后尝试全局配置
                value = await self.supabase_client.get_global_config(key)
                if value is not None:
                    return self._cast_value(value, cast_type)
            except Exception as e:
                print(f"从数据库获取配置失败 {key}: {e}")

        # 回退到本地配置
        return self.local_config.get(key, default, cast_type)

    async def set(self, key: str, value: Union[str, int, bool, float],
                 save_to_database: bool = True, description: str = "") -> bool:
        """
        设置配置项

        Args:
            key: 配置键名
            value: 配置值
            save_to_database: 是否保存到数据库
            description: 配置描述

        Returns:
            设置是否成功
        """
        # 保存到数据库
        if save_to_database and self.project_id and self.supabase_client:
            try:
                success = await self.supabase_client.set_project_config(
                    self.project_id, key, value, description
                )
                if not success:
                    print(f"保存配置到数据库失败: {key}")
            except Exception as e:
                print(f"保存配置到数据库异常 {key}: {e}")

        # 同时保存到本地环境变量（仅当前会话有效）
        os.environ[key] = str(value)
        return True

    # =============================================
    # API 配置（继承原有接口）
    # =============================================

    async def base_url(self) -> str:
        """API 基础 URL"""
        return await self.get("BASE_URL", "https://t-stream-iq.tarsv.com")

    async def api_token(self) -> str:
        """API Token"""
        return await self.get("API_TOKEN", "Bearer PASTE_VALID_TOKEN_HERE")

    async def headers(self) -> Dict[str, str]:
        """默认请求头"""
        return {
            "Authorization": await self.api_token(),
            "Accept-Language": await self.get("ACCEPT_LANGUAGE", "en"),
        }

    # =============================================
    # 企业微信推送配置
    # =============================================

    async def wechat_webhook_url(self) -> str:
        """企业微信 Webhook URL"""
        return await self.get("WECHAT_WEBHOOK_URL", "")

    async def enable_wechat_notification(self) -> bool:
        """是否启用企业微信推送"""
        return await self.get("ENABLE_WECHAT_NOTIFICATION", False, bool)

    # =============================================
    # 测试报告配置
    # =============================================

    async def reports_dir(self) -> str:
        """测试报告目录"""
        return await self.get("REPORTS_DIR", "reports")

    async def allure_reports_dir(self) -> str:
        """Allure 报告目录"""
        return await self.get("ALLURE_REPORTS_DIR", "reports")

    async def generate_html_report(self) -> bool:
        """是否生成 HTML 报告"""
        return await self.get("GENERATE_HTML_REPORT", True, bool)

    async def max_test_display(self) -> int:
        """测试结果显示限制"""
        return await self.get("MAX_TEST_DISPLAY", 0, int)

    # =============================================
    # 测试配置
    # =============================================

    async def default_timeout(self) -> int:
        """默认超时时间"""
        return await self.get("DEFAULT_TIMEOUT", 30, int)

    async def http_timeout(self) -> int:
        """HTTP 请求超时时间"""
        return await self.get("HTTP_TIMEOUT", 30, int)

    async def verbose_output(self) -> bool:
        """是否启用详细输出"""
        return await self.get("VERBOSE_OUTPUT", False, bool)

    # =============================================
    # 安全配置
    # =============================================

    async def config_encryption_key(self) -> str:
        """配置加密密钥"""
        return await self.get("CONFIG_ENCRYPTION_KEY", "")

    # =============================================
    # 本地化配置
    # =============================================

    async def timezone(self) -> str:
        """时区设置"""
        return await self.get("TIMEZONE", "Asia/Shanghai")

    # =============================================
    # 开发配置
    # =============================================

    async def debug_mode(self) -> bool:
        """开发模式"""
        return await self.get("DEBUG_MODE", False, bool)

    async def log_level(self) -> str:
        """日志级别"""
        return await self.get("LOG_LEVEL", "INFO")

    async def enable_performance_tests(self) -> bool:
        """是否启用性能测试"""
        return await self.get("ENABLE_PERFORMANCE_TESTS", True, bool)

    async def performance_max_response_time(self) -> float:
        """性能测试最大响应时间"""
        return await self.get("PERFORMANCE_MAX_RESPONSE_TIME", 5.0, float)

    # =============================================
    # Supabase 特定配置
    # =============================================

    async def supabase_url(self) -> str:
        """Supabase URL"""
        return await self.get("SUPABASE_URL", "", use_database=False)

    async def supabase_anon_key(self) -> str:
        """Supabase 匿名密钥"""
        return await self.get("SUPABASE_ANON_KEY", "", use_database=False)

    async def supabase_service_key(self) -> str:
        """Supabase 服务密钥"""
        return await self.get("SUPABASE_SERVICE_KEY", "", use_database=False)

    # =============================================
    # 项目特定配置
    # =============================================

    async def target_project(self) -> str:
        """目标项目ID"""
        return await self.get("TARGET_PROJECT", "")

    async def target_module(self) -> str:
        """目标模块"""
        return await self.get("TARGET_MODULE", "")

    # =============================================
    # 配置同步方法
    # =============================================

    async def sync_local_to_database(self, keys: Optional[List[str]] = None) -> bool:
        """
        将本地配置同步到数据库

        Args:
            keys: 要同步的配置键列表，None表示同步所有配置

        Returns:
            同步是否成功
        """
        if not self.project_id or not self.supabase_client:
            print("未设置项目ID或Supabase客户端，无法同步配置")
            return False

        # 定义需要同步的配置键
        sync_keys = keys or [
            "BASE_URL", "API_TOKEN", "DEFAULT_TIMEOUT", "HTTP_TIMEOUT",
            "ENABLE_WECHAT_NOTIFICATION", "WECHAT_WEBHOOK_URL",
            "DEBUG_MODE", "LOG_LEVEL", "ENABLE_PERFORMANCE_TESTS",
            "PERFORMANCE_MAX_RESPONSE_TIME", "REPORTS_DIR"
        ]

        success_count = 0
        for key in sync_keys:
            value = os.getenv(key)
            if value is not None:
                try:
                    success = await self.set(key, value, save_to_database=True,
                                           description=f"从本地配置同步: {key}")
                    if success:
                        success_count += 1
                except Exception as e:
                    print(f"同步配置失败 {key}: {e}")

        print(f"成功同步 {success_count}/{len(sync_keys)} 个配置项")
        return success_count > 0

    async def sync_database_to_local(self) -> bool:
        """
        将数据库配置同步到本地环境变量

        Returns:
            同步是否成功
        """
        if not self.project_id or not self.supabase_client:
            print("未设置项目ID或Supabase客户端，无法同步配置")
            return False

        try:
            # 获取项目配置
            project_configs = self.supabase_client.table('project_configs').select('*').eq('project_id', self.project_id).execute()

            if project_configs.data:
                for config in project_configs.data:
                    os.environ[config['config_key']] = str(config['config_value'])

            print(f"成功同步 {len(project_configs.data)} 个项目配置到本地")
            return True
        except Exception as e:
            print(f"同步配置到本地失败: {e}")
            return False

    # =============================================
    # 客户端管理
    # =============================================

    def get_supabase_client(self):
        """获取 Supabase 客户端"""
        return self.supabase_client

    # =============================================
    # 工具方法
    # =============================================

    def _cast_value(self, value: Any, cast_type: type) -> Union[str, int, bool, float]:
        """类型转换"""
        if value is None:
            return None

        if cast_type == bool:
            return str(value).lower() in ('true', '1', 'yes', 'on')
        elif cast_type == int:
            return int(value)
        elif cast_type == float:
            return float(value)
        else:
            return str(value)

    async def print_config(self, include_database: bool = True):
        """打印所有配置项（隐藏敏感信息）"""
        print("📋 当前配置:")
        print("=" * 50)

        # 本地配置
        safe_configs = {
            "BASE_URL": await self.base_url(),
            "API_TOKEN": "***已隐藏***" if await self.api_token() else "未设置",
            "REPORTS_DIR": await self.reports_dir(),
            "ENABLE_WECHAT_NOTIFICATION": await self.enable_wechat_notification(),
            "VERBOSE_OUTPUT": await self.verbose_output(),
            "DEBUG_MODE": await self.debug_mode(),
            "TIMEZONE": await self.timezone(),
            "LOG_LEVEL": await self.log_level(),
        }

        print("🏠 本地配置:")
        for key, value in safe_configs.items():
            print(f"  {key}: {value}")

        # 数据库配置
        if include_database and self.project_id and self.supabase_client:
            print("\n🗄️ 数据库配置:")
            print(f"  项目ID: {self.project_id}")

            try:
                project_configs = self.supabase_client.table('project_configs').select('config_key, config_value').eq('project_id', self.project_id).execute()

                if project_configs.data:
                    for config in project_configs.data:
                        key = config['config_key']
                        value = config['config_value']

                        # 隐藏敏感信息
                        if 'TOKEN' in key.upper() or 'PASSWORD' in key.upper() or 'KEY' in key.upper():
                            value = "***已隐藏***"
                        elif isinstance(value, (dict, list)):
                            value = f"<{type(value).__name__} 数据>"
                        else:
                            value = str(value)

                        print(f"  {key}: {value}")
                else:
                    print("  (暂无项目配置)")
            except Exception as e:
                print(f"  获取数据库配置失败: {e}")


# 全局配置实例
_supabase_config: Optional[SupabaseConfigManager] = None


def get_supabase_config(project_id: Optional[str] = None, env_file: str = ".env") -> SupabaseConfigManager:
    """获取 Supabase 配置管理器实例"""
    global _supabase_config
    if _supabase_config is None:
        _supabase_config = SupabaseConfigManager(env_file, project_id)
    return _supabase_config


def init_supabase_config(project_id: str, env_file: str = ".env") -> SupabaseConfigManager:
    """初始化 Supabase 配置管理器"""
    global _supabase_config
    _supabase_config = SupabaseConfigManager(env_file, project_id)
    return _supabase_config