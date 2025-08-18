#!/bin/bash

# Clean Test Artifacts Script  
# This script removes all test screenshots, logs, and artifacts for complete cleanup

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Cleaning Test Artifacts ===${NC}"

# Change to project root directory
cd "$(dirname "$0")/.." || exit 1

# Function to clean screenshots directory
clean_screenshots() {
    local screenshot_dir="tests/screenshots"
    
    if [ -d "$screenshot_dir" ]; then
        # Count total screenshots
        total_count=$(find "$screenshot_dir" -name "*.png" -type f 2>/dev/null | wc -l)
        
        if [ "$total_count" -gt 0 ]; then
            echo -e "${YELLOW}Found $total_count screenshot(s) in $screenshot_dir${NC}"
            echo "Removing all screenshots..."
            
            # Remove all screenshots
            find "$screenshot_dir" -name "*.png" -type f -delete
            echo -e "${GREEN}Removed all $total_count screenshot(s)${NC}"
        else
            echo "No screenshots found in $screenshot_dir"
        fi
    else
        echo "$screenshot_dir directory does not exist"
    fi
}

# Function to clean test-results directory
clean_test_results() {
    local test_results_dir="test-results"
    
    if [ -d "$test_results_dir" ]; then
        echo -e "${YELLOW}Cleaning $test_results_dir directory...${NC}"
        rm -rf "$test_results_dir"/*
        echo -e "${GREEN}Cleaned $test_results_dir${NC}"
    else
        echo "$test_results_dir directory does not exist"
    fi
}

# Function to clean playwright-report directory
clean_playwright_report() {
    local report_dir="playwright-report"
    
    if [ -d "$report_dir" ]; then
        echo -e "${YELLOW}Cleaning $report_dir directory...${NC}"
        rm -rf "$report_dir"/*
        echo -e "${GREEN}Cleaned $report_dir${NC}"
    else
        echo "$report_dir directory does not exist"
    fi
}

# Function to clean log files in logs directory 
clean_logs() {
    local logs_dir="logs"
    
    if [ -d "$logs_dir" ]; then
        # Count log files
        log_count=$(find "$logs_dir" -name "*.log" -type f 2>/dev/null | wc -l)
        
        if [ "$log_count" -gt 0 ]; then
            echo -e "${YELLOW}Found $log_count log file(s) in $logs_dir${NC}"
            echo "Removing all log files..."
            
            # Remove all log files
            find "$logs_dir" -name "*.log" -type f -delete
            echo -e "${GREEN}Removed all $log_count log file(s)${NC}"
        else
            echo "No log files found in $logs_dir"
        fi
        
        # Also clean old screenshots in logs directory
        screenshot_count=$(find "$logs_dir" -name "*.png" -type f 2>/dev/null | wc -l)
        if [ "$screenshot_count" -gt 0 ]; then
            echo -e "${YELLOW}Found $screenshot_count screenshot(s) in $logs_dir${NC}"
            echo "Removing all screenshots from logs directory..."
            find "$logs_dir" -name "*.png" -type f -delete
            echo -e "${GREEN}Removed $screenshot_count screenshot(s) from logs${NC}"
        fi
    fi
}

# Execute cleaning functions
echo ""
clean_screenshots
echo ""
clean_test_results
echo ""
clean_playwright_report
echo ""
clean_logs
echo ""

echo -e "${GREEN}=== Cleanup Complete ===${NC}"
echo ""
echo "To prevent test artifacts from being tracked by git, the following"
echo "directories have been added to .gitignore:"
echo "  - tests/screenshots/"
echo "  - test-results/"
echo "  - playwright-report/"
echo ""
echo "Run this script when you want to completely clean all test artifacts."