#!/bin/bash

# Sub-Agent Work Verification Script
# Usage: ./scripts/verify-subagent-work.sh <project-dir> <coverage-target> <min-tests>

PROJECT_DIR="${1:-passport-photo-app/web}"
COVERAGE_TARGET="${2:-80}"
MIN_TESTS="${3:-50}"

echo "🔍 VERIFYING SUB-AGENT DELIVERABLES"
echo "======================================="
echo "📁 Project: $PROJECT_DIR"
echo "🎯 Coverage Target: $COVERAGE_TARGET%"
echo "📊 Min Tests: $MIN_TESTS"
echo ""

cd "$PROJECT_DIR" || exit 1

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ ERROR: npm not found"
    exit 1
fi

echo "📋 VERIFICATION CHECKLIST:"
echo ""

# 1. Check package.json scripts
echo "1️⃣  Checking package.json scripts..."
if [ ! -f package.json ]; then
    echo "❌ package.json not found"
    exit 1
fi

required_scripts=("test" "test:coverage" "test:ci" "lint" "build")
for script in "${required_scripts[@]}"; do
    if npm run | grep -q "$script"; then
        echo "✅ Script '$script' exists"
    else
        echo "❌ Script '$script' missing"
        exit 1
    fi
done

# 2. Install dependencies
echo ""
echo "2️⃣  Installing dependencies..."
npm install --quiet
if [ $? -ne 0 ]; then
    echo "❌ npm install failed"
    exit 1
fi
echo "✅ Dependencies installed"

# 3. Run linting
echo ""
echo "3️⃣  Running linting..."
npm run lint > lint.log 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Linting passed"
else
    echo "❌ Linting failed:"
    cat lint.log
    exit 1
fi

# 4. Run tests with coverage
echo ""
echo "4️⃣  Running tests with coverage..."
npm run test:coverage > test-output.log 2>&1
test_exit_code=$?

# Parse test results
if [ -f test-output.log ]; then
    # Count test files
    test_files=$(find . -name "*.test.*" -type f | grep -v node_modules | wc -l)
    echo "📊 Test files found: $test_files"
    
    # Check if tests passed
    if grep -q "Tests:.*failed" test-output.log; then
        failed_count=$(grep "Tests:" test-output.log | grep -o "[0-9]* failed" | grep -o "[0-9]*")
        echo "❌ $failed_count tests failed"
        echo "Test output:"
        tail -50 test-output.log
        exit 1
    elif [ $test_exit_code -ne 0 ]; then
        echo "❌ Tests failed to execute"
        echo "Test output:"
        tail -50 test-output.log
        exit 1
    else
        echo "✅ All tests passed"
    fi
    
    # Check coverage
    if [ -f coverage/lcov.info ]; then
        # Extract coverage percentage
        if command -v lcov &> /dev/null; then
            coverage_pct=$(lcov --summary coverage/lcov.info 2>/dev/null | grep "lines" | grep -o "[0-9]*\.[0-9]*%" | sed 's/%//')
        else
            # Fallback: look for coverage in test output
            coverage_pct=$(grep -o "All files.*[0-9]*\.[0-9]*" test-output.log | grep -o "[0-9]*\.[0-9]*" | tail -1)
        fi
        
        if [ -n "$coverage_pct" ]; then
            coverage_int=${coverage_pct%.*}
            echo "📈 Coverage achieved: $coverage_pct%"
            
            if [ "$coverage_int" -ge "$COVERAGE_TARGET" ]; then
                echo "✅ Coverage target met ($COVERAGE_TARGET%)"
            else
                echo "❌ Coverage below target: $coverage_pct% < $COVERAGE_TARGET%"
                exit 1
            fi
        else
            echo "⚠️  Could not determine coverage percentage"
        fi
    else
        echo "❌ Coverage report not found"
        exit 1
    fi
    
    # Check test count
    if [ "$test_files" -ge "$MIN_TESTS" ]; then
        echo "✅ Test count target met: $test_files >= $MIN_TESTS"
    else
        echo "❌ Insufficient test files: $test_files < $MIN_TESTS"
        exit 1
    fi
else
    echo "❌ Test output not found"
    exit 1
fi

# 5. Build check
echo ""
echo "5️⃣  Running build..."
npm run build > build.log 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed:"
    cat build.log
    exit 1
fi

echo ""
echo "🎉 VERIFICATION COMPLETED SUCCESSFULLY!"
echo "======================================="
echo "✅ All scripts functional"
echo "✅ All tests passing"
echo "✅ Coverage: $coverage_pct% (Target: $COVERAGE_TARGET%)"
echo "✅ Test count: $test_files (Target: $MIN_TESTS)"
echo "✅ Build successful"
echo "✅ Quality gates passed"

# Cleanup
rm -f lint.log test-output.log build.log

exit 0