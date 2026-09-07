import pandas as pd
import sys

try:
    df = pd.read_excel('/Users/ahmadwahyuaji/Downloads/data aji 2.xls')
    print("COLUMNS:")
    for col in df.columns:
        print(f" - {col}")
    print("\nSAMPLE DATA:")
    print(df.head(3).to_string())
except Exception as e:
    print(f"Error reading file: {e}")
