# TML Villa - Agent-Browser CLI Test Cases

> **Test Framework**: agent-browser CLI (NOT Playwright MCP)  
> **Last Updated**: 2026-03-06  
> **Application**: TML Villa - 泰国民宿管理平台

---

## 📋 Test Suite Overview

This document provides comprehensive test cases for the TML Villa application using agent-browser CLI for browser automation testing.

### Test Environment Setup

```bash
# Install agent-browser CLI
npm install -g agent-browser

# Or use npx (no installation required)
npx agent-browser install

# Verify installation
agent-browser --version
```

### Application URLs

- **Local Development**: `http://localhost:5173`
- **Staging**: `https://staging.tml-villa.com` (if available)
- **Production**: `https://tml-villa.com` (if available)

### Test Data

| Role | Username | Password | Purpose |
|------|----------|----------|---------|
| Admin | admin | admin123 | Admin flow testing |
| User | test@example.com | password123 | User flow testing |

---

## 🎯 Test Case Categories

### Priority Levels

- **P0**: Critical - Must pass for release
- **P1**: High - Should pass for release
- **P2**: Medium - Nice to have
- **P3**: Low - Edge cases

---

## 📝 Test Cases

### TC-001: Homepage Loads Successfully

**Priority**: P0  
**Category**: Critical User Flows  
**Type**: Positive

#### Description
Verify that the homepage loads correctly and displays essential components.

#### Pre-conditions
- Application is running
- No browser cache issues

#### Test Steps

```bash
# 1. Navigate to homepage
agent-browser open http://localhost:5173

# 2. Wait for page to load
agent-browser wait --load networkidle

# 3. Take snapshot to verify elements
agent-browser snapshot -i

# 4. Verify logo exists
agent-browser get text "img[alt='TML Villa']"

# 5. Take screenshot for documentation
agent-browser screenshot homepage-loaded.png

# 6. Close browser
agent-browser close
```

#### Expected Results
- [ ] Homepage loads without errors
- [ ] Logo is visible
- [ ] Navigation menu is visible
- [ ] Search bar is visible (only 2 fields: check-in, check-out)
- [ ] Homestay grid displays properties
- [ ] No console errors

#### Verification Commands

```bash
# Check for console errors
agent-browser open http://localhost:5173 && \
agent-browser console error

# Verify page title
agent-browser open http://localhost:5173 && \
agent-browser get title
# Expected: "TML Villa" or similar
```

---

### TC-002: Search Bar Displays Correctly (Minimal Design)

**Priority**: P0  
**Category**: Critical User Flows  
**Type**: Positive

#### Description
Verify that the search bar shows only check-in and check-out fields (no destination or guests fields).

#### Pre-conditions
- Homepage loaded successfully

#### Test Steps

```bash
# 1. Navigate to homepage
agent-browser open http://localhost:5173 && \
agent-browser wait --load networkidle

# 2. Get search bar snapshot
agent-browser snapshot -i

# 3. Verify search bar exists
agent-browser is visible ".search-bar"

# 4. Check for check-in field
agent-browser get text ".search-bar"
# Should contain "Check-in" or equivalent

# 5. Check for check-out field
agent-browser get text ".search-bar"
# Should contain "Check-out" or equivalent

# 6. Take screenshot
agent-browser screenshot search-bar-minimal.png

# 7. Close
agent-browser close
```

#### Expected Results
- [ ] Search bar is visible
- [ ] Only 2 date fields visible (check-in, check-out)
- [ ] No "Where" field (destination)
- [ ] No "Who" field (guests)
- [ ] Search button is visible
- [ ] Layout is balanced and clean

#### Manual Verification Checklist
- [ ] Check-in label is visible
- [ ] Check-out label is visible
- [ ] "Add dates" placeholder text visible in both fields
- [ ] Search button has champagne background color
- [ ] Fields are equal width
- [ ] Mobile: Both fields visible (not hidden)

---

### TC-003: Click Search Bar Opens Modal

**Priority**: P0  
**Category**: Critical User Flows  
**Type**: Positive

#### Description
Verify that clicking the search bar opens the SearchModal with date pickers.

#### Pre-conditions
- Homepage loaded
- Search bar visible

#### Test Steps

```bash
# 1. Navigate to homepage
agent-browser open http://localhost:5173 && \
agent-browser wait --load networkidle

# 2. Click on search bar
agent-browser click ".search-bar"

# 3. Wait for modal to appear
agent-browser wait 1000

# 4. Take snapshot to verify modal
agent-browser snapshot -i

# 5. Verify modal is visible
agent-browser is visible "[role='dialog']"

# 6. Check for date picker elements
agent-browser is visible ".calendar" || \
agent-browser is visible "[data-testid='calendar']"

# 7. Take screenshot
agent-browser screenshot search-modal-open.png

# 8. Close
agent-browser close
```

#### Expected Results
- [ ] Modal opens when search bar is clicked
- [ ] Modal displays "Search" title
- [ ] Check-in date picker is visible
- [ ] Check-out date picker is visible
- [ ] Calendar component is visible
- [ ] Search button is visible (initially disabled)

---

### TC-004: Date Selection Flow (Check-in → Check-out)

**Priority**: P0  
**Category**: Critical User Flows  
**Type**: Positive

#### Description
Verify that users can successfully select check-in and check-out dates.

#### Pre-conditions
- SearchModal is open
- Calendar is visible

#### Test Steps

```bash
# 1. Open modal
agent-browser open http://localhost:5173 && \
agent-browser wait --load networkidle && \
agent-browser click ".search-bar" && \
agent-browser wait 1000

# 2. Get initial snapshot
agent-browser snapshot -i

# 3. Click on a future date (e.g., day 15 of next month)
# Note: Adjust selector based on actual calendar implementation
agent-browser click "[aria-label*='15']" || \
agent-browser click "button:has-text('15')" || \
agent-browser eval "document.querySelectorAll('button')[15].click()"

# 4. Wait for date selection
agent-browser wait 500

# 5. Verify check-in date is selected
agent-browser snapshot -i
# Should show "Please select check-out date"

# 6. Click on a later date (e.g., day 20)
agent-browser click "[aria-label*='20']" || \
agent-browser click "button:has-text('20')" || \
agent-browser eval "document.querySelectorAll('button')[20].click()"

# 7. Wait for selection
agent-browser wait 500

# 8. Verify both dates are selected
agent-browser snapshot -i
# Should show "Dates selected, click search"

# 9. Take screenshot
agent-browser screenshot dates-selected.png

# 10. Close
agent-browser close
```

#### Expected Results
- [ ] First click selects check-in date
- [ ] Calendar updates to show "Please select check-out date"
- [ ] Second click selects check-out date (must be after check-in)
- [ ] Calendar updates to show "Dates selected, click search"
- [ ] Search button becomes enabled
- [ ] Selected dates are highlighted

#### Alternative Approach (Using Eval)

```bash
# If ref-based selection is difficult, use JavaScript evaluation
agent-browser open http://localhost:5173 && \
agent-browser click ".search-bar" && \
agent-browser wait 1000 && \
agent-browser eval "
  const buttons = document.querySelectorAll('button[role=\"gridcell\"]');
  const futureButtons = Array.from(buttons).filter(btn => {
    const date = new Date(btn.getAttribute('data-date'));
    return date > new Date();
  });
  if (futureButtons.length >= 10) {
    futureButtons[5].click(); // Select check-in
  }
" && \
agent-browser wait 500 && \
agent-browser screenshot date-selection-step1.png
```

---

### TC-005: Search with Valid Dates Navigates to Results

**Priority**: P0  
**Category**: Critical User Flows  
**Type**: Positive

#### Description
Verify that searching with valid dates navigates to the search results page.

#### Pre-conditions
- SearchModal is open
- Both dates are selected

#### Test Steps

```bash
# 1. Navigate and open modal
agent-browser open http://localhost:5173 && \
agent-browser wait --load networkidle && \
agent-browser click ".search-bar" && \
agent-browser wait 1000

# 2. Select dates (simplified - adjust selectors as needed)
agent-browser eval "
  // This would need to be adjusted based on actual calendar implementation
  // For now, we'll simulate clicking dates
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 7);
  const checkOut = new Date();
  checkOut.setDate(checkOut.getDate() + 10);
  
  // Store dates for later use
  window.testDates = { checkIn, checkOut };
"

# 3. Click search button
agent-browser click "button:has-text('Search')" || \
agent-browser click "[type='submit']"

# 4. Wait for navigation
agent-browser wait --url "**/search?checkIn=*"

# 5. Verify URL
agent-browser get url
# Expected: http://localhost:5173/#/search?checkIn=2026-03-13&checkOut=2026-03-16

# 6. Take snapshot of results page
agent-browser snapshot -i

# 7. Screenshot
agent-browser screenshot search-results.png

# 8. Close
agent-browser close
```

#### Expected Results
- [ ] Clicking search navigates to `/search` route
- [ ] URL contains `checkIn` and `checkOut` query parameters
- [ ] Search results page displays
- [ ] Results are filtered by selected dates
- [ ] No errors in console

---

### TC-006: Search Button Disabled Without Dates

**Priority**: P1  
**Category**: Validation  
**Type**: Positive

#### Description
Verify that the search button is disabled when dates are not selected.

#### Pre-conditions
- SearchModal is open
- No dates selected

#### Test Steps

```bash
# 1. Open modal
agent-browser open http://localhost:5173 && \
agent-browser wait --load networkidle && \
agent-browser click ".search-bar" && \
agent-browser wait 1000

# 2. Check search button state
agent-browser is enabled "button:has-text('Search')" || \
agent-browser is enabled "button[type='submit']"
# Expected: false (button should be disabled)

# 3. Get button text
agent-browser get text "button:has-text('Search')" || \
agent-browser get text "button[type='submit']"
# Expected: "Please select check-in and check-out dates"

# 4. Screenshot
agent-browser screenshot search-button-disabled.png

# 5. Close
agent-browser close
```

#### Expected Results
- [ ] Search button is disabled
- [ ] Button text indicates dates need to be selected
- [ ] Button has reduced opacity (disabled state)
- [ ] Clicking disabled button does nothing

---

### TC-007: Past Dates Are Disabled

**Priority**: P1  
**Category**: Validation  
**Type**: Positive

#### Description
Verify that users cannot select dates in the past.

#### Pre-conditions
- SearchModal is open
- Calendar is visible

#### Test Steps

```bash
# 1. Open modal
agent-browser open http://localhost:5173 && \
agent-browser wait --load networkidle && \
agent-browser click ".search-bar" && \
agent-browser wait 1000

# 2. Check for disabled past dates
agent-browser eval "
  const buttons = document.querySelectorAll('button[role=\"gridcell\"]');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const pastButtons = Array.from(buttons).filter(btn => {
    const dateStr = btn.getAttribute('data-date') || btn.getAttribute('aria-label');
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return date < today;
  });
  
  console.log('Past buttons found:', pastButtons.length);
  pastButtons.forEach(btn => {
    console.log('Past button disabled:', btn.disabled);
  });
  
  return pastButtons.length > 0 && pastButtons.every(btn => btn.disabled);
"

# 3. Try to click a past date (should not work)
agent-browser eval "
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Attempt to click yesterday - should be disabled
  const buttons = document.querySelectorAll('button');
  for (const btn of buttons) {
    if (btn.disabled && btn.textContent.includes(yesterday.getDate())) {
      console.log('Past date is properly disabled');
      return true;
    }
  }
  return false;
"

# 4. Screenshot
agent-browser screenshot past-dates-disabled.png

# 5. Close
agent-browser close
```

#### Expected Results
- [ ] Past dates are visually disabled (grayed out)
- [ ] Past dates have `disabled` attribute
- [ ] Clicking past dates does not select them
- [ ] Today's date is the earliest selectable date

---

### TC-008: Language Switch Updates UI

**Priority**: P1  
**Category**: Internationalization  
**Type**: Positive

#### Description
Verify that switching the language updates all UI text correctly.

#### Pre-conditions
- Homepage loaded

#### Test Steps

```bash
# 1. Navigate to homepage
agent-browser open http://localhost:5173 && \
agent-browser wait --load networkidle

# 2. Get current language
agent-browser get text "button:has(svg.lucide-globe)"
# Expected: "ZH" or "EN" or "TH"

# 3. Click language selector
agent-browser click "button:has(svg.lucide-globe)"

# 4. Wait for dropdown
agent-browser wait 500

# 5. Select Thai
agent-browser click "text=ไทย"

# 6. Wait for UI update
agent-browser wait 1000

# 7. Verify UI text changed
agent-browser get text "nav a:first-child"
# Should be in Thai

# 8. Screenshot
agent-browser screenshot language-thai.png

# 9. Switch to English
agent-browser click "button:has(svg.lucide-globe)" && \
agent-browser wait 500 && \
agent-browser click "text=English" && \
agent-browser wait 1000

# 10. Verify English
agent-browser get text "nav a:first-child"
# Should be in English

# 11. Screenshot
agent-browser screenshot language-english.png

# 12. Close
agent-browser close
```

#### Expected Results
- [ ] Language dropdown opens on click
- [ ] Selecting language updates all visible text
- [ ] Navigation labels change to selected language
- [ ] Search bar labels change language
- [ ] Language persists on navigation

---

### TC-009: Mobile Responsive Layout

**Priority**: P1  
**Category**: Responsive Design  
**Type**: Positive

#### Description
Verify that the search bar and overall layout are responsive on mobile devices.

#### Pre-conditions
- None

#### Test Steps

```bash
# 1. Set mobile viewport (iPhone 12 Pro)
agent-browser --viewport 390,844 open http://localhost:5173 && \
agent-browser wait --load networkidle

# 2. Take snapshot
agent-browser snapshot -i

# 3. Check search bar visibility
agent-browser is visible ".search-bar"

# 4. Verify both date fields are visible on mobile
agent-browser eval "
  const searchBar = document.querySelector('.search-bar');
  const checkIn = searchBar.textContent.includes('Check-in') || 
                  searchBar.textContent.includes('入住');
  const checkOut = searchBar.textContent.includes('Check-out') || 
                   searchBar.textContent.includes('退房');
  console.log('Check-in visible:', checkIn);
  console.log('Check-out visible:', checkOut);
  return checkIn && checkOut;
"

# 5. Take mobile screenshot
agent-browser screenshot mobile-layout.png

# 6. Test tablet viewport (iPad Pro)
agent-browser --viewport 1024,1366 open http://localhost:5173 && \
agent-browser wait --load networkidle && \
agent-browser screenshot tablet-layout.png

# 7. Close
agent-browser close
```

#### Expected Results
- [ ] Search bar adapts to mobile width
- [ ] Both date fields visible (not hidden)
- [ ] Text is readable on small screens
- [ ] Touch targets are large enough (min 44x44px)
- [ ] No horizontal scroll

---

### TC-010: User Login/Logout Flow

**Priority**: P2  
**Category**: User Authentication  
**Type**: Positive

#### Description
Verify that users can log in and log out successfully.

#### Pre-conditions
- User account exists (test@example.com / password123)

#### Test Steps

```bash
# 1. Navigate to homepage
agent-browser open http://localhost:5173 && \
agent-browser wait --load networkidle

# 2. Click user menu
agent-browser click "button:has(.lucide-user)" || \
agent-browser click "[aria-label='User menu']"

# 3. Click login
agent-browser wait 500 && \
agent-browser click "text=Login" || \
agent-browser click "text=登录"

# 4. Wait for login page
agent-browser wait --url "**/login"

# 5. Fill login form
agent-browser fill "input[type='email']" "test@example.com" && \
agent-browser fill "input[type='password']" "password123"

# 6. Submit form
agent-browser click "button[type='submit']" || \
agent-browser click "text=Login"

# 7. Wait for redirect
agent-browser wait --url "**/" --not "**/login"

# 8. Verify logged in
agent-browser snapshot -i
# Should show user avatar/name in navbar

# 9. Take screenshot
agent-browser screenshot logged-in.png

# 10. Logout
agent-browser click "button:has(.lucide-user)" && \
agent-browser wait 500 && \
agent-browser click "text=Logout" || \
agent-browser click "text=退出"

# 11. Verify logged out
agent-browser wait 1000 && \
agent-browser snapshot -i
# Should show login button again

# 12. Close
agent-browser close
```

#### Expected Results
- [ ] Login page loads correctly
- [ ] Form accepts valid credentials
- [ ] User is redirected to homepage after login
- [ ] User avatar/name appears in navbar
- [ ] Logout works correctly
- [ ] User menu shows login option after logout

---

## 🔴 Negative Test Cases

### TC-N01: Search Without Dates Shows Error

**Priority**: P1  
**Category**: Validation  
**Type**: Negative

#### Description
Verify that attempting to search without dates shows appropriate feedback.

#### Test Steps

```bash
# 1. Open modal
agent-browser open http://localhost:5173 && \
agent-browser click ".search-bar" && \
agent-browser wait 1000

# 2. Try to click search without dates
agent-browser eval "
  const searchBtn = document.querySelector('button[type=\"submit\"]');
  if (searchBtn && searchBtn.disabled) {
    console.log('Search button is properly disabled');
    return true;
  }
  return false;
"

# 3. Verify button is disabled
agent-browser is enabled "button[type='submit']"
# Expected: false

# 4. Close
agent-browser close
```

#### Expected Results
- [ ] Search button is disabled when no dates selected
- [ ] Button text indicates action required
- [ ] Cannot submit form without dates

---

### TC-N02: Invalid Date Range (Checkout Before Checkin)

**Priority**: P1  
**Category**: Validation  
**Type**: Negative

#### Description
Verify that users cannot select a checkout date before check-in date.

#### Test Steps

```bash
# 1. Open modal
agent-browser open http://localhost:5173 && \
agent-browser click ".search-bar" && \
agent-browser wait 1000

# 2. Select check-in date (e.g., day 15)
agent-browser eval "
  const buttons = document.querySelectorAll('button[role=\"gridcell\"]');
  const futureButtons = Array.from(buttons).filter(btn => {
    return !btn.disabled && btn.getAttribute('data-date');
  });
  if (futureButtons[5]) futureButtons[5].click();
"

# 3. Wait for check-in selection
agent-browser wait 500

# 4. Try to select earlier date for checkout (should not work)
agent-browser eval "
  const buttons = document.querySelectorAll('button[role=\"gridcell\"]');
  const pastButtons = Array.from(buttons).filter(btn => {
    return btn.disabled;
  });
  console.log('Disabled buttons count:', pastButtons.length);
  return pastButtons.length > 0;
"

# 5. Verify calendar prevents invalid selection
agent-browser snapshot -i

# 6. Close
agent-browser close
```

#### Expected Results
- [ ] Calendar automatically disables dates before check-in
- [ ] Cannot select checkout date before check-in
- [ ] Visual indication of disabled dates
- [ ] User is guided to select valid checkout date

---

### TC-N03: API Failure Handling

**Priority**: P2  
**Category**: Error Handling  
**Type**: Negative

#### Description
Verify that the application handles API failures gracefully.

#### Test Steps

```bash
# 1. Navigate to homepage with network intercept
agent-browser open http://localhost:5173

# 2. Block API requests
agent-browser eval "
  // Intercept fetch requests
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    console.log('Blocked request:', args[0]);
    return Promise.reject(new Error('Network error'));
  };
"

# 3. Reload page
agent-browser eval "window.location.reload()"

# 4. Wait for error handling
agent-browser wait 2000

# 5. Check for error message
agent-browser snapshot -i
agent-browser get text ".text-red-500" || \
agent-browser get text "text=加载失败"

# 6. Verify retry button exists
agent-browser is visible "button:has-text('重试')"

# 7. Screenshot
agent-browser screenshot api-error-handling.png

# 8. Close
agent-browser close
```

#### Expected Results
- [ ] Error message is displayed
- [ ] "Retry" button is available
- [ ] No blank white screen
- [ ] User-friendly error message

---

## 🚀 Test Execution Strategy

### Recommended Execution Order

1. **Phase 1: Smoke Tests** (P0 - Critical)
   - TC-001: Homepage loads
   - TC-002: Search bar displays correctly
   - TC-003: Modal opens
   - TC-004: Date selection
   - TC-005: Search navigation

2. **Phase 2: Validation Tests** (P1 - High)
   - TC-006: Search button disabled
   - TC-007: Past dates disabled
   - TC-008: Language switch
   - TC-009: Mobile responsive

3. **Phase 3: Extended Tests** (P2 - Medium)
   - TC-010: User authentication
   - TC-N01: Validation errors
   - TC-N02: Invalid date range
   - TC-N03: API failure handling

### Batch Execution Script

Create `run-tests.sh`:

```bash
#!/bin/bash

echo "=== TML Villa Test Suite ==="
echo "Running tests with agent-browser CLI"
echo ""

# P0 Tests
echo "Phase 1: Smoke Tests (P0)"
agent-browser open http://localhost:5173 && \
agent-browser wait --load networkidle && \
agent-browser screenshot tc001-homepage.png

agent-browser open http://localhost:5173 && \
agent-browser click ".search-bar" && \
agent-browser wait 1000 && \
agent-browser screenshot tc003-modal.png

echo "P0 tests completed"

# P1 Tests
echo "Phase 2: Validation Tests (P1)"
# ... additional tests

echo "All tests completed. Check screenshots for results."
```

---

## 📊 Test Report Template

### Test Execution Summary

| Test ID | Test Case | Priority | Status | Notes |
|---------|-----------|----------|--------|-------|
| TC-001 | Homepage loads | P0 | ✅ PASS | |
| TC-002 | Search bar display | P0 | ⏳ PENDING | |
| TC-003 | Modal opens | P0 | ⏳ PENDING | |
| TC-004 | Date selection | P0 | ⏳ PENDING | |
| TC-005 | Search navigation | P0 | ⏳ PENDING | |
| TC-006 | Button disabled | P1 | ⏳ PENDING | |
| TC-007 | Past dates disabled | P1 | ⏳ PENDING | |
| TC-008 | Language switch | P1 | ⏳ PENDING | |
| TC-009 | Mobile responsive | P1 | ⏳ PENDING | |
| TC-010 | User login/logout | P2 | ⏳ PENDING | |
| TC-N01 | No dates error | P1 | ⏳ PENDING | |
| TC-N02 | Invalid date range | P1 | ⏳ PENDING | |
| TC-N03 | API failure | P2 | ⏳ PENDING | |

### Execution Environment

- **Date**: 2026-03-06
- **Browser**: Chromium (agent-browser default)
- **URL**: http://localhost:5173
- **Agent-Browser Version**: [to be filled]
- **Tester**: [to be filled]

---

## 🔧 Troubleshooting

### Common Issues

#### Issue: "Browser not found"
**Solution**: 
```bash
agent-browser install
```

#### Issue: "Cannot find element"
**Solution**: 
- Take snapshot first: `agent-browser snapshot -i`
- Use refs from snapshot: `agent-browser click @e1`
- Wait for element: `agent-browser wait 2000`

#### Issue: "Element not visible"
**Solution**:
- Check viewport size
- Wait for page load: `agent-browser wait --load networkidle`
- Check for modal/dropdown: `agent-browser is visible "[role='dialog']"`

#### Issue: "Date picker selectors don't work"
**Solution**:
- Use `eval` to interact with calendar directly
- Check calendar implementation: `agent-browser eval "document.querySelectorAll('button')"`
- Use more specific selectors: `[aria-label*='15']`

---

## 📚 Additional Resources

- **Agent-Browser Documentation**: https://agent-browser.dev/
- **Agent-Browser GitHub**: https://github.com/vercel-labs/agent-browser
- **TML Villa README**: /Users/tml001/projects/opencode/tml-villa/README.md
- **Test Setup**: /Users/tml001/projects/opencode/tml-villa/app/src/test/setup.ts

---

## 📝 Notes

- All test cases assume the application is running locally at `http://localhost:5173`
- Adjust selectors based on actual HTML structure
- Use `--headed` flag for visual debugging: `agent-browser --headed open url`
- For CI/CD, use headless mode (default)
- Save screenshots for test evidence

---

**Document Version**: 1.0  
**Last Updated**: 2026-03-06  
**Maintained By**: OpenCode Testing Team
