#!/bin/bash

# Fix all hardcoded localhost URLs in CMS components

# PageEditor.jsx
sed -i '' "s|'http://localhost:3001/api/pages'|\`\${API_URL}/api/pages\`|g" src/cms/PageEditor.jsx
sed -i '' "s|'http://localhost:3001/api/pages/\${pageName}'|\`\${API_URL}/api/pages/\${pageName}\`|g" src/cms/PageEditor.jsx
sed -i '' "1s|^|import { API_URL } from '../config'\n|" src/cms/PageEditor.jsx

# SettingsForm.jsx  
sed -i '' "s|'http://localhost:3001/api/settings'|\`\${API_URL}/api/settings\`|g" src/cms/SettingsForm.jsx
sed -i '' "s|'http://localhost:3001/api/upload'|\`\${API_URL}/api/upload\`|g" src/cms/SettingsForm.jsx
sed -i '' "s|\`http://localhost:3001\${data.url}\`|data.url|g" src/cms/SettingsForm.jsx
sed -i '' "1s|^|import { API_URL } from '../config'\n|" src/cms/SettingsForm.jsx

# ProjectForm.jsx
sed -i '' "s|'http://localhost:3001/api/upload'|\`\${API_URL}/api/upload\`|g" src/cms/ProjectForm.jsx
sed -i '' "s|\`http://localhost:3001\${data.url}\`|data.url|g" src/cms/ProjectForm.jsx
sed -i '' "1s|^|import { API_URL } from '../config'\n|" src/cms/ProjectForm.jsx

# NewsForm.jsx
sed -i '' "s|'http://localhost:3001/api/upload'|\`\${API_URL}/api/upload\`|g" src/cms/NewsForm.jsx
sed -i '' "s|\`http://localhost:3001\${data.url}\`|data.url|g" src/cms/NewsForm.jsx
sed -i '' "1s|^|import { API_URL } from '../config'\n|" src/cms/NewsForm.jsx

echo "✅ Fixed all API URLs in CMS components"
