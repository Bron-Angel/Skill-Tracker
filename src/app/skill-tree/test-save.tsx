'use client';

import { useState } from 'react';

export default function TestSaveSkillTree() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const testSaveSkillTree = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

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
        {
          levelId: '3b9ce9ef-35d5-45f1-9bd0-73fc3e689a4c', // Level 2
          skillId: '391c7a18-bde9-4a5f-9a7b-b89e14431965', // Doors
          position: 0,
        },
      ];

      console.log('Sending test skill tree config:', skillTreeConfig);

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
      console.log('Save result:', data);
      setResult(data);
    } catch (err: any) {
      console.error('Error saving skill tree:', err);
      setError(err.message || 'Failed to save skill tree');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test Save Skill Tree</h1>
      
      <button
        onClick={testSaveSkillTree}
        disabled={loading}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors disabled:opacity-50 mb-6"
      >
        {loading ? 'Saving...' : 'Test Save Skill Tree'}
      </button>

      {error && (
        <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {result && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Result:</h2>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Test Data:</h2>
        <p className="mb-2">This test will save the following skill tree configuration:</p>
        <ul className="list-disc pl-6 mb-4">
          <li>Level 1: Clean chairs, Water plants</li>
          <li>Level 2: Doors</li>
        </ul>
        <p>
          After running the test, check the <code>data/userSkillTreeConfig.json</code> file to see if the data was saved correctly.
        </p>
      </div>
    </div>
  );
} 