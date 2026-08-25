import sys

# Replace with your actual PythonAnywhere path.
project_home = "/home/YOUR_USERNAME/indian_salary_calculator/backend"

if project_home not in sys.path:
    sys.path.insert(0, project_home)

from app import app as application
