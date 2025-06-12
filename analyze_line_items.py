#!/usr/bin/env python3
"""Analyze line items requested by different agents to determine superset size."""

import re
import os
from collections import defaultdict

def extract_line_items_from_file(filepath):
    """Extract line items from a single agent file."""
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Find search_line_items calls
    pattern = r'search_line_items\s*\(\s*ticker,\s*\[(.*?)\]'
    matches = re.findall(pattern, content, re.DOTALL)
    
    line_items = []
    for match in matches:
        # Extract individual line items
        items = re.findall(r'"([^"]+)"', match)
        line_items.extend(items)
    
    return line_items

def analyze_all_agents():
    """Analyze line items from all agent files."""
    agents_dir = "src/agents"
    agent_line_items = {}
    all_line_items = set()
    
    # Process each agent file
    for filename in os.listdir(agents_dir):
        if filename.endswith('.py') and filename != '__init__.py':
            filepath = os.path.join(agents_dir, filename)
            agent_name = filename.replace('.py', '')
            
            line_items = extract_line_items_from_file(filepath)
            if line_items:
                agent_line_items[agent_name] = line_items
                all_line_items.update(line_items)
    
    return agent_line_items, all_line_items

def main():
    print("🔍 Analyzing Line Items Requested by Agents")
    print("=" * 60)
    
    agent_line_items, all_line_items = analyze_all_agents()
    
    # Print individual agent requests
    print(f"\n📊 Individual Agent Requests:")
    print("-" * 40)
    
    total_individual_requests = 0
    for agent, items in agent_line_items.items():
        print(f"{agent:25} | {len(items):2} items | {', '.join(items[:3])}{'...' if len(items) > 3 else ''}")
        total_individual_requests += len(items)
    
    # Print superset analysis
    print(f"\n🎯 Superset Analysis:")
    print("-" * 40)
    print(f"Total unique line items (SUPERSET): {len(all_line_items)}")
    print(f"Total individual requests:           {total_individual_requests}")
    print(f"Efficiency gain:                     {(1 - len(all_line_items)/total_individual_requests)*100:.1f}%")
    
    # Print the complete superset
    print(f"\n📋 Complete Superset ({len(all_line_items)} items):")
    print("-" * 40)
    sorted_items = sorted(all_line_items)
    for i, item in enumerate(sorted_items, 1):
        print(f"{i:2}. {item}")
    
    # Frequency analysis
    print(f"\n📈 Most Requested Line Items:")
    print("-" * 40)
    item_frequency = defaultdict(int)
    for agent, items in agent_line_items.items():
        for item in items:
            item_frequency[item] += 1
    
    # Sort by frequency
    sorted_by_freq = sorted(item_frequency.items(), key=lambda x: x[1], reverse=True)
    for item, freq in sorted_by_freq[:10]:
        print(f"{item:35} | {freq} agents")

if __name__ == "__main__":
    main() 