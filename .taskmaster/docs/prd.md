# Kudosity App Refactoring PRD

## 1. Overview
This document outlines the requirements for refactoring the Kudosity v0 prototype. The goal is to create a well-structured and database-driven application.

## 2. Key Objectives
- Consolidate the codebase.
- Standardize UI components.
- Make all elements database-driven.

## 3. Core Requirements
- **Database:** Consolidate `contacts` and `profiles` tables. Remove backup tables. Standardize naming.
- **Navigation:** Refactor the routing system to be more robust and centralized.
- **UI:** Standardize all UI components, including tables, navigation, and page layouts.
- **Data Access:** Create a dedicated data access layer for all Supabase queries.
- **Page Layouts:** Create and use standardized page layout components.
