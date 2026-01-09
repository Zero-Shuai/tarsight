import requests
import allure
import time
import json
import os
import logging

logger = logging.getLogger(__name__)


def api_request(method, url, headers=None, params=None, data=None, json_data=None):
    """发送API请求并记录详细信息到报告中"""

    # 临时禁用代理以解决SSL连接问题
    # 清除所有代理相关的环境变��
    proxy_vars = ['http_proxy', 'https_proxy', 'HTTP_PROXY', 'HTTPS_PROXY',
                  'all_proxy', 'ALL_PROXY', 'no_proxy', 'NO_PROXY']
    original_proxies = {}
    for var in proxy_vars:
        original_proxies[var] = os.environ.pop(var, None)

    try:
        # 请求前的信息
        request_headers = headers.copy() if headers else {}
        request_body = json_data if json_data else data

        with allure.step(f"发送 {method} 请求到 {url}"):
            # 附加请求信息到报告
            if request_headers:
                allure.attach(
                    json.dumps(request_headers, indent=2, ensure_ascii=False),
                    name="请求Headers",
                    attachment_type=allure.attachment_type.JSON
                )

            if request_body:
                if isinstance(request_body, dict):
                    allure.attach(
                        json.dumps(request_body, indent=2, ensure_ascii=False),
                        name="请求Body",
                        attachment_type=allure.attachment_type.JSON
                    )
                else:
                    allure.attach(
                        str(request_body),
                        name="请求Body",
                        attachment_type=allure.attachment_type.TEXT
                    )

            # 发送请求并记录时间
            start_time = time.time()

            # 创建一个新的session并禁用代理
            session = requests.Session()
            session.proxies = {}  # 禁用所有代理
            session.trust_env = False  # 不信任环境变量中的代理设置

            resp = session.request(
                method, url, headers=headers, params=params, data=data, json=json_data,
                verify=True, timeout=30
            )
            response_time = time.time() - start_time

            # 附加响应信息到报告
            allure.attach(str(resp.status_code), "状态码")
            allure.attach(f"{response_time:.3f}s", "响应时间")

            # 附加响应Headers
            if resp.headers:
                allure.attach(
                    json.dumps(dict(resp.headers), indent=2, ensure_ascii=False),
                    name="响应Headers",
                    attachment_type=allure.attachment_type.JSON
                )

            # 附加响应内容
            try:
                # 尝试解析JSON
                response_json = resp.json()
                allure.attach(
                    json.dumps(response_json, indent=2, ensure_ascii=False),
                    name="响应Body",
                    attachment_type=allure.attachment_type.JSON
                )
            except:
                # 如果不是JSON，作为文本附加
                allure.attach(
                    resp.text,
                    name="响应Body",
                    attachment_type=allure.attachment_type.TEXT
                )

            # 打印请求和响应信息到控制台
            logger.info(f"🌐 HTTP {method} {url}")
            logger.info(f"⏱️  响应时间: {response_time:.3f}s")
            logger.info(f"📊 状态码: {resp.status_code}")
            logger.info(f"📄 内容类型: {resp.headers.get('content-type', 'unknown')}")

            logger.debug(f"🔍 请求详情:")
            logger.debug(f"   📡 URL: {url}")
            logger.debug(f"   📝 方法: {method}")
            logger.debug(f"   📋 响应时间: {response_time:.2f}s")
            logger.debug(f"   📊 状态码: {resp.status_code}")

            if request_headers:
                logger.debug(f"   📋 请求头: {json.dumps(request_headers, indent=6, ensure_ascii=False)}")

            if request_body:
                if isinstance(request_body, dict):
                    logger.debug(f"   📦 请求体: {json.dumps(request_body, indent=6, ensure_ascii=False)}")
                else:
                    logger.debug(f"   📦 请求体: {str(request_body)[:200]}...")

            logger.debug(f"📝 响应详情:")
            logger.debug(f"   📊 状态码: {resp.status_code}")
            if resp.status_code == 200:
                logger.debug(f"   ✅ 请求成功")
            else:
                logger.warning(f"   ❌ 请求失败")

            logger.debug(f"   📄 响应类型: {resp.headers.get('content-type', 'unknown')}")

            try:
                response_json = resp.json()
                if 'success' in response_json:
                    logger.debug(f"   🎯 Success: {response_json.get('success')}")
                if 'message' in response_json:
                    logger.debug(f"   💬 Message: {response_json.get('message')}")
                if 'code' in response_json:
                    logger.debug(f"   🔢 Code: {response_json.get('code')}")

                # 特殊处理音频数据
                if 'data' in response_json and isinstance(response_json['data'], dict):
                    data = response_json['data']
                    if 'sound_list' in data and isinstance(data['sound_list'], list):
                        logger.debug(f"   🔊 音频数量: {len(data['sound_list'])}")
                        if len(data['sound_list']) > 0 and 'author' in data['sound_list'][0]:
                            logger.debug(f"   🎵 第一个音频: {data['sound_list'][0].get('author', 'Unknown')}")

                # 只显示部分响应内容
                logger.debug(f"   📋 完整响应: {json.dumps(response_json, indent=6, ensure_ascii=False)[:300]}...")
            except:
                logger.debug(f"   📋 响应内容: {resp.text[:200]}...")

            return resp

    finally:
        # 恢复原始代理环境变量
        for var, value in original_proxies.items():
            if value is not None:
                os.environ[var] = value