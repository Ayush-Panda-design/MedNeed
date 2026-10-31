import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
      <div className="text-6xl">🩺</div>
      <h2 className="text-2xl font-black text-slate-900">Page Not Found</h2>
      <p className="text-xs text-slate-500">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="pt-2">
        <Link
          href="/"
          className="inline-block bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
