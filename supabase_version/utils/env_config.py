#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
环境变量统一管理模块
整合所有环境变量的加载、验证和访问
支持多个环境配置文件: .env.supabase, .env.test, .env
"""

import os
import logging
from pathlib import Path
from typing import Optional, Dict, Any, Union
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# 全局配置缓存（单例模式）
_global_config: Optional['EnvConfig'] = None
_config_cache: Dict[str, Any] = {}


class EnvConfig:
    """
    环境变量统一管理器
    提供集中式环境变量管理,支持多个配置文件和类型转换
    """

    # 配置文件优先级（从低到高）
    ENV_FILES = [
        '.env',                # 基础配置
        '.env.supabase',       # Supabase 配置
        '.env.test',           # 测试配置
    ]

    # 项目根目录
    _project_root: Optional[Path] = None

    def __init__(self, project_root: Optional[Path] = None):
        """
        初始化环境配置管理器

        Args:
            project_root: 项目根目录，如果为 None 则自动检测
        """
        self._project_root = project_root or Path(__file__).parent.parent
        self._load_all_env_files()

    def _load_all_env_files(self):
        """按优先级加载所有环境变量文件"""
        for env_file in self.ENV_FILES:
            env_path = self._project_root / env_file
            if env_path.exists():
                # 使用 override=False，不要覆盖已设置的环境变量
                # 这样程序传入的环境变量（如 TARSIGHT_SHARED_RECORDER_FILE）就不会被 .env 覆盖
                load_dotenv(env_path, override=False)
                logger.debug(f"✅ 已加载环境变量文件: {env_file}")

    @classmethod
    def set_project_root(cls, root: Union[str, Path]):
        """设置项目根目录（类方法，用于早期初始化）"""
        cls._project_root = Path(root)

    @staticmethod
    def get(key: str, default: Optional[Any] = None) -> Optional[str]:
        """
        获取环境变量

        Args:
            key: 环境变量键名
            default: 默认值

        Returns:
            环境变量值或默认值
        """
        return os.getenv(key, default)

    @staticmethod
    def get_int(key: str, default: int = 0) -> int:
        """获取整数类型环境变量"""
        value = os.getenv(key)
        if value is None:
            return default
        try:
            return int(value)
        except ValueError:
            logger.warning(f"⚠️ 环境变量 {key} 不是有效整数: {value}, 使用默认值: {default}")
            return default

    @staticmethod
    def get_float(key: str, default: float = 0.0) -> float:
        """获取浮点数类型环境变量"""
        value = os.getenv(key)
        if value is None:
            return default
        try:
            return float(value)
        except ValueError:
            logger.warning(f"⚠️ 环境变量 {key} 不是有效浮点数: {value}, 使用默认值: {default}")
            return default

    @staticmethod
    def get_bool(key: str, default: bool = False) -> bool:
        """获取布尔类型环境变量"""
        value = os.getenv(key)
        if value is None:
            return default
        return value.lower() in ('true', '1', 'yes', 'on')

    @staticmethod
    def get_list(key: str, separator: str = ',', default: Optional[list] = None) -> list:
        """获取列表类型环境变量"""
        value = os.getenv(key)
        if value is None:
            return default or []
        return [item.strip() for item in value.split(separator) if item.strip()]

    @staticmethod
    def set(key: str, value: Any):
        """设置环境变量（仅在当前进程有效）"""
        os.environ[key] = str(value)

    # ==================== Supabase 配置 ====================

    @property
    def supabase_url(self) -> str:
        """Supabase API URL（带缓存）"""
        cache_key = 'supabase_url'
        if cache_key in _config_cache:
            return _config_cache[cache_key]
        url = self.get('SUPABASE_URL')
        if not url:
            raise ValueError("❌ 环境变量 SUPABASE_URL 未设置")
        _config_cache[cache_key] = url
        return url

    @property
    def supabase_anon_key(self) -> str:
        """Supabase Anonymous Key（带缓存）"""
        cache_key = 'supabase_anon_key'
        if cache_key in _config_cache:
            return _config_cache[cache_key]
        key = self.get('SUPABASE_ANON_KEY')
        if not key:
            raise ValueError("❌ 环境变量 SUPABASE_ANON_KEY 未设置")
        _config_cache[cache_key] = key
        return key

    @property
    def supabase_service_role_key(self) -> Optional[str]:
        """Supabase Service Role Key (可选，用于管理员操作)（带缓存）"""
        cache_key = 'supabase_service_role_key'
        if cache_key in _config_cache:
            return _config_cache[cache_key]
        value = self.get('SUPABASE_SERVICE_ROLE_KEY')
        _config_cache[cache_key] = value
        return value

    @property
    def base_url(self) -> str:
        """API 基础 URL（带缓存）"""
        cache_key = 'base_url'
        if cache_key in _config_cache:
            return _config_cache[cache_key]
        value = self.get('BASE_URL', 'https://t-stream-iq.tarsv.com')
        _config_cache[cache_key] = value
        return value

    @property
    def api_token(self) -> str:
        """API Token（带缓存）"""
        cache_key = 'api_token'
        if cache_key in _config_cache:
            return _config_cache[cache_key]
        value = self.get('API_TOKEN', '')
        _config_cache[cache_key] = value
        return value

    # ==================== 日志配置 ====================

    @property
    def log_level(self) -> str:
        """日志级别"""
        return self.get('LOG_LEVEL', 'INFO')

    @property
    def log_format(self) -> str:
        """日志格式"""
        return self.get('LOG_FORMAT', '%(message)s')

    # ==================== 测试报告配置 ====================

    @property
    def reports_dir(self) -> str:
        """测试报告目录"""
        return self.get('REPORTS_DIR', 'reports')

    @property
    def allure_results_dir(self) -> str:
        """Allure 结果目录"""
        return self.get('ALLURE_RESULTS_DIR', 'reports/allure-results')

    # ==================== 验证方法 ====================

    def validate_supabase_config(self) -> bool:
        """验证 Supabase 配置是否完整"""
        try:
            self.supabase_url
            self.supabase_anon_key
            return True
        except ValueError as e:
            logger.error(f"❌ Supabase 配置验证失败: {e}")
            return False

    def print_config_summary(self):
        """打印配置摘要（隐藏敏感信息）"""
        logger.info("📋 环境配置摘要:")
        logger.info("=" * 50)

        # Supabase 配置
        try:
            logger.info(f"🌐 Supabase URL: {self.supabase_url}")
            logger.info(f"🔑 Supabase Key: {'***已设置***' if self.supabase_anon_key else '❌未设置'}")
        except ValueError:
            logger.warning("⚠️ Supabase 配置不完整")

        # 测试配置
        logger.info(f"📊 数据源: {self.data_source}")
        logger.info(f"🎯 目标模块: {self.target_module or '全部'}")
        logger.info(f"📝 JSON 记录: {'✅启用' if self.json_recording else '❌关闭'}")

        # API 配置
        logger.info(f"🌍 Base URL: {self.base_url}")
        logger.info(f"🔑 API Token: {'***已设置***' if self.api_token else '❌未设置'}")

        # 日志配置
        logger.info(f"📋 日志级别: {self.log_level}")

        logger.info("=" * 50)


# 创建全局配置实例
env_config = EnvConfig()


def get_env_config() -> EnvConfig:
    """获取全局环境配置实例"""
    return env_config


# 向后兼容的便捷函数
def get_supabase_config() -> Dict[str, str]:
    """获取 Supabase 配置字典（向后兼容）"""
    return {
        'url': env_config.supabase_url,
        'key': env_config.supabase_anon_key,
    }


if __name__ == "__main__":
    # 测试配置管理器
    logging.basicConfig(
        level=logging.INFO,
        format='%(message)s'
    )

    env_config.print_config_summary()
