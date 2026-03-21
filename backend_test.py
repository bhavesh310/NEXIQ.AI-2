#!/usr/bin/env python3
"""
NEXIQ Backend API Testing Suite
Tests all endpoints including auth, conversations, messages, and streaming
"""

import requests
import json
import time
import sys
from datetime import datetime
from typing import Dict, Optional

class NEXIQAPITester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
        
        # Test data
        self.test_user = {
            "name": f"Test User {datetime.now().strftime('%H%M%S')}",
            "email": f"test_user_{datetime.now().strftime('%H%M%S')}@example.com",
            "password": "TestPass123!"
        }
        
        # Test results tracking
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.auth_token = None
        self.current_user = None
        self.test_conversation_id = None

    def log_test(self, name: str, passed: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if passed:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name}: {details}")
        
        self.test_results.append({
            "test": name,
            "passed": passed,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def test_health_check(self) -> bool:
        """Test API health endpoints"""
        try:
            # Test root endpoint
            response = self.session.get(f"{self.api_url}/")
            root_success = response.status_code == 200 and "NEXIQ API" in response.text
            self.log_test("API Root Health Check", root_success, 
                         f"Status: {response.status_code}")
            
            # Test health endpoint
            response = self.session.get(f"{self.api_url}/health")
            health_success = response.status_code == 200 and "healthy" in response.text
            self.log_test("API Health Endpoint", health_success,
                         f"Status: {response.status_code}")
            
            return root_success and health_success
            
        except Exception as e:
            self.log_test("Health Check", False, str(e))
            return False

    def test_user_registration(self) -> bool:
        """Test user registration"""
        try:
            response = self.session.post(
                f"{self.api_url}/auth/register",
                json=self.test_user
            )
            
            success = response.status_code == 200
            if success:
                data = response.json()
                self.auth_token = data.get("token")
                self.current_user = data
                # Update session headers for future requests
                self.session.cookies.update(response.cookies)
                
            self.log_test("User Registration", success,
                         f"Status: {response.status_code}, Token: {'✓' if self.auth_token else '✗'}")
            return success
            
        except Exception as e:
            self.log_test("User Registration", False, str(e))
            return False

    def test_user_login(self) -> bool:
        """Test user login with registered credentials"""
        try:
            login_data = {
                "email": self.test_user["email"],
                "password": self.test_user["password"]
            }
            
            response = self.session.post(
                f"{self.api_url}/auth/login",
                json=login_data
            )
            
            success = response.status_code == 200
            if success:
                data = response.json()
                self.auth_token = data.get("token")
                self.session.cookies.update(response.cookies)
                
            self.log_test("User Login", success,
                         f"Status: {response.status_code}")
            return success
            
        except Exception as e:
            self.log_test("User Login", False, str(e))
            return False

    def test_auth_me(self) -> bool:
        """Test authenticated user info endpoint"""
        try:
            response = self.session.get(f"{self.api_url}/auth/me")
            
            success = response.status_code == 200
            if success:
                data = response.json()
                success = data.get("email") == self.test_user["email"]
                
            self.log_test("Auth Me Endpoint", success,
                         f"Status: {response.status_code}")
            return success
            
        except Exception as e:
            self.log_test("Auth Me Endpoint", False, str(e))
            return False

    def test_create_conversation(self) -> bool:
        """Test conversation creation"""
        try:
            conv_data = {
                "title": "Test Conversation",
                "model": "llama-3.3-70b-versatile",
                "provider": "groq"
            }
            
            response = self.session.post(
                f"{self.api_url}/conversations",
                json=conv_data
            )
            
            success = response.status_code == 200
            if success:
                data = response.json()
                self.test_conversation_id = data.get("conversation_id")
                
            self.log_test("Create Conversation", success,
                         f"Status: {response.status_code}, ID: {self.test_conversation_id}")
            return success
            
        except Exception as e:
            self.log_test("Create Conversation", False, str(e))
            return False

    def test_get_conversations(self) -> bool:
        """Test fetching user conversations"""
        try:
            response = self.session.get(f"{self.api_url}/conversations")
            
            success = response.status_code == 200
            if success:
                data = response.json()
                success = isinstance(data, list) and len(data) > 0
                
            self.log_test("Get Conversations", success,
                         f"Status: {response.status_code}, Count: {len(data) if success else 0}")
            return success
            
        except Exception as e:
            self.log_test("Get Conversations", False, str(e))
            return False

    def test_get_conversation(self) -> bool:
        """Test fetching specific conversation"""
        if not self.test_conversation_id:
            self.log_test("Get Conversation", False, "No conversation ID available")
            return False
            
        try:
            response = self.session.get(
                f"{self.api_url}/conversations/{self.test_conversation_id}"
            )
            
            success = response.status_code == 200
            if success:
                data = response.json()
                success = data.get("conversation_id") == self.test_conversation_id
                
            self.log_test("Get Conversation", success,
                         f"Status: {response.status_code}")
            return success
            
        except Exception as e:
            self.log_test("Get Conversation", False, str(e))
            return False

    def test_send_message_stream(self) -> bool:
        """Test sending message with streaming response"""
        if not self.test_conversation_id:
            self.log_test("Send Message Stream", False, "No conversation ID available")
            return False
            
        try:
            message_data = {
                "content": "Hello, this is a test message. Please respond briefly.",
                "model": "llama-3.3-70b-versatile",
                "provider": "groq"
            }
            
            response = self.session.post(
                f"{self.api_url}/conversations/{self.test_conversation_id}/messages/stream",
                json=message_data,
                stream=True
            )
            
            success = response.status_code == 200
            received_chunks = 0
            if success:
                # Test streaming response
                for line in response.iter_lines():
                    if line:
                        line_str = line.decode('utf-8')
                        if line_str.startswith('data: '):
                            try:
                                data = json.loads(line_str[6:])
                                if data.get('type') in ['start', 'chunk', 'end']:
                                    received_chunks += 1
                                if data.get('type') == 'end':
                                    break
                            except:
                                pass
                    
                    # Limit test duration
                    if received_chunks > 50:
                        break
                
                success = received_chunks > 0
                
            self.log_test("Send Message Stream", success,
                         f"Status: {response.status_code}, Chunks: {received_chunks}")
            return success
            
        except Exception as e:
            self.log_test("Send Message Stream", False, str(e))
            return False

    def test_get_messages(self) -> bool:
        """Test fetching conversation messages"""
        if not self.test_conversation_id:
            self.log_test("Get Messages", False, "No conversation ID available")
            return False
            
        try:
            response = self.session.get(
                f"{self.api_url}/conversations/{self.test_conversation_id}/messages"
            )
            
            success = response.status_code == 200
            if success:
                data = response.json()
                success = isinstance(data, list)
                
            self.log_test("Get Messages", success,
                         f"Status: {response.status_code}, Count: {len(data) if success else 0}")
            return success
            
        except Exception as e:
            self.log_test("Get Messages", False, str(e))
            return False

    def test_token_usage(self) -> bool:
        """Test token usage endpoint"""
        try:
            response = self.session.get(f"{self.api_url}/usage")
            
            success = response.status_code == 200
            if success:
                data = response.json()
                success = all(key in data for key in ["total_tokens", "conversations_count", "messages_count"])
                
            self.log_test("Token Usage", success,
                         f"Status: {response.status_code}")
            return success
            
        except Exception as e:
            self.log_test("Token Usage", False, str(e))
            return False

    def test_update_conversation(self) -> bool:
        """Test updating conversation title"""
        if not self.test_conversation_id:
            self.log_test("Update Conversation", False, "No conversation ID available")
            return False
            
        try:
            update_data = {"title": "Updated Test Conversation"}
            
            response = self.session.patch(
                f"{self.api_url}/conversations/{self.test_conversation_id}",
                json=update_data
            )
            
            success = response.status_code == 200
            if success:
                data = response.json()
                success = data.get("title") == "Updated Test Conversation"
                
            self.log_test("Update Conversation", success,
                         f"Status: {response.status_code}")
            return success
            
        except Exception as e:
            self.log_test("Update Conversation", False, str(e))
            return False

    def test_delete_conversation(self) -> bool:
        """Test deleting conversation"""
        if not self.test_conversation_id:
            self.log_test("Delete Conversation", False, "No conversation ID available")
            return False
            
        try:
            response = self.session.delete(
                f"{self.api_url}/conversations/{self.test_conversation_id}"
            )
            
            success = response.status_code == 200
            
            self.log_test("Delete Conversation", success,
                         f"Status: {response.status_code}")
            return success
            
        except Exception as e:
            self.log_test("Delete Conversation", False, str(e))
            return False

    def test_logout(self) -> bool:
        """Test user logout"""
        try:
            response = self.session.post(f"{self.api_url}/auth/logout")
            
            success = response.status_code == 200
            
            self.log_test("User Logout", success,
                         f"Status: {response.status_code}")
            return success
            
        except Exception as e:
            self.log_test("User Logout", False, str(e))
            return False

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🧪 Starting NEXIQ Backend API Tests")
        print("=" * 50)
        
        # Health check tests
        self.test_health_check()
        
        # Authentication flow tests
        if self.test_user_registration():
            self.test_auth_me()
            
            # Conversation management tests
            if self.test_create_conversation():
                self.test_get_conversations()
                self.test_get_conversation()
                
                # Message tests (requires LLM integration)
                self.test_send_message_stream()
                self.test_get_messages()
                
                # Additional conversation operations
                self.test_update_conversation()
                
                # Usage tracking
                self.test_token_usage()
                
                # Cleanup
                self.test_delete_conversation()
            
            # Test logout
            self.test_logout()
        
        # Test login with existing user
        self.test_user_login()
        
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        print(f"🎯 Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Return success if more than 80% tests pass
        return self.tests_passed / self.tests_run >= 0.8

def main():
    tester = NEXIQAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('backend_test_results.json', 'w') as f:
        json.dump({
            "summary": {
                "tests_run": tester.tests_run,
                "tests_passed": tester.tests_passed,
                "success_rate": tester.tests_passed / tester.tests_run if tester.tests_run > 0 else 0,
                "timestamp": datetime.now().isoformat()
            },
            "results": tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())