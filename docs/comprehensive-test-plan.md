# TML Villa - Comprehensive Test Plan

> **Test Type**: 全面测试 (Comprehensive Testing)  
> **Date**: 2026-03-06  
> **Framework**: agent-browser CLI  
> **Target**: http://localhost:5173

---

## 📊 Test Coverage Overview

### Test Phases

| Phase | Name | Priority | Tests Count | Duration |
|-------|------|----------|-------------|----------|
| 1 | Core User Flows | P0 | 8 | ~5 min |
| 2 | Navigation & Auth | P0 | 6 | ~4 min |
| 3 | Responsive Design | P1 | 5 | ~3 min |
| 4 | Admin Panel | P1 | 4 | ~3 min |
| 5 | Edge Cases | P2 | 4 | ~2 min |
| **Total** | | | **27** | **~17 min** |

---

## Phase 1: Core User Flows (P0 - Critical)

### 1.1 Homepage & Branding
- [x] TC-001: Homepage loads successfully
- [x] TC-002: Search bar displays minimal design (2 fields)
- [x] TC-003: Modal opens on click
- [ ] TC-011: Logo and branding visible
- [ ] TC-012: Footer section displays

### 1.2 Search Functionality
- [x] TC-004: Date selection flow
- [ ] TC-013: Search results page loads
- [ ] TC-014: Homestay cards display correctly
- [ ] TC-015: Empty search results handling

### 1.3 Villa Detail Page
- [ ] TC-016: Villa detail page loads
- [ ] TC-017: Image gallery works
- [ ] TC-018: Amenities list displays
- [ ] TC-019: Booking form accessible

---

## Phase 2: Navigation & Authentication (P0 - Critical)

### 2.1 Main Navigation
- [ ] TC-020: All nav links work
- [ ] TC-021: Car rental page loads
- [ ] TC-022: Meal order page loads
- [ ] TC-023: Ticket booking page loads

### 2.2 User Authentication
- [ ] TC-024: Login page loads
- [ ] TC-025: Login with valid credentials
- [ ] TC-026: Login with invalid credentials shows error
- [ ] TC-027: Logout functionality

### 2.3 User Center
- [ ] TC-028: User center page loads
- [ ] TC-029: Orders tab displays
- [ ] TC-030: Profile information visible

---

## Phase 3: Responsive Design (P1 - High)

### 3.1 Mobile (375px width)
- [ ] TC-031: Mobile layout renders correctly
- [ ] TC-032: Mobile menu works
- [ ] TC-033: Touch targets large enough

### 3.2 Tablet (768px width)
- [ ] TC-034: Tablet layout renders correctly

### 3.3 Desktop (1440px width)
- [ ] TC-035: Desktop layout renders correctly

---

## Phase 4: Admin Panel (P1 - High)

### 4.1 Admin Access
- [ ] TC-036: Admin login works
- [ ] TC-037: Dashboard loads

### 4.2 Admin Features
- [ ] TC-038: Inventory management accessible
- [ ] TC-039: Order management works

---

## Phase 5: Edge Cases (P2 - Medium)

- [ ] TC-040: 404 page handling
- [ ] TC-041: Network error handling
- [ ] TC-042: Slow connection handling
- [ ] TC-043: Form validation errors

---

## 🚀 Execution Script

```bash
#!/bin/bash
# comprehensive-test.sh

echo "═══════════════════════════════════════"
echo "  TML Villa Comprehensive Test Suite"
echo "═══════════════════════════════════════"
echo ""

mkdir -p comprehensive-test-results

# Phase 1: Core User Flows
echo "📋 Phase 1: Core User Flows"
source ./test-scripts/phase1-core-flows.sh

# Phase 2: Navigation & Auth
echo "📋 Phase 2: Navigation & Authentication"
source ./test-scripts/phase2-navigation.sh

# Phase 3: Responsive Design
echo "📋 Phase 3: Responsive Design"
source ./test-scripts/phase3-responsive.sh

# Phase 4: Admin Panel
echo "📋 Phase 4: Admin Panel"
source ./test-scripts/phase4-admin.sh

# Phase 5: Edge Cases
echo "📋 Phase 5: Edge Cases"
source ./test-scripts/phase5-edge-cases.sh

echo ""
echo "═══════════════════════════════════════"
echo "  Test Execution Complete"
echo "  Results: comprehensive-test-results/"
echo "═══════════════════════════════════════"
```

---

## 📁 Test Evidence Structure

```
comprehensive-test-results/
├── phase1-core-flows/
│   ├── tc011-homepage-branding.png
│   ├── tc012-footer.png
│   ├── tc013-search-results.png
│   └── ...
├── phase2-navigation/
│   ├── tc020-nav-links.png
│   ├── tc024-login-page.png
│   └── ...
├── phase3-responsive/
│   ├── tc031-mobile-375px.png
│   ├── tc034-tablet-768px.png
│   └── ...
├── phase4-admin/
│   └── ...
├── phase5-edge-cases/
│   └── ...
└── TEST-REPORT-COMPREHENSIVE.md
```

---

## ✅ Success Criteria

**Minimum Passing**: 80% of P0 tests (12/15)  
**Target**: 100% of P0 + 90% of P1 (24/27)  
**Excellent**: 100% all tests

---

**Plan Version**: 1.0  
**Last Updated**: 2026-03-06
