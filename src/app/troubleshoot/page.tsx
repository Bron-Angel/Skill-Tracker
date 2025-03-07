'use client';

import { useState, useEffect } from 'react';

export default function TroubleshootPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [fileContent, setFileContent] = useState<string>('');
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };

  const checkFileContent = async () => {
    addLog('Checking userSkillTreeConfig.json file content...');
    try {
      const response = await fetch('/api/troubleshoot/file-content');
      if (!response.ok) {
        throw new Error('Failed to fetch file content');
      }
      const data = await response.json();
      setFileContent(JSON.stringify(data.content, null, 2));
      addLog('File content retrieved successfully');
    } catch (error) {
      addLog(`Error checking file content: ${error}`);
    }
  };

  const testSaveConfig = async () => {
    setIsLoading(true);
    addLog('Testing skill tree configuration save...');
    try {
      // Sample skill tree configuration
      const skillTreeConfig = [
        {
          levelId: 'c4fe2c86-ee05-4787-ac76-3ccd32966a97', // Level 1
          skillId: '9ddd219c-d4be-40fb-a435-e1846a90053d', // Clean chairs
          position: 0,
        },
        {
          levelId: 'c4fe2c86-ee05-4787-ac76-3ccd32966a97', // Level 1
          skillId: '90016368-92bf-4f70-805d-ab9830946769', // Water plants
          position: 1,
        },
      ];

      addLog(`Sending test config: ${JSON.stringify(skillTreeConfig)}`);

      const response = await fetch('/api/skill-tree', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ skillTreeConfig }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save skill tree');
      }

      const data = await response.json();
      setTestResult(JSON.stringify(data, null, 2));
      addLog('Test save completed successfully');
      
      // Check file content after save
      await checkFileContent();
    } catch (error) {
      addLog(`Error testing save: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testFilePermissions = async () => {
    addLog('Testing file permissions...');
    try {
      const response = await fetch('/api/troubleshoot/file-permissions');
      if (!response.ok) {
        throw new Error('Failed to test file permissions');
      }
      const data = await response.json();
      addLog(`File permissions test result: ${data.message}`);
    } catch (error) {
      addLog(`Error testing file permissions: ${error}`);
    }
  };

  const resetFile = async () => {
    addLog('Resetting userSkillTreeConfig.json file...');
    try {
      const response = await fetch('/api/troubleshoot/reset-file', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to reset file');
      }
      const data = await response.json();
      addLog(`File reset result: ${data.message}`);
      
      // Check file content after reset
      await checkFileContent();
    } catch (error) {
      addLog(`Error resetting file: ${error}`);
    }
  };

  useEffect(() => {
    // Initial check of file content
    checkFileContent();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Skill Tree Troubleshooting</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          
          <div className="space-y-4">
            <button
              onClick={checkFileContent}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
            >
              Check File Content
            </button>
            
            <button
              onClick={testSaveConfig}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : 'Test Save Configuration'}
            </button>
            
            <button
              onClick={testFilePermissions}
              className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-md transition-colors"
            >
              Test File Permissions
            </button>
            
            <button
              onClick={resetFile}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors"
            >
              Reset File
            </button>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Logs</h2>
          
          <div className="h-64 overflow-y-auto bg-gray-100 p-4 rounded-md font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet. Run some actions to see logs.</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">File Content</h2>
          
          <pre className="h-64 overflow-y-auto bg-gray-100 p-4 rounded-md font-mono text-sm">
            {fileContent || 'No file content available'}
          </pre>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Test Result</h2>
          
          <pre className="h-64 overflow-y-auto bg-gray-100 p-4 rounded-md font-mono text-sm">
            {testResult || 'No test result available'}
          </pre>
        </div>
      </div>
    </div>
  );
} 