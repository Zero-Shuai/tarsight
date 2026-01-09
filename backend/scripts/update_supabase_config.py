#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
快速更新Supabase配置脚本
将配置从INACTIVE项目切换到ACTIVE项目
"""

import os
from pathlib import Path

def main():
    print("🔧 Tarsight Supabase 配置更新工具")
    print("=" * 60)

    env_file = Path(".env")
    backup_file = Path(".env.backup")

    # 备份原配置
    if env_file.exists():
        import shutil
        shutil.copy(env_file, backup_file)
        print(f"✅ 已备份原配置到: {backup_file}")

    # 读取现有配置
    with open(env_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # 更新配置
    updated_lines = []
    for line in lines:
        if line.startswith('SUPABASE_URL='):
            # 更新为活跃项目URL
            updated_lines.append('SUPABASE_URL=https://gtdzmawwckvpzbbsgssv.supabase.co\n')
            print("✅ 已更新 SUPABASE_URL")
        elif line.startswith('SUPABASE_ANON_KEY='):
            # 保持现有密钥 (用户需要手动从Dashboard获取)
            updated_lines.append(line)
            print("⚠️  SUPABASE_ANON_KEY 需要手动更新")
        elif line.startswith('SUPABASE_SERVICE_KEY='):
            # 保持现有密钥
            updated_lines.append(line)
            print("⚠️  SUPABASE_SERVICE_KEY 需要手动更新")
        else:
            updated_lines.append(line)

    # 写回文件
    with open(env_file, 'w', encoding='utf-8') as f:
        f.writelines(updated_lines)

    print("\n" + "=" * 60)
    print("✅ 配置文件已更新!")
    print("\n📋 下一步操作:")
    print("1. 访问 Supabase Dashboard")
    print("2. 打开项目 'Zero-Shuai's Project'")
    print("3. 进入 Settings → API")
    print("4. 复制新的 Project URL 和 anon public 密钥")
    print("5. 更新 .env 文件中的 SUPABASE_ANON_KEY")
    print("\n💡 提示: 新项目的Project URL已在配置中更新")

if __name__ == "__main__":
    main()
