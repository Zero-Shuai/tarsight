#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
配置文件 - 向后兼容
从配置管理器导入配置
"""

from utils.config_manager import config

# 向后兼容 - 保持原有的导入方式
__all__ = ['config']