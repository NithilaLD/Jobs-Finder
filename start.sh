#!/bin/bash
cd "$(dirname "$0")"
export PYTHONDONTWRITEBYTECODE=1
python3 scanner.py
