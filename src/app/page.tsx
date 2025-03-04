import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
      <h1 className="text-4xl font-bold mb-6">Welcome to Skill Tracker</h1>
      <p className="text-xl mb-8 max-w-2xl">
        Track your progress, level up your skills, and build your own personalized skill tree.
      </p>
      <div className="flex gap-4">
        <Link 
          href="/login" 
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
        >
          Login
        </Link>
        <Link 
          href="/account/new" 
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
        >
          Create Account
        </Link>
      </div>
    </div>
  );
} 