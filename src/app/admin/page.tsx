'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Level {
  id: string;
  name: string;
  experienceNeeded: number;
  newSkillCount: number;
}

interface Skill {
  id: string;
  name: string;
  experienceNeeded: number;
  emoji: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [levels, setLevels] = useState<Level[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [activeTab, setActiveTab] = useState('levels');
  const [isImporting, setIsImporting] = useState(false);
  
  // Form states
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [newLevel, setNewLevel] = useState({
    name: '',
    experienceNeeded: 10,
    newSkillCount: 2,
  });
  const [newSkill, setNewSkill] = useState({
    name: '',
    experienceNeeded: 4,
    emoji: '❓',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if (session?.user?.name !== 'admin') {
        router.push('/');
      } else {
        fetchAdminData();
      }
    }
  }, [status, session, router]);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [levelsResponse, skillsResponse] = await Promise.all([
        fetch('/api/admin/levels'),
        fetch('/api/admin/skills'),
      ]);

      if (!levelsResponse.ok || !skillsResponse.ok) {
        throw new Error('Failed to fetch admin data');
      }

      const levelsData = await levelsResponse.json();
      const skillsData = await skillsResponse.json();

      setLevels(levelsData.levels);
      setSkills(skillsData.skills);
    } catch (err) {
      setError('Failed to load admin data. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/levels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newLevel),
      });

      if (!response.ok) {
        throw new Error('Failed to create level');
      }

      const data = await response.json();
      setLevels([...levels, data.level]);
      setNewLevel({
        name: '',
        experienceNeeded: 10,
        newSkillCount: 2,
      });
    } catch (err) {
      setError('Failed to create level. Please try again.');
      console.error(err);
    }
  };

  const handleUpdateLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLevel) return;

    try {
      const response = await fetch(`/api/admin/levels/${editingLevel.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingLevel),
      });

      if (!response.ok) {
        throw new Error('Failed to update level');
      }

      const data = await response.json();
      setLevels(levels.map((level) => (level.id === data.level.id ? data.level : level)));
      setEditingLevel(null);
    } catch (err) {
      setError('Failed to update level. Please try again.');
      console.error(err);
    }
  };

  const handleDeleteLevel = async (id: string) => {
    if (!confirm('Are you sure you want to delete this level?')) return;

    try {
      const response = await fetch(`/api/admin/levels/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete level');
      }

      setLevels(levels.filter((level) => level.id !== id));
    } catch (err) {
      setError('Failed to delete level. Please try again.');
      console.error(err);
    }
  };

  const handleCreateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSkill),
      });

      if (!response.ok) {
        throw new Error('Failed to create skill');
      }

      const data = await response.json();
      setSkills([...skills, data.skill]);
      setNewSkill({
        name: '',
        experienceNeeded: 4,
        emoji: '❓',
      });
    } catch (err) {
      setError('Failed to create skill. Please try again.');
      console.error(err);
    }
  };

  const handleUpdateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSkill) return;

    try {
      const response = await fetch(`/api/admin/skills/${editingSkill.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingSkill),
      });

      if (!response.ok) {
        throw new Error('Failed to update skill');
      }

      const data = await response.json();
      setSkills(skills.map((skill) => (skill.id === data.skill.id ? data.skill : skill)));
      setEditingSkill(null);
    } catch (err) {
      setError('Failed to update skill. Please try again.');
      console.error(err);
    }
  };

  const handleDeleteSkill = async (id: string) => {
    if (!confirm('Are you sure you want to delete this skill?')) return;

    try {
      const response = await fetch(`/api/admin/skills/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete skill');
      }

      setSkills(skills.filter((skill) => skill.id !== id));
    } catch (err) {
      setError('Failed to delete skill. Please try again.');
      console.error(err);
    }
  };

  const handleImportTestData = async () => {
    setIsImporting(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/import-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to import test data');
      }

      setSuccess('Test data imported successfully!');
      // Refresh the data
      fetchAdminData();
    } catch (err) {
      setError('Failed to import test data. Please try again.');
      console.error(err);
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (session?.user?.name !== 'admin') {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
        <p className="text-red-600">You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Admin Dashboard</h1>
      
      {error && (
        <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-3 bg-green-100 text-green-700 rounded-md">
          {success}
        </div>
      )}

      <div className="mb-6 flex justify-end">
        <button
          onClick={handleImportTestData}
          disabled={isImporting}
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isImporting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Importing...
            </>
          ) : (
            'Import Test Data'
          )}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex border-b">
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'levels'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('levels')}
          >
            Levels
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'skills'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('skills')}
          >
            Skills
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'levels' ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">Manage Levels</h2>
              
              {/* Create Level Form */}
              <div className="mb-8 p-4 bg-gray-50 rounded-md">
                <h3 className="text-lg font-medium mb-3">Create New Level</h3>
                <form onSubmit={handleCreateLevel} className="space-y-4">
                  <div>
                    <label htmlFor="levelName" className="block text-sm font-medium text-gray-700 mb-1">
                      Level Name
                    </label>
                    <input
                      type="text"
                      id="levelName"
                      value={newLevel.name}
                      onChange={(e) => setNewLevel({ ...newLevel, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="levelExp" className="block text-sm font-medium text-gray-700 mb-1">
                      Experience Needed
                    </label>
                    <input
                      type="number"
                      id="levelExp"
                      value={newLevel.experienceNeeded}
                      onChange={(e) => setNewLevel({ ...newLevel, experienceNeeded: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="skillCount" className="block text-sm font-medium text-gray-700 mb-1">
                      Skill Slots
                    </label>
                    <input
                      type="number"
                      id="skillCount"
                      value={newLevel.newSkillCount}
                      onChange={(e) => setNewLevel({ ...newLevel, newSkillCount: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="1"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Create Level
                  </button>
                </form>
              </div>

              {/* Edit Level Form */}
              {editingLevel && (
                <div className="mb-8 p-4 bg-blue-50 rounded-md">
                  <h3 className="text-lg font-medium mb-3">Edit Level</h3>
                  <form onSubmit={handleUpdateLevel} className="space-y-4">
                    <div>
                      <label htmlFor="editLevelName" className="block text-sm font-medium text-gray-700 mb-1">
                        Level Name
                      </label>
                      <input
                        type="text"
                        id="editLevelName"
                        value={editingLevel.name}
                        onChange={(e) => setEditingLevel({ ...editingLevel, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="editLevelExp" className="block text-sm font-medium text-gray-700 mb-1">
                        Experience Needed
                      </label>
                      <input
                        type="number"
                        id="editLevelExp"
                        value={editingLevel.experienceNeeded}
                        onChange={(e) =>
                          setEditingLevel({ ...editingLevel, experienceNeeded: parseInt(e.target.value) })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="editSkillCount" className="block text-sm font-medium text-gray-700 mb-1">
                        Skill Slots
                      </label>
                      <input
                        type="number"
                        id="editSkillCount"
                        value={editingLevel.newSkillCount}
                        onChange={(e) =>
                          setEditingLevel({ ...editingLevel, newSkillCount: parseInt(e.target.value) })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        min="1"
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Update Level
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingLevel(null)}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Levels List */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Experience Needed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Skill Slots
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {levels.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                          No levels found
                        </td>
                      </tr>
                    ) : (
                      levels.map((level) => (
                        <tr key={level.id}>
                          <td className="px-6 py-4 whitespace-nowrap">{level.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{level.experienceNeeded} XP</td>
                          <td className="px-6 py-4 whitespace-nowrap">{level.newSkillCount}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => setEditingLevel(level)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteLevel(level.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold mb-4">Manage Skills</h2>
              
              {/* Create Skill Form */}
              <div className="mb-8 p-4 bg-gray-50 rounded-md">
                <h3 className="text-lg font-medium mb-3">Create New Skill</h3>
                <form onSubmit={handleCreateSkill} className="space-y-4">
                  <div>
                    <label htmlFor="skillName" className="block text-sm font-medium text-gray-700 mb-1">
                      Skill Name
                    </label>
                    <input
                      type="text"
                      id="skillName"
                      value={newSkill.name}
                      onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="skillExp" className="block text-sm font-medium text-gray-700 mb-1">
                      Experience Needed
                    </label>
                    <input
                      type="number"
                      id="skillExp"
                      value={newSkill.experienceNeeded}
                      onChange={(e) => setNewSkill({ ...newSkill, experienceNeeded: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="emoji" className="block text-sm font-medium text-gray-700 mb-1">
                      Emoji
                    </label>
                    <input
                      type="text"
                      id="emoji"
                      value={newSkill.emoji}
                      onChange={(e) => setNewSkill({ ...newSkill, emoji: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="🔍"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter an emoji to represent this skill
                    </p>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Create Skill
                  </button>
                </form>
              </div>

              {/* Edit Skill Form */}
              {editingSkill && (
                <div className="mb-8 p-4 bg-blue-50 rounded-md">
                  <h3 className="text-lg font-medium mb-3">Edit Skill</h3>
                  <form onSubmit={handleUpdateSkill} className="space-y-4">
                    <div>
                      <label htmlFor="editSkillName" className="block text-sm font-medium text-gray-700 mb-1">
                        Skill Name
                      </label>
                      <input
                        type="text"
                        id="editSkillName"
                        value={editingSkill.name}
                        onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="editSkillExp" className="block text-sm font-medium text-gray-700 mb-1">
                        Experience Needed
                      </label>
                      <input
                        type="number"
                        id="editSkillExp"
                        value={editingSkill.experienceNeeded}
                        onChange={(e) =>
                          setEditingSkill({ ...editingSkill, experienceNeeded: parseInt(e.target.value) })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="editEmoji" className="block text-sm font-medium text-gray-700 mb-1">
                        Emoji
                      </label>
                      <input
                        type="text"
                        id="editEmoji"
                        value={editingSkill.emoji}
                        onChange={(e) => setEditingSkill({ ...editingSkill, emoji: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="🔍"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter an emoji to represent this skill
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Update Skill
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSkill(null)}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Skills List */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Experience Needed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Emoji
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {skills.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                          No skills found
                        </td>
                      </tr>
                    ) : (
                      skills.map((skill) => (
                        <tr key={skill.id}>
                          <td className="px-6 py-4 whitespace-nowrap">{skill.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{skill.experienceNeeded} XP</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-4xl">{skill.emoji}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => setEditingSkill(skill)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteSkill(skill.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 