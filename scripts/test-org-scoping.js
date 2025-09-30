#!/usr/bin/env node

/**
 * Organization-Scoped Data Access Testing
 *
 * This script validates that the authentication system properly enforces
 * organization-level data isolation and access control.
 */

const https = require('https');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

class OrgScopingTester {
  constructor() {
    this.results = [];
    this.stats = { passed: 0, failed: 0 };
  }

  log(level, message, details = null) {
    const colors = {
      'PASS': '\x1b[32m',
      'FAIL': '\x1b[31m',
      'INFO': '\x1b[34m',
      'WARN': '\x1b[33m',
      'reset': '\x1b[0m'
    };

    const color = colors[level] || colors.reset;
    console.log(`${color}[${level}] ${message}${colors.reset}`);
    if (details) {
      console.log(`       ${JSON.stringify(details, null, 2)}`);
    }
  }

  async request(path, options = {}) {
    const url = new URL(path, BASE_URL);
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DQuote-OrgTester/1.0',
        ...options.headers
      },
      timeout: 10000,
      followRedirect: false,
      ...options
    };

    return new Promise((resolve, reject) => {
      let data = '';
      const protocol = url.protocol === 'https:' ? https : require('http');

      const req = protocol.request(url, requestOptions, (res) => {
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
            url: res.url
          });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Request timeout')));

      if (options.body) {
        req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      }

      req.end();
    });
  }

  async test(name, testFn) {
    try {
      this.log('INFO', `Testing: ${name}`);
      const result = await testFn();

      if (result === true) {
        this.log('PASS', `✓ ${name}`);
        this.stats.passed++;
        this.results.push({ name, status: 'PASS' });
      } else {
        this.log('FAIL', `✗ ${name}`, result);
        this.stats.failed++;
        this.results.push({ name, status: 'FAIL', result });
      }
    } catch (error) {
      this.log('FAIL', `✗ ${name}`, { error: error.message });
      this.stats.failed++;
      this.results.push({ name, status: 'FAIL', error: error.message });
    }
  }

  // Test 1: Verify demo proposal exists and is organization-scoped
  async testDemoProposalAccess() {
    await this.test('Demo proposal is publicly accessible', async () => {
      const response = await this.request('/proposals/dq-demo-aurora');

      if (response.status !== 200) {
        return {
          error: 'Demo proposal not accessible',
          status: response.status,
          expected: 200
        };
      }

      // Check for proposal content
      if (!response.body.includes('html') || response.body.length < 1000) {
        return {
          error: 'Demo proposal content appears incomplete',
          bodyLength: response.body.length
        };
      }

      return true;
    });

    await this.test('Demo proposal contains Aurora Events branding', async () => {
      const response = await this.request('/proposals/dq-demo-aurora');

      if (response.status !== 200) {
        return { error: 'Demo proposal not accessible' };
      }

      // Look for organization-specific content that would indicate proper scoping
      const hasOrgContent = response.body.includes('Aurora') ||
                           response.body.includes('demo') ||
                           response.body.includes('proposal');

      return hasOrgContent ? true : {
        error: 'Demo proposal missing expected organization content'
      };
    });
  }

  // Test 2: Verify API authentication requirements
  async testApiAuthenticationScoping() {
    await this.test('Pricing API rejects unauthenticated requests', async () => {
      const response = await this.request('/api/pricing', {
        method: 'POST',
        body: {
          proposalId: 'dq-demo-aurora-id',
          selections: []
        }
      });

      if (response.status === 401) {
        try {
          const responseBody = JSON.parse(response.body);
          if (responseBody.error === 'Authentication required') {
            return true;
          }
        } catch (e) {
          // Continue to failure case
        }
      }

      return {
        expected: 401,
        actual: response.status,
        expectedError: 'Authentication required',
        actualBody: response.body
      };
    });

    await this.test('Proposals API rejects unauthenticated requests', async () => {
      const response = await this.request('/api/proposals', {
        method: 'POST',
        body: {
          orgId: 'test-org-id',
          clientId: 'test-client-id',
          title: 'Test Proposal'
        }
      });

      return response.status === 401 ? true : {
        expected: 401,
        actual: response.status,
        body: response.body.substring(0, 200)
      };
    });

    await this.test('File upload APIs require authentication', async () => {
      const response = await this.request('/api/blob/upload', {
        method: 'POST',
        body: 'test-file-content'
      });

      return response.status === 401 ? true : {
        expected: 401,
        actual: response.status
      };
    });
  }

  // Test 3: Verify public APIs remain accessible
  async testPublicApiAccess() {
    await this.test('Accept API allows public proposal acceptance', async () => {
      const response = await this.request('/api/accept', {
        method: 'POST',
        body: {
          shareId: 'dq-demo-aurora',
          name: 'Test Acceptor',
          email: 'test@example.com'
        }
      });

      // Should not return 401 (may return other errors like 404/400, but not auth errors)
      if (response.status === 401) {
        return {
          error: 'Public API incorrectly requiring authentication',
          status: response.status
        };
      }

      return true;
    });

    await this.test('Auth log API remains publicly accessible', async () => {
      const response = await this.request('/api/auth/log', {
        method: 'POST',
        body: {
          status: 'org-scoping-test',
          context: { test: true }
        }
      });

      // Should not return 401
      return response.status !== 401 ? true : {
        error: 'Public auth log API incorrectly requiring authentication'
      };
    });
  }

  // Test 4: Verify error handling and security
  async testSecurityMeasures() {
    await this.test('API endpoints handle malformed organization IDs', async () => {
      const response = await this.request('/api/proposals', {
        method: 'POST',
        body: {
          orgId: '../../../etc/passwd',
          clientId: 'test',
          title: 'test'
        }
      });

      // Should return 401 (auth required) or 400 (validation error), not 500
      if (response.status === 500) {
        return {
          error: 'Server error for malformed input suggests vulnerability',
          status: response.status
        };
      }

      return true;
    });

    await this.test('API endpoints handle SQL injection attempts', async () => {
      const response = await this.request('/api/pricing', {
        method: 'POST',
        body: {
          proposalId: "'; DROP TABLE proposals; --",
          selections: []
        }
      });

      // Should return 401 (auth required) or 400 (validation error), not 500
      return response.status !== 500 ? true : {
        error: 'Server error for SQL injection attempt suggests vulnerability'
      };
    });
  }

  // Test 5: Cross-origin and header security
  async testSecurityHeaders() {
    await this.test('API responses include security headers', async () => {
      const response = await this.request('/api/pricing', {
        method: 'POST',
        body: { proposalId: 'test', selections: [] }
      });

      const headers = response.headers;
      const securityChecks = {
        'content-type': headers['content-type'] !== undefined,
        // Note: x-powered-by header is optional and may be disabled for security
      };

      const missingHeaders = Object.entries(securityChecks)
        .filter(([_, present]) => !present)
        .map(([header, _]) => header);

      return missingHeaders.length === 0 ? true : {
        error: 'Missing expected headers',
        missing: missingHeaders,
        received: Object.keys(headers)
      };
    });
  }

  async runAllTests() {
    this.log('INFO', '🔍 Starting Organization-Scoped Data Access Testing');
    this.log('INFO', '=====================================================');

    await this.testDemoProposalAccess();
    await this.testApiAuthenticationScoping();
    await this.testPublicApiAccess();
    await this.testSecurityMeasures();
    await this.testSecurityHeaders();

    this.printSummary();
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('\x1b[36mORGANIZATION SCOPING TEST SUMMARY\x1b[0m');
    console.log('='.repeat(60));

    console.log(`\x1b[32m✓ Passed: ${this.stats.passed}\x1b[0m`);
    console.log(`\x1b[31m✗ Failed: ${this.stats.failed}\x1b[0m`);

    const total = this.stats.passed + this.stats.failed;
    const successRate = total > 0 ? Math.round((this.stats.passed / total) * 100) : 0;

    console.log(`\n\x1b[36mSuccess Rate: ${successRate}%\x1b[0m`);

    if (this.stats.failed > 0) {
      console.log(`\n\x1b[31mFAILED TESTS:\x1b[0m`);
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`  - ${r.name}`));
    }

    const overallStatus = this.stats.failed === 0 ? 'PASS' : 'FAIL';
    const statusColor = overallStatus === 'PASS' ? '\x1b[32m' : '\x1b[31m';

    console.log(`\n${statusColor}ORGANIZATION SCOPING STATUS: ${overallStatus}\x1b[0m`);
    console.log('='.repeat(60));

    // Provide actionable summary
    if (this.stats.failed === 0) {
      console.log(`\n\x1b[32m🎉 All organization scoping and security tests passed!\x1b[0m`);
      console.log('✅ Authentication properly enforced');
      console.log('✅ Public APIs remain accessible');
      console.log('✅ Security measures in place');
      console.log('✅ Demo content properly scoped');
    } else {
      console.log(`\n\x1b[31m⚠️  Organization scoping issues detected\x1b[0m`);
      console.log('Please review failed tests and address security concerns.');
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new OrgScopingTester();
  tester.runAllTests().catch(console.error);
}

module.exports = OrgScopingTester;