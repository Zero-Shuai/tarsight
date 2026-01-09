#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
统一配置管理模块
使用环境变量和.env文件管理所有配置项
"""

import os
from pathlib import Path
from typing import Optional, Union
from dotenv import load_dotenv


class ConfigManager:
    """统一配置管理器"""

    def __init__(self, env_file: str = ".env"):
        """
        初始化配置管理器

        Args:
            env_file: .env 文件路径
        """
        self.env_file = Path(env_file)
        self.load_env()

    def load_env(self):
        """加载环境变量"""
        if self.env_file.exists():
            load_dotenv(self.env_file)
        else:
            print(f"⚠️ 未找到环境变量文件: {self.env_file}")

    def get(self, key: str, default: Optional[str] = None,
            cast_type: type = str) -> Union[str, int, bool, float]:
        """
        获取配置项

        Args:
            key: 配置键名
            default: 默认值
            cast_type: 类型转换 (str, int, bool, float)

        Returns:
            配置值
        """
        value = os.getenv(key, default)

        if value is None:
            return default

        if cast_type == bool:
            return value.lower() in ('true', '1', 'yes', 'on')
        elif cast_type == int:
            return int(value)
        elif cast_type == float:
            return float(value)
        else:
            return value

    # 🌐 API 配置
    @property
    def base_url(self) -> str:
        """API 基础 URL"""
        return self.get("BASE_URL", "https://t-stream-iq.tarsv.com")

    @property
    def api_token(self) -> str:
        """API Token"""
        return self.get("API_TOKEN", "Bearer PASTE_VALID_TOKEN_HERE")

    @property
    def headers(self) -> dict:
        """默认请求头"""
        return {
            "Authorization": self.api_token,
            "Accept-Language": self.get("ACCEPT_LANGUAGE", "en"),
        }

    # 📱 企业微信推送配置
    @property
    def wechat_webhook_url(self) -> str:
        """企业微信 Webhook URL"""
        return self.get("WECHAT_WEBHOOK_URL", "")

    @property
    def enable_wechat_notification(self) -> bool:
        """是否启用企业微信推送"""
        return self.get("ENABLE_WECHAT_NOTIFICATION", False, bool)

    # 📊 测试报告配置
    @property
    def reports_dir(self) -> str:
        """测试报告目录"""
        return self.get("REPORTS_DIR", "reports")

    @property
    def allure_reports_dir(self) -> str:
        """Allure 报告目录"""
        return self.get("ALLURE_REPORTS_DIR", "reports")

    @property
    def generate_html_report(self) -> bool:
        """是否生成 HTML 报告"""
        return self.get("GENERATE_HTML_REPORT", True, bool)

    @property
    def max_test_display(self) -> int:
        """测试结果显示限制"""
        return self.get("MAX_TEST_DISPLAY", 0, int)

    # 🧪 测试配置
    @property
    def default_timeout(self) -> int:
        """默认超时时间"""
        return self.get("DEFAULT_TIMEOUT", 30, int)

    @property
    def http_timeout(self) -> int:
        """HTTP 请求超时时间"""
        return self.get("HTTP_TIMEOUT", 30, int)

    @property
    def verbose_output(self) -> bool:
        """是否启用详细输出"""
        return self.get("VERBOSE_OUTPUT", False, bool)

    # 🔐 安全配置
    @property
    def config_encryption_key(self) -> str:
        """配置加密密钥"""
        return self.get("CONFIG_ENCRYPTION_KEY", "")

    # 📁 文件路径配置
    
    # 🌍 本地化配置
    @property
    def timezone(self) -> str:
        """时区设置"""
        return self.get("TIMEZONE", "Asia/Shanghai")

    # 🛠️ Selenium WebDriver 配置
    @property
    def chrome_driver_path(self) -> str:
        """ChromeDriver 路径"""
        return self.get("CHROME_DRIVER_PATH", "")

    @property
    def browser_window_size(self) -> tuple:
        """浏览器窗口大小"""
        size_str = self.get("BROWSER_WINDOW_SIZE", "1920,1080")
        try:
            width, height = map(int, size_str.split(","))
            return (width, height)
        except:
            return (1920, 1080)

    @property
    def page_load_timeout(self) -> int:
        """页面加载超时"""
        return self.get("PAGE_LOAD_TIMEOUT", 30, int)

    @property
    def element_find_timeout(self) -> int:
        """元素查找超时"""
        return self.get("ELEMENT_FIND_TIMEOUT", 10, int)

    # 🚀 开发配置
    @property
    def debug_mode(self) -> bool:
        """开发模式"""
        return self.get("DEBUG_MODE", False, bool)

    @property
    def log_level(self) -> str:
        """日志级别"""
        return self.get("LOG_LEVEL", "INFO")

    @property
    def enable_performance_tests(self) -> bool:
        """是否启用性能测试"""
        return self.get("ENABLE_PERFORMANCE_TESTS", True, bool)

    @property
    def performance_max_response_time(self) -> float:
        """性能测试最大响应时间"""
        return self.get("PERFORMANCE_MAX_RESPONSE_TIME", 5.0, float)

    def set(self, key: str, value: Union[str, int, bool, float]):
        """
        设置配置项（仅在当前进程有效）

        Args:
            key: 配置键名
            value: 配置值
        """
        os.environ[key] = str(value)

    def update_env_file(self, key: str, value: Union[str, int, bool, float]):
        """
        更新.env文件中的配置项

        Args:
            key: 配置键名
            value: 配置值
        """
        if not self.env_file.exists():
            # 如果.env文件不存在，创建它
            self.env_file.touch()

        # 读取现有内容
        lines = []
        if self.env_file.exists():
            with open(self.env_file, 'r', encoding='utf-8') as f:
                lines = f.readlines()

        # 查找并更新配置项
        key_found = False
        for i, line in enumerate(lines):
            if line.strip().startswith(f"{key}="):
                lines[i] = f"{key}={value}\n"
                key_found = True
                break

        # 如果没找到，添加新行
        if not key_found:
            lines.append(f"{key}={value}\n")

        # 写回文件
        with open(self.env_file, 'w', encoding='utf-8') as f:
            f.writelines(lines)

    def print_config(self):
        """打印所有配置项（隐藏敏感信息）"""
        print("📋 当前配置:")
        print("=" * 50)

        safe_configs = {
            "BASE_URL": self.base_url,
            "API_TOKEN": "***已隐藏***" if self.api_token else "未设置",
            "REPORTS_DIR": self.reports_dir,
            "ENABLE_WECHAT_NOTIFICATION": self.enable_wechat_notification,
            "VERBOSE_OUTPUT": self.verbose_output,
            "DEBUG_MODE": self.debug_mode,
            "TIMEZONE": self.timezone,
            "LOG_LEVEL": self.log_level,
        }

        for key, value in safe_configs.items():
            print(f"  {key}: {value}")


# 创建全局配置实例
config = ConfigManager()


# 向后兼容的变量
BASE_URL = config.base_url
TOKEN = config.api_token


if __name__ == "__main__":
    # 测试配置管理器
    config.print_config()