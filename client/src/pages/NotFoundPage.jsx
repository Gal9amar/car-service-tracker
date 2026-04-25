import { Link } from 'react-router-dom';
import { Car, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900 px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
            <Car className="w-12 h-12 text-brand-500" />
          </div>
        </div>
        <h1 className="text-7xl font-bold text-brand-500 mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-surface-800 dark:text-surface-100 mb-3">
          הדף לא נמצא
        </h2>
        <p className="text-surface-500 dark:text-surface-400 mb-8">
          נראה שהגעת לכתובת שלא קיימת. בוא נחזיר אותך למסלול.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          <Home className="w-5 h-5" />
          חזרה לדשבורד
        </Link>
      </div>
    </div>
  );
}
