"""
Enhanced Assertion Engine for Tarsight
Supports multiple assertion types with flexible validation

Assertion Types:
1. status_code - HTTP status code validation
2. response_time - Response time threshold validation
3. header - Response header validation
4. json_body - JSON body validation using JSONPath
5. json_schema - Complete JSON schema validation
6. javascript - Custom JavaScript assertion (not implemented yet)
"""

import json
import re
import logging
from typing import Dict, Any, List, Optional, Tuple
from jsonpath_ng import parse
from jsonschema import validate, ValidationError as JsonSchemaValidationError

logger = logging.getLogger(__name__)


class AssertionEngine:
    """Enhanced assertion engine with multiple assertion types"""

    def __init__(self, stop_on_failure: bool = True):
        """
        Initialize the assertion engine

        Args:
            stop_on_failure: If True, stop execution on first critical assertion failure
        """
        self.stop_on_failure = stop_on_failure
        self.results = []

    def execute_assertions(
        self,
        assertions_config: Dict[str, Any],
        response_data: Dict[str, Any]
    ) -> Tuple[bool, List[Dict[str, Any]]]:
        """
        Execute all assertions and return results

        Args:
            assertions_config: Assertion configuration from database
            response_data: Response data including status, headers, body, time

        Returns:
            Tuple of (all_passed, assertion_results)
        """
        if not assertions_config or 'assertions' not in assertions_config:
            logger.info("No assertions configured")
            return True, []

        assertions = assertions_config.get('assertions', [])
        all_passed = True
        results = []

        for assertion in assertions:
            if not assertion.get('enabled', True):
                logger.debug(f"Assertion {assertion.get('id')} is disabled, skipping")
                continue

            result = self._execute_single_assertion(assertion, response_data)
            results.append(result)

            if not result['passed']:
                all_passed = False
                # Check if we should stop on failure
                should_stop = assertion.get('critical', True) or assertions_config.get('stopOnFailure', self.stop_on_failure)
                if should_stop:
                    logger.error(f"Critical assertion failed: {result['message']}, stopping execution")
                    break

        return all_passed, results

    def _execute_single_assertion(
        self,
        assertion: Dict[str, Any],
        response_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a single assertion based on its type"""

        assertion_type = assertion.get('type')
        assertion_id = assertion.get('id', 'unknown')

        try:
            if assertion_type == 'status_code':
                return self._assert_status_code(assertion, response_data)
            elif assertion_type == 'response_time':
                return self._assert_response_time(assertion, response_data)
            elif assertion_type == 'header':
                return self._assert_header(assertion, response_data)
            elif assertion_type == 'json_body':
                return self._assert_json_body(assertion, response_data)
            elif assertion_type == 'json_schema':
                return self._assert_json_schema(assertion, response_data)
            elif assertion_type == 'javascript':
                return self._assert_javascript(assertion, response_data)
            else:
                return {
                    'id': assertion_id,
                    'type': assertion_type,
                    'passed': False,
                    'message': f"Unknown assertion type: {assertion_type}"
                }
        except Exception as e:
            logger.exception(f"Error executing assertion {assertion_id}")
            return {
                'id': assertion_id,
                'type': assertion_type,
                'passed': False,
                'message': f"Assertion execution error: {str(e)}"
            }

    def _assert_status_code(
        self,
        assertion: Dict[str, Any],
        response_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Validate HTTP status code"""
        actual = response_data.get('status_code')
        expected = assertion.get('expectedValue')
        operator = assertion.get('operator', 'equals')
        assertion_id = assertion.get('id')

        passed = False
        message = ""

        if operator == 'equals':
            passed = actual == expected
            message = f"Status code equals {expected}"
        elif operator == 'one_of':
            passed = actual in expected
            message = f"Status code in {expected}"
        elif operator == 'gt':
            passed = actual > expected
            message = f"Status code > {expected}"
        elif operator == 'lt':
            passed = actual < expected
            message = f"Status code < {expected}"
        elif operator == 'gte':
            passed = actual >= expected
            message = f"Status code >= {expected}"
        elif operator == 'lte':
            passed = actual <= expected
            message = f"Status code <= {expected}"

        return {
            'id': assertion_id,
            'type': 'status_code',
            'passed': passed,
            'message': message,
            'actual': actual,
            'expected': expected,
            'operator': operator
        }

    def _assert_response_time(
        self,
        assertion: Dict[str, Any],
        response_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Validate response time in milliseconds"""
        actual = response_data.get('response_time', 0) * 1000  # Convert to ms
        expected = assertion.get('expectedValue')
        operator = assertion.get('operator', 'lt')
        assertion_id = assertion.get('id')

        passed = False
        message = ""

        if operator == 'lt':
            passed = actual < expected
            message = f"Response time < {expected}ms"
        elif operator == 'gt':
            passed = actual > expected
            message = f"Response time > {expected}ms"
        elif operator == 'lte':
            passed = actual <= expected
            message = f"Response time <= {expected}ms"
        elif operator == 'gte':
            passed = actual >= expected
            message = f"Response time >= {expected}ms"

        return {
            'id': assertion_id,
            'type': 'response_time',
            'passed': passed,
            'message': message,
            'actual': f"{actual:.2f}ms",
            'expected': f"{expected}ms",
            'operator': operator
        }

    def _assert_header(
        self,
        assertion: Dict[str, Any],
        response_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Validate response header"""
        headers = response_data.get('headers', {})
        header_name = assertion.get('headerName')
        expected = assertion.get('expectedValue')
        operator = assertion.get('operator', 'equals')
        assertion_id = assertion.get('id')

        actual = headers.get(header_name)
        passed = False
        message = ""

        if operator == 'exists':
            passed = header_name in headers
            message = f"Header '{header_name}' exists"
        elif operator == 'equals':
            passed = str(actual) == str(expected) if actual is not None else False
            message = f"Header '{header_name}' equals '{expected}'"
        elif operator == 'contains':
            passed = str(expected) in str(actual) if actual is not None else False
            message = f"Header '{header_name}' contains '{expected}'"
        elif operator == 'regex':
            if actual:
                pattern = re.compile(expected)
                passed = bool(pattern.search(str(actual)))
                message = f"Header '{header_name}' matches regex"
            else:
                passed = False
                message = f"Header '{header_name}' not found for regex match"

        return {
            'id': assertion_id,
            'type': 'header',
            'passed': passed,
            'message': message,
            'actual': actual,
            'expected': expected,
            'operator': operator
        }

    def _assert_json_body(
        self,
        assertion: Dict[str, Any],
        response_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Validate JSON body using JSONPath"""
        body = response_data.get('body', {})
        jsonpath_expr = assertion.get('jsonPath')
        operator = assertion.get('operator', 'equals')
        expected = assertion.get('expectedValue')
        assertion_id = assertion.get('id')

        # Parse JSONPath expression
        try:
            jsonpath = parse(jsonpath_expr)
            matches = jsonpath.find(body)

            if not matches:
                return {
                    'id': assertion_id,
                    'type': 'json_body',
                    'passed': False,
                    'message': f"JSONPath '{jsonpath_expr}' not found in response",
                    'jsonPath': jsonpath_expr,
                    'expected': expected
                }

            # For single value, get first match; for array, get all
            if len(matches) == 1:
                actual = matches[0].value
            else:
                actual = [match.value for match in matches]

            passed = False
            message = ""

            if operator == 'equals':
                passed = actual == expected
                message = f"JSONPath '{jsonpath_expr}' equals {expected}"
            elif operator == 'not_equals':
                passed = actual != expected
                message = f"JSONPath '{jsonpath_expr}' not equals {expected}"
            elif operator == 'contains':
                passed = str(expected) in str(actual)
                message = f"JSONPath '{jsonpath_expr}' contains '{expected}'"
            elif operator == 'not_contains':
                passed = str(expected) not in str(actual)
                message = f"JSONPath '{jsonpath_expr}' not contains '{expected}'"
            elif operator == 'gt':
                passed = actual > expected
                message = f"JSONPath '{jsonpath_expr}' > {expected}"
            elif operator == 'lt':
                passed = actual < expected
                message = f"JSONPath '{jsonpath_expr}' < {expected}"
            elif operator == 'gte':
                passed = actual >= expected
                message = f"JSONPath '{jsonpath_expr}' >= {expected}"
            elif operator == 'lte':
                passed = actual <= expected
                message = f"JSONPath '{jsonpath_expr}' <= {expected}"
            elif operator == 'type':
                passed = self._check_type(actual, expected)
                message = f"JSONPath '{jsonpath_expr}' is type {expected}"
            elif operator == 'exists':
                passed = True  # Already verified by matches
                message = f"JSONPath '{jsonpath_expr}' exists"
            elif operator == 'empty':
                if isinstance(actual, (list, dict)):
                    passed = len(actual) == 0
                else:
                    passed = not actual
                message = f"JSONPath '{jsonpath_expr}' is empty"
            elif operator == 'regex':
                pattern = re.compile(expected)
                passed = bool(pattern.search(str(actual)))
                message = f"JSONPath '{jsonpath_expr}' matches regex"
            elif operator == 'one_of':
                passed = actual in expected
                message = f"JSONPath '{jsonpath_expr}' in {expected}"
            elif operator == 'length_equals':
                passed = len(actual) == expected
                message = f"JSONPath '{jsonpath_expr}' length equals {expected}"
            elif operator == 'length_gt':
                passed = len(actual) > expected
                message = f"JSONPath '{jsonpath_expr}' length > {expected}"
            elif operator == 'length_lt':
                passed = len(actual) < expected
                message = f"JSONPath '{jsonpath_expr}' length < {expected}"

            return {
                'id': assertion_id,
                'type': 'json_body',
                'passed': passed,
                'message': message,
                'jsonPath': jsonpath_expr,
                'actual': actual,
                'expected': expected,
                'operator': operator
            }

        except Exception as e:
            return {
                'id': assertion_id,
                'type': 'json_body',
                'passed': False,
                'message': f"JSONPath parsing error: {str(e)}",
                'jsonPath': jsonpath_expr
            }

    def _assert_json_schema(
        self,
        assertion: Dict[str, Any],
        response_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Validate JSON body against JSON Schema"""
        body = response_data.get('body', {})
        schema = assertion.get('schema')
        assertion_id = assertion.get('id')

        try:
            validate(instance=body, schema=schema)
            return {
                'id': assertion_id,
                'type': 'json_schema',
                'passed': True,
                'message': "Response body matches JSON Schema"
            }
        except JsonSchemaValidationError as e:
            return {
                'id': assertion_id,
                'type': 'json_schema',
                'passed': False,
                'message': f"JSON Schema validation failed: {e.message}",
                'path': str(e.path),
                'expected': schema
            }

    def _assert_javascript(
        self,
        assertion: Dict[str, Any],
        response_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute custom JavaScript assertion

        NOTE: JavaScript assertions are not implemented yet due to security concerns.
        This is a placeholder for future implementation with proper sandboxing.
        """
        assertion_id = assertion.get('id')

        return {
            'id': assertion_id,
            'type': 'javascript',
            'passed': False,
            'message': "JavaScript assertions are not yet implemented. Please use other assertion types.",
            'script': assertion.get('script', '')[:100] + '...' if len(assertion.get('script', '')) > 100 else assertion.get('script', '')
        }

    @staticmethod
    def _check_type(value: Any, expected_type: str) -> bool:
        """Check if value matches expected type"""
        type_map = {
            'string': str,
            'number': (int, float),
            'boolean': bool,
            'array': list,
            'object': dict,
            'null': type(None)
        }

        expected_python_type = type_map.get(expected_type)
        if expected_python_type:
            return isinstance(value, expected_python_type)
        return False


# Convenience function for quick assertions
def assert_response(
    response_data: Dict[str, Any],
    assertions_config: Dict[str, Any],
    stop_on_failure: bool = True
) -> Tuple[bool, List[Dict[str, Any]]]:
    """
    Convenience function to execute assertions

    Args:
        response_data: Response data dict with keys:
            - status_code: int
            - headers: dict
            - body: dict (parsed JSON)
            - response_time: float (seconds)
        assertions_config: Assertions config from database
        stop_on_failure: Stop on first critical failure

    Returns:
        Tuple of (all_passed, assertion_results)
    """
    engine = AssertionEngine(stop_on_failure=stop_on_failure)
    return engine.execute_assertions(assertions_config, response_data)
