# Test Suite Documentation

This directory contains the complete test suite for the PhotoID SaaS application, implementing mandatory testing standards with 80%+ coverage requirements.

## 📁 Test Structure

```
__tests__/
├── unit/                    # Unit tests for individual components/functions
│   ├── components/          # React component tests
│   │   └── photo-upload.test.tsx
│   └── lib/                 # Business logic tests
│       ├── compliance.test.ts
│       ├── face-detection.test.ts
│       └── photo-standards.test.ts
├── integration/             # Integration and API tests
│   └── api/
│       ├── create-checkout.test.ts
│       └── health.test.ts
├── e2e/                     # End-to-end user journey tests
│   └── user-journey.spec.ts
└── fixtures/                # Test data and mock files
    ├── valid-portrait.jpg
    ├── landscape-no-face.jpg
    ├── multiple-faces.jpg
    ├── low-resolution.jpg
    ├── large-photo.jpg
    ├── corrupted.jpg
    └── README.md
```

## 🧪 Test Categories

### Unit Tests (85+ test cases)

**Purpose**: Test individual functions and components in isolation

- **Face Detection**: MediaPipe integration, GPU/CPU fallback, edge cases
- **Compliance Checking**: Passport photo validation, head size, background
- **Photo Standards**: Unit conversions, DPI calculations, precision
- **Photo Upload Component**: File handling, camera access, UI interactions

### Integration Tests (30+ test cases)

**Purpose**: Test component interactions and API endpoints

- **Payment API**: Stripe integration, environment config, error handling
- **Health Check API**: Service monitoring, dependency validation, metrics

### E2E Tests (15+ scenarios)

**Purpose**: Test complete user workflows

- **Happy Path**: Upload → Edit → Pay → Download
- **Edge Cases**: Invalid files, network failures, payment errors
- **Accessibility**: Keyboard navigation, screen readers
- **Performance**: Load times, processing speed
- **Privacy**: Client-side processing verification

## 🚀 Running Tests

### All Tests

```bash
npm test                    # Run all test suites
npm run test:ci            # CI mode with coverage
```

### Individual Test Types

```bash
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e           # E2E tests only
npm run test:coverage      # Generate coverage report
```

### Development Mode

```bash
npm run test:watch         # Watch mode for rapid feedback
```

## 📊 Coverage Requirements

- **Minimum Overall Coverage**: 80%
- **Edge Case Coverage**: 70%
- **Critical Business Logic**: 95%
- **API Endpoints**: 90%

### Coverage Reports

- HTML: `coverage/lcov-report/index.html`
- JSON: `coverage/coverage-final.json`
- Text: Console output during test runs

## 🎯 Test Standards

### Unit Tests

- Fast execution (<100ms per test)
- Isolated dependencies (mocked)
- Comprehensive edge case coverage
- Error condition testing

### Integration Tests

- Real service interactions
- Configuration validation
- Performance benchmarks
- Concurrent request handling

### E2E Tests

- Real browser environments
- Complete user workflows
- Cross-browser compatibility
- Mobile responsiveness

## 🔧 Mock Configurations

### External Services

- **MediaPipe**: Face detection mocked for consistent results
- **Stripe**: Payment processing with test scenarios
- **Background Removal**: Image processing simulation

### Browser APIs

- **getUserMedia**: Camera access simulation
- **Canvas**: Image processing mocks
- **File API**: Upload simulation

## 🐛 Test Debugging

### Common Issues

1. **Environment Setup**: Ensure jest.setup.js is properly configured
2. **Mock Alignment**: Verify mocks match actual library interfaces
3. **Async Operations**: Use proper awaits and timeouts

### Debug Commands

```bash
npm run test:unit -- --verbose          # Detailed output
npm run test:unit -- --watch --coverage # Live coverage
```

## 📱 Test Environments

### Supported Browsers (E2E)

- Chrome/Chromium ✅
- Firefox ✅
- Safari/WebKit ✅
- Mobile Chrome ✅
- Mobile Safari ✅

### Node.js Environment (Unit/Integration)

- Node.js v16+ required
- jsdom for DOM simulation
- Canvas mocking for image processing

## 🔒 Security Testing

### Automated Scans

- ESLint security plugin
- Dependency vulnerability checking
- Secret detection preparation

### Security Test Cases

- Input validation testing
- XSS prevention verification
- CSRF protection validation
- File upload security

## 📈 Performance Testing

### Metrics Tracked

- Page load times (<3s)
- Image processing speed (<10s)
- Memory usage monitoring
- Network request optimization

### Performance Tests

- Large file handling (>10MB)
- Concurrent user simulation
- Resource leak detection
- Cache effectiveness

## 🎨 Accessibility Testing

### WCAG Compliance

- Keyboard navigation
- Screen reader compatibility
- Color contrast validation
- Focus management

### Accessibility Tests

- Automated a11y scanning
- Manual keyboard testing
- Screen reader simulation
- Mobile accessibility

## 🔄 Continuous Integration

### GitHub Actions Integration

```yaml
- name: Run Tests
  run: npm run test:ci
- name: Check Coverage
  run: npm run test:coverage
- name: Security Scan
  run: npm run security
```

### Quality Gates

- All tests must pass ✅
- Coverage threshold met ✅
- Security scan clean ✅
- Linting errors resolved ✅

## 📚 Best Practices

### Writing New Tests

1. Follow Red-Green-Refactor TDD cycle
2. Test behavior, not implementation
3. Use descriptive test names
4. Include edge cases and error conditions
5. Maintain fast execution times

### Test Maintenance

1. Update tests with code changes
2. Remove flaky tests
3. Optimize slow tests
4. Regular mock validation
5. Coverage gap analysis

## 🆘 Troubleshooting

### Common Test Failures

1. **Mock misalignment**: Update mocks to match implementation
2. **Timing issues**: Add proper waits and timeouts
3. **Environment differences**: Verify test environment setup
4. **Resource cleanup**: Ensure proper test cleanup

### Support Resources

- Jest Documentation: https://jestjs.io/
- Testing Library: https://testing-library.com/
- Playwright Docs: https://playwright.dev/

## 🎯 Success Metrics

- **Test Coverage**: 80%+ maintained
- **Test Execution**: <30 seconds for unit tests
- **E2E Stability**: 95%+ pass rate
- **Security Scans**: Zero high vulnerabilities
- **Performance**: All metrics within targets

This test suite ensures the PhotoID SaaS application meets the highest quality and reliability standards for production deployment.
