#!/bin/bash
cd /home/kavia/workspace/code-generation/user-portal-platform-228610-228620/user_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

