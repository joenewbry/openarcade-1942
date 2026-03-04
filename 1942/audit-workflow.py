#!/usr/bin/env python3
"""
1942 Tile Project Workflow Audit System
Tracks progress, identifies bottlenecks, generates insights
"""

import csv
import json
from datetime import datetime, timedelta
from collections import defaultdict, Counter

def load_project_data(csv_path):
    """Load project tracking data from CSV"""
    tasks = []
    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            tasks.append(row)
    return tasks

def analyze_workflow(tasks):
    """Generate workflow insights and metrics"""
    
    # Status breakdown
    status_counts = Counter(task['Status'] for task in tasks)
    
    # Assignee workload
    assignee_load = defaultdict(list)
    for task in tasks:
        if task['Assignee'] != 'TBD':
            assignee_load[task['Assignee']].append(task)
    
    # Component breakdown
    component_progress = defaultdict(list)
    for task in tasks:
        component_progress[task['Component']].append(task)
    
    # Campaign coverage
    campaign_status = defaultdict(list)
    for task in tasks:
        if task['Campaign'] != 'All':
            campaign_status[task['Campaign']].append(task)
    
    # Dependency analysis
    blocked_tasks = [task for task in tasks if task['Status'] == 'BLOCKED']
    dependency_chains = []
    for task in blocked_tasks:
        if task['Dependencies']:
            dependency_chains.append({
                'blocked_task': task['Task_Name'],
                'dependencies': task['Dependencies'],
                'impact': task['Priority']
            })
    
    # Time estimation accuracy (for completed tasks)
    time_accuracy = []
    for task in tasks:
        if task['Status'] == 'COMPLETED' and task['Estimated_Hours'] and task['Actual_Hours']:
            estimated = float(task['Estimated_Hours'])
            actual = float(task['Actual_Hours'])
            accuracy = abs(estimated - actual) / estimated
            time_accuracy.append({
                'task': task['Task_Name'],
                'estimated': estimated,
                'actual': actual,
                'variance': actual - estimated,
                'accuracy_pct': round((1 - accuracy) * 100, 1)
            })
    
    return {
        'status_breakdown': dict(status_counts),
        'assignee_workload': dict(assignee_load),
        'component_progress': dict(component_progress),
        'campaign_status': dict(campaign_status),
        'dependency_analysis': dependency_chains,
        'time_accuracy': time_accuracy,
        'total_tasks': len(tasks),
        'completed_tasks': len([t for t in tasks if t['Status'] == 'COMPLETED'])
    }

def generate_insights(analysis):
    """Generate actionable insights from workflow analysis"""
    insights = []
    
    # Progress insights
    completion_rate = analysis['completed_tasks'] / analysis['total_tasks'] * 100
    insights.append(f"Project is {completion_rate:.1f}% complete ({analysis['completed_tasks']}/{analysis['total_tasks']} tasks)")
    
    # Bottleneck identification
    if analysis['dependency_analysis']:
        insights.append(f"⚠️  {len(analysis['dependency_analysis'])} tasks blocked by dependencies")
        for block in analysis['dependency_analysis']:
            insights.append(f"   - {block['blocked_task']} waiting on {block['dependencies']}")
    
    # Workload distribution
    active_agents = {k: v for k, v in analysis['assignee_workload'].items() 
                    if any(task['Status'] == 'IN_PROGRESS' for task in v)}
    if active_agents:
        insights.append(f"🏃‍♂️ {len(active_agents)} agents actively working")
    
    # Component analysis
    component_status = {}
    for comp, tasks in analysis['component_progress'].items():
        completed = len([t for t in tasks if t['Status'] == 'COMPLETED'])
        total = len(tasks)
        component_status[comp] = f"{completed}/{total}"
    
    insights.append("📊 Component Progress:")
    for comp, progress in component_status.items():
        insights.append(f"   - {comp}: {progress}")
    
    # Time estimation accuracy
    if analysis['time_accuracy']:
        avg_accuracy = sum(t['accuracy_pct'] for t in analysis['time_accuracy']) / len(analysis['time_accuracy'])
        insights.append(f"⏱️  Time estimation accuracy: {avg_accuracy:.1f}% average")
        
        # Identify patterns
        overruns = [t for t in analysis['time_accuracy'] if t['variance'] > 0]
        if overruns:
            insights.append(f"   - {len(overruns)} tasks took longer than estimated")
    
    return insights

def export_audit_report(analysis, insights, output_path):
    """Export comprehensive audit report"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    report = {
        'timestamp': timestamp,
        'summary': {
            'total_tasks': analysis['total_tasks'],
            'completed_tasks': analysis['completed_tasks'],
            'completion_percentage': round(analysis['completed_tasks'] / analysis['total_tasks'] * 100, 1),
            'active_agents': len([k for k, v in analysis['assignee_workload'].items() 
                                if any(task['Status'] == 'IN_PROGRESS' for task in v)]),
            'blocked_tasks': len(analysis['dependency_analysis'])
        },
        'detailed_analysis': analysis,
        'insights': insights
    }
    
    with open(output_path, 'w') as f:
        json.dump(report, f, indent=2)
    
    return report

def print_dashboard(analysis, insights):
    """Print formatted dashboard to console"""
    print("=" * 60)
    print("🎮 1942 TILE PROJECT AUDIT DASHBOARD")
    print("=" * 60)
    print(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S PST')}")
    print()
    
    print("📈 KEY INSIGHTS:")
    for insight in insights:
        print(f"   {insight}")
    print()
    
    print("🔧 STATUS BREAKDOWN:")
    for status, count in analysis['status_breakdown'].items():
        print(f"   {status}: {count}")
    print()
    
    if analysis['dependency_analysis']:
        print("🚨 CRITICAL DEPENDENCIES:")
        for dep in analysis['dependency_analysis']:
            print(f"   {dep['blocked_task']} ← {dep['dependencies']} ({dep['impact']} priority)")
        print()
    
    print("=" * 60)

if __name__ == "__main__":
    # Run audit
    tasks = load_project_data('/Users/joe/dev/openarcade/1942/project-tracking.csv')
    analysis = analyze_workflow(tasks)
    insights = generate_insights(analysis)
    
    # Export report
    report_path = f"/Users/joe/dev/openarcade/1942/audit-report-{datetime.now().strftime('%Y%m%d-%H%M')}.json"
    export_audit_report(analysis, insights, report_path)
    
    # Print dashboard
    print_dashboard(analysis, insights)
    
    print(f"📋 Detailed report saved: {report_path}")